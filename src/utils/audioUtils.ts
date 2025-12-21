import { preloadAudio } from './preloadUtils';

const audioCache = new Map<string, HTMLAudioElement>();
const audioExtensions = ['wav', 'mp3'];

const getAudioSources = (word: string) => audioExtensions.map(ext => `/audio/${word}.${ext}`);

export async function playWordAudio(word: string): Promise<void> {
  for (const src of getAudioSources(word)) {
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

  console.error(`No playable audio found for word "${word}".`);
}

export function preloadWordAudio(word: string): void {
  for (const src of getAudioSources(word)) {
    preloadAudio(src);
  }
}
