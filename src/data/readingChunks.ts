export type ReadingChunkLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type ReadingChunkCategory =
  | 'cv'
  | 'vc'
  | 'cvc'
  | 'onset'
  | 'rime'
  | 'word';

export interface ReadingChunk {
  id: string;
  text: string;
  level: ReadingChunkLevel;
  category: ReadingChunkCategory;
  audioKey: string;
  ttsText?: string;
  confusionGroup: string;
  chunks?: string[];
}

export const readingChunks: ReadingChunk[] = [
  { id: 'ma', text: 'ma', level: 1, category: 'cv', audioKey: 'ma', confusionGroup: 'm-vowels' },
  { id: 'mi', text: 'mi', level: 1, category: 'cv', audioKey: 'mi', confusionGroup: 'm-vowels' },
  { id: 'mo', text: 'mo', level: 1, category: 'cv', audioKey: 'mo', confusionGroup: 'm-vowels' },
  { id: 'la', text: 'la', level: 1, category: 'cv', audioKey: 'la', confusionGroup: 'l-vowels' },
  { id: 'li', text: 'li', level: 1, category: 'cv', audioKey: 'li', confusionGroup: 'l-vowels' },
  { id: 'so', text: 'so', level: 1, category: 'cv', audioKey: 'so', confusionGroup: 's-vowels' },
  { id: 'sa', text: 'sa', level: 1, category: 'cv', audioKey: 'sa', confusionGroup: 's-vowels' },
  { id: 'an', text: 'an', level: 1, category: 'vc', audioKey: 'an', confusionGroup: 'short-vc' },
  { id: 'en', text: 'en', level: 1, category: 'vc', audioKey: 'en', confusionGroup: 'short-vc' },
  { id: 'um', text: 'um', level: 1, category: 'vc', audioKey: 'um', confusionGroup: 'short-vc' },

  { id: 'est', text: 'est', level: 2, category: 'cvc', audioKey: 'est', confusionGroup: 'short-cvc' },
  { id: 'ich', text: 'ich', level: 2, category: 'cvc', audioKey: 'ich', confusionGroup: 'ch-context' },
  { id: 'ach', text: 'ach', level: 2, category: 'cvc', audioKey: 'ach', ttsText: 'ach ach ach', confusionGroup: 'ch-context' },
  { id: 'aus', text: 'aus', level: 2, category: 'cvc', audioKey: 'aus', confusionGroup: 'diphthongs' },
  { id: 'ein', text: 'ein', level: 2, category: 'cvc', audioKey: 'ein', confusionGroup: 'diphthongs' },
];
