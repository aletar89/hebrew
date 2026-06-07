import { describe, expect, it } from 'vitest';
import { canScrambleWord, getWordScrambleUnits } from './syllableUtils';

describe('syllableUtils', () => {
  it('uses letters for short word scrambles', () => {
    expect(getWordScrambleUnits('Apfel')).toEqual(['A', 'p', 'f', 'e', 'l']);
  });

  it('uses syllables for long word scrambles', () => {
    expect(getWordScrambleUnits('Banane')).toEqual(['Ba', 'na', 'ne']);
    expect(getWordScrambleUnits('Schmetterling')).toEqual(['Schmet', 'ter', 'ling']);
  });

  it('keeps syllable units joinable to the target word', () => {
    const word = 'Wassermelone';

    expect(getWordScrambleUnits(word).join('')).toBe(word);
  });

  it('rejects words without enough scramble units', () => {
    expect(canScrambleWord('A')).toBe(false);
    expect(canScrambleWord('')).toBe(false);
    expect(canScrambleWord(null)).toBe(false);
  });
});
