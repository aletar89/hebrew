import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');

const imageDir = path.join(rootDir, 'public', 'images');
const audioDir = path.join(rootDir, 'public', 'audio');
const chunkAudioDir = path.join(audioDir, 'chunks');
const readingChunksPath = path.join(rootDir, 'src', 'data', 'readingChunks.ts');
const validExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif']);
const audioExtensions = new Set(['.wav', '.mp3', '.ogg', '.webm']);
const force = process.argv.includes('--force');
const sourceArgIndex = process.argv.indexOf('--source');
const source = sourceArgIndex >= 0 ? process.argv[sourceArgIndex + 1] : (process.argv.includes('--chunks') ? 'chunks' : 'images');
const limitArgIndex = process.argv.indexOf('--limit');
const limit = limitArgIndex >= 0 ? Number(process.argv[limitArgIndex + 1]) : undefined;
const itemsArgIndex = process.argv.indexOf('--items');
const requestedItems = itemsArgIndex >= 0
  ? new Set(process.argv[itemsArgIndex + 1]?.split(',').map(item => item.trim()).filter(Boolean) ?? [])
  : null;

async function loadEnvFile(filePath) {
  try {
    const contents = await fs.readFile(filePath, 'utf8');

    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = line.slice(0, separatorIndex).trim();
      if (!key || process.env[key] !== undefined) continue;

      let value = line.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

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

async function listAudioWords(directory = audioDir) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
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

async function listReadingChunks() {
  const contents = await fs.readFile(readingChunksPath, 'utf8');
  const chunkMatches = contents.matchAll(/\{([^}]*?)\}/gs);

  return Array.from(chunkMatches).flatMap(([, body]) => {
    const id = body.match(/\bid:\s*'([^']+)'/)?.[1];
    const text = body.match(/\btext:\s*'([^']+)'/)?.[1];
    const audioKey = body.match(/\baudioKey:\s*'([^']+)'/)?.[1];
    const ttsText = body.match(/\bttsText:\s*'([^']+)'/)?.[1];

    return id && text && audioKey ? [{ id, text, audioKey, ttsText }] : [];
  });
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

async function synthesizeAudioItem(item, { client, modelName, voiceName, targetMimeType, maxRetries, baseBackoffMs, kind }) {
  let attempt = 0;
  let lastError;

  const chunkTranscript = item.ttsText ?? `${item.text} ${item.text} ${item.text}`;
  const prompt = kind === 'chunk'
    ? chunkTranscript
    : item.text;

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
        throw new Error(`No audio data received for "${item.text}".`);
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

      if (message.includes('400 Bad Request') || message.includes('INVALID_ARGUMENT')) {
        throw error;
      }

      if (attempt >= maxRetries) {
        throw error;
      }

      if (status429) {
        console.warn(`Rate limit hit for "${item.text}". Pausing for ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries}).`);
      } else {
        console.warn(`Error on "${item.text}", retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries}).`, error);
      }

      await new Promise(res => setTimeout(res, backoffMs));
      attempt += 1;
    }
  }

  throw lastError ?? new Error(`Failed to synthesize "${item.text}"`);
}

async function main() {
  await loadEnvFile(envPath);

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const modelName = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
  const voiceName = process.env.GEMINI_TTS_VOICE || 'puck';
  const targetMimeType = process.env.GEMINI_TTS_MIME || 'audio/wav';
  const maxRetries = Number(process.env.GEMINI_TTS_MAX_RETRIES ?? 5);
  const baseBackoffMs = Number(process.env.GEMINI_TTS_BACKOFF_MS ?? 2000);

  if (!apiKey) {
    console.error('Missing API key. Set GEMINI_API_KEY (or API_KEY) in .env or the shell environment.');
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey });
  const isChunkSource = source === 'chunks';
  const targetAudioDir = isChunkSource ? chunkAudioDir : audioDir;
  console.log(isChunkSource ? `Scanning reading chunks in ${readingChunksPath}...` : `Scanning images in ${imageDir}...`);
  await fs.mkdir(targetAudioDir, { recursive: true });

  const items = isChunkSource
    ? await listReadingChunks()
    : (await listImageWords()).map(word => ({ id: word, text: word, audioKey: word }));

  if (items.length === 0) {
    console.log(isChunkSource ? 'No reading chunks found to process.' : 'No images found to process.');
    return;
  }

  const audioWords = await listAudioWords(targetAudioDir);
  const audioSet = new Set(audioWords);
  const missingWords = items.filter(item => !audioSet.has(item.audioKey));
  const filteredItems = requestedItems
    ? items.filter(item => requestedItems.has(item.id) || requestedItems.has(item.text) || requestedItems.has(item.audioKey))
    : items;
  const itemsToGenerate = Number.isFinite(limit) && limit > 0
    ? filteredItems.slice(0, limit)
    : filteredItems;

  if (requestedItems && itemsToGenerate.length === 0) {
    console.log(`No matching items found for: ${Array.from(requestedItems).join(', ')}`);
    return;
  }

  console.log(`Items: ${items.length}. Existing audio: ${audioWords.length}. To generate: ${missingWords.length}.`);
  if (requestedItems) {
    console.log(`Requested: ${Array.from(requestedItems).join(', ')}. Matched: ${itemsToGenerate.length}.`);
  }
  console.log(`Found ${items.length} unique ${isChunkSource ? 'chunks' : 'words'}. Model: ${modelName}, voice: ${voiceName}.`);

  for (const item of itemsToGenerate) {
    const outputPath = path.join(targetAudioDir, `${item.audioKey}.mp3`);

    if (!force) {
      if (audioSet.has(item.audioKey)) {
        console.log(`Skipping ${item.text} (already exists). Use --force to overwrite.`);
        continue;
      }
    }

    try {
      console.log(`Generating audio for ${item.text}...`);
      const { buffer, extension } = await synthesizeAudioItem(item, {
        client,
        modelName,
        voiceName,
        targetMimeType,
        maxRetries,
        baseBackoffMs,
        kind: isChunkSource ? 'chunk' : 'word',
      });
      const targetPath = outputPath.replace(/\.mp3$/, `.${extension}`);
      await fs.writeFile(targetPath, buffer);
    } catch (error) {
      console.error(`Failed to generate audio for ${item.text}:`, error);
    }
  }

  console.log(`Done. Audio files are in ${targetAudioDir}.`);
}

main().catch(error => {
  console.error('Fatal error during audio generation:', error);
  process.exitCode = 1;
});
