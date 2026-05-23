import { preloadAudio } from './preloadUtils';

const audioCache = new Map<string, HTMLAudioElement>();
const audioExtensions = ['wav', 'mp3'];

const getAudioSources = (word: string) => audioExtensions.map(ext => `/audio/${word}.${ext}`);
const getChunkAudioSources = (chunkAudioKey: string) => audioExtensions.map(ext => `/audio/chunks/${chunkAudioKey}.${ext}`);

async function playAudioSources(sources: string[], label: string): Promise<void> {
  for (const src of sources) {
    let audio = audioCache.get(src);

    if (!audio) {
      audio = new Audio(src);
      audioCache.set(src, audio);
    }

    audio.currentTime = 0;
    try {
      await audio.play();
      return;
    } catch (error) {
      // Try the next extension if playback failed (e.g., missing file).
      console.warn(`Failed to play ${src}`, error);
    }
  }

  console.error(`No playable audio found for "${label}".`);
}

export async function playWordAudio(word: string): Promise<void> {
  await playAudioSources(getAudioSources(word), `word "${word}"`);
}

export async function playChunkAudio(chunkAudioKey: string): Promise<void> {
  await playAudioSources(getChunkAudioSources(chunkAudioKey), `chunk "${chunkAudioKey}"`);
}

export function preloadWordAudio(word: string): void {
  for (const src of getAudioSources(word)) {
    preloadAudio(src);
  }
}

export function preloadChunkAudio(chunkAudioKey: string): void {
  for (const src of getChunkAudioSources(chunkAudioKey)) {
    preloadAudio(src);
  }
}
