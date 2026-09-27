import type { GermanLetterItem } from './imageUtils';
import { shuffleArray } from './arrayUtils';

export const selectMemoryItems = (items: GermanLetterItem[], count = 3): GermanLetterItem[] => {
  const seenWords = new Set<string>();
  return shuffleArray(items).filter(item => {
    const word = item.word.trim().toLocaleLowerCase('de-DE');
    if (!word || seenWords.has(word)) return false;
    seenWords.add(word);
    return true;
  }).slice(0, count);
};
