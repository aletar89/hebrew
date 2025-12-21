import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageDir = path.join(__dirname, '..', 'public', 'images');
const audioDir = path.join(__dirname, '..', 'public', 'audio');
const validExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif']);
const audioExtensions = new Set(['.wav', '.mp3', '.ogg', '.webm']);
const force = process.argv.includes('--force');
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const modelName = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const voiceName = process.env.GEMINI_TTS_VOICE || 'puck';
const targetMimeType = process.env.GEMINI_TTS_MIME || 'audio/wav'; // ask for browser-friendly WAV by default
const maxRetries = Number(process.env.GEMINI_TTS_MAX_RETRIES ?? 5);
const baseBackoffMs = Number(process.env.GEMINI_TTS_BACKOFF_MS ?? 2000);

if (!apiKey) {
  console.error('Missing API key. Set GEMINI_API_KEY (or API_KEY) with a Gemini API key.');
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey });

async function listImageWords() {
  const entries = await fs.readdir(imageDir, { withFileTypes: true });
  const words = new Set();

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!validExtensions.has(ext)) continue;

    const word = path.basename(entry.name, ext);
    if (word) {
      words.add(word);
    }
  }

  return Array.from(words);
}

async function listAudioWords() {
  try {
    const entries = await fs.readdir(audioDir, { withFileTypes: true });
    const words = new Set();

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!audioExtensions.has(ext)) continue;
      const word = path.basename(entry.name, ext);
      if (word) {
        words.add(word);
      }
    }

    return Array.from(words);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function mimeTypeToExtension(mimeType) {
  if (!mimeType) return 'mp3';
  const base = mimeType.split(';')[0].trim().toLowerCase();
  if (base.includes('mpeg') || base.includes('mp3')) return 'mp3';
  if (base.includes('wav')) return 'wav';
  if (base.includes('ogg')) return 'ogg';
  if (base.includes('webm')) return 'webm';
  if (base.includes('l16') || base.includes('pcm')) return 'pcm';
  return base.split('/').pop() || 'mp3';
}

function parseSampleRate(mimeType) {
  if (!mimeType) return undefined;
  const rateMatch = mimeType.match(/rate=([0-9]+)/i);
  return rateMatch ? Number(rateMatch[1]) : undefined;
}

function parseChannels(mimeType) {
  if (!mimeType) return undefined;
  const chMatch = mimeType.match(/channels=([0-9]+)/i);
  return chMatch ? Number(chMatch[1]) : undefined;
}

function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1) {
  const byteRate = sampleRate * numChannels * 2; // 16-bit audio
  const blockAlign = numChannels * 2;
  const dataSize = pcmBuffer.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0); // ChunkID
  buffer.writeUInt32LE(36 + dataSize, 4); // ChunkSize
  buffer.write('WAVE', 8); // Format

  buffer.write('fmt ', 12); // Subchunk1ID
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  buffer.write('data', 36); // Subchunk2ID
  buffer.writeUInt32LE(dataSize, 40); // Subchunk2Size
  pcmBuffer.copy(buffer, 44);

  return buffer;
}

async function synthesizeWord(word) {
  let attempt = 0;
  let lastError;

  const prompt = `Speak the word "${word}" in German, slowly and clearly, for a language learning app. Return only the audio for that single word.`;

  while (attempt <= maxRetries) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          generationConfig: { responseMimeType: targetMimeType },
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find(part => part.inlineData?.data);
      if (!audioPart?.inlineData?.data) {
        console.error('Full response for debugging:', JSON.stringify(response, null, 2));
        throw new Error(`No audio data received for "${word}".`);
      }

      const { data, mimeType } = audioPart.inlineData;
      let buffer = Buffer.from(data, 'base64');
      let extension = mimeTypeToExtension(mimeType);

      if (extension === 'pcm' || mimeType?.toLowerCase().includes('l16') || mimeType?.toLowerCase().includes('pcm')) {
        const sampleRate = parseSampleRate(mimeType) || 24000;
        const channels = parseChannels(mimeType) || 1;
        buffer = pcmToWav(buffer, sampleRate, channels);
        extension = 'wav';
      }

      return { buffer, extension };
    } catch (error) {
      lastError = error;
      const message = typeof error === 'object' && error !== null ? error.toString() : String(error);
      const retryAfterMatch = message.match(/retry in ([0-9.]+)s/i);
      const retryAfterSeconds = retryAfterMatch ? Number(retryAfterMatch[1]) : null;
      const status429 = message.includes('429') || message.includes('RESOURCE_EXHAUSTED');
      const backoffMs = retryAfterSeconds !== null
        ? Math.max(0, Math.ceil(retryAfterSeconds * 1000))
        : Math.min(60000, baseBackoffMs * 2 ** attempt);

      if (attempt >= maxRetries) {
        throw error;
      }

      if (status429) {
        console.warn(`Rate limit hit for "${word}". Pausing for ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries}).`);
      } else {
        console.warn(`Error on "${word}", retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries}).`, error);
      }

      await new Promise(res => setTimeout(res, backoffMs));
      attempt += 1;
    }
  }

  throw lastError ?? new Error(`Failed to synthesize "${word}"`);
}

async function main() {
  console.log(`Scanning images in ${imageDir}...`);
  await fs.mkdir(audioDir, { recursive: true });

  const words = await listImageWords();
  if (words.length === 0) {
    console.log('No images found to process.');
    return;
  }

  const audioWords = await listAudioWords();
  const audioSet = new Set(audioWords);
  const missingWords = words.filter(word => !audioSet.has(word));

  console.log(`Images: ${words.length}. Existing audio: ${audioWords.length}. To generate: ${missingWords.length}.`);
  console.log(`Found ${words.length} unique words. Model: ${modelName}, voice: ${voiceName}.`);

  for (const word of words) {
    const outputPath = path.join(audioDir, `${word}.mp3`);

    if (!force) {
      if (audioSet.has(word)) {
        console.log(`Skipping ${word} (already exists). Use --force to overwrite.`);
        continue;
      }
    }

    try {
      console.log(`Generating audio for ${word}...`);
      const { buffer, extension } = await synthesizeWord(word);
      const targetPath = outputPath.replace(/\.mp3$/, `.${extension}`);
      await fs.writeFile(targetPath, buffer);
    } catch (error) {
      console.error(`Failed to generate audio for ${word}:`, error);
    }
  }

  console.log(`Done. Audio files are in ${audioDir}.`);
}

main().catch(error => {
  console.error('Fatal error during audio generation:', error);
  process.exitCode = 1;
});
