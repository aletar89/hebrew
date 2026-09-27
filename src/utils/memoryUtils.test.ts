import { describe, expect, it } from 'vitest';
import type { GermanLetterItem } from './imageUtils';
import { selectMemoryItems } from './memoryUtils';

const item = (word: string, imageUrl: string): GermanLetterItem => ({
  letter: word[0], letterName: word[0].toLowerCase(), word, imageUrl,
});

describe('selectMemoryItems', () => {
  it('selects three distinct words even when an image has a duplicate word', () => {
    const selected = selectMemoryItems([
      item('Apfel', '/apfel1.png'), item('APFEL', '/apfel2.png'),
      item('Banane', '/banane.png'), item('Esel', '/esel.png'), item('Fisch', '/fisch.png'),
    ]);

    expect(selected).toHaveLength(3);
    expect(new Set(selected.map(entry => entry.word.toLowerCase())).size).toBe(3);
  });
});
