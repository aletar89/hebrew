import { describe, expect, it } from 'vitest';
import { calculateLetterWeight, type LetterPerformance } from './spacedRepetitionUtils';

const makePerf = (overrides: Partial<LetterPerformance>): LetterPerformance => ({
  correct: 0,
  incorrect: 0,
  totalAttempts: 0,
  lastAttemptTimestamp: 0,
  lastAttemptCorrect: null,
  ...overrides,
});

describe('calculateLetterWeight', () => {
  it('keeps a perfect small sample from dropping too low', () => {
    const unseen = calculateLetterWeight(makePerf({ totalAttempts: 0 }));
    const perfectSmallSample = calculateLetterWeight(makePerf({
      correct: 3,
      incorrect: 0,
      totalAttempts: 3,
      lastAttemptCorrect: true,
    }));
    const mastered = calculateLetterWeight(makePerf({
      correct: 8,
      incorrect: 0,
      totalAttempts: 8,
      lastAttemptCorrect: true,
    }));

    expect(perfectSmallSample).toBeGreaterThan(mastered);
    expect(perfectSmallSample).toBeGreaterThan(unseen * 0.8);
  });
});
