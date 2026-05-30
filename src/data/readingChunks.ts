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
  confusionGroup: string;
  chunks?: string[];
}

export const readingChunks: ReadingChunk[] = [
  { id: 'ma', text: 'ma', level: 1, category: 'cv', audioKey: 'ma', confusionGroup: 'm-vowels' },
  { id: 'me', text: 'me', level: 1, category: 'cv', audioKey: 'me', confusionGroup: 'm-vowels' },
  { id: 'mi', text: 'mi', level: 1, category: 'cv', audioKey: 'mi', confusionGroup: 'm-vowels' },
  { id: 'mo', text: 'mo', level: 1, category: 'cv', audioKey: 'mo', confusionGroup: 'm-vowels' },
  { id: 'mu', text: 'mu', level: 1, category: 'cv', audioKey: 'mu', confusionGroup: 'm-vowels' },
  { id: 'la', text: 'la', level: 1, category: 'cv', audioKey: 'la', confusionGroup: 'l-vowels' },
  { id: 'li', text: 'li', level: 1, category: 'cv', audioKey: 'li', confusionGroup: 'l-vowels' },
  { id: 'lo', text: 'lo', level: 1, category: 'cv', audioKey: 'lo', confusionGroup: 'l-vowels' },
  { id: 'so', text: 'so', level: 1, category: 'cv', audioKey: 'so', confusionGroup: 's-vowels' },
  { id: 'sa', text: 'sa', level: 1, category: 'cv', audioKey: 'sa', confusionGroup: 's-vowels' },
  { id: 'da', text: 'da', level: 1, category: 'cv', audioKey: 'da', confusionGroup: 'd-vowels' },
  { id: 'de', text: 'de', level: 1, category: 'cv', audioKey: 'de', confusionGroup: 'd-vowels' },
  { id: 'di', text: 'di', level: 1, category: 'cv', audioKey: 'di', confusionGroup: 'd-vowels' },
  { id: 'na', text: 'na', level: 1, category: 'cv', audioKey: 'na', confusionGroup: 'n-vowels' },
  { id: 'ne', text: 'ne', level: 1, category: 'cv', audioKey: 'ne', confusionGroup: 'n-vowels' },
  { id: 'no', text: 'no', level: 1, category: 'cv', audioKey: 'no', confusionGroup: 'n-vowels' },
  { id: 'pa', text: 'pa', level: 1, category: 'cv', audioKey: 'pa', confusionGroup: 'p-vowels' },
  { id: 'pe', text: 'pe', level: 1, category: 'cv', audioKey: 'pe', confusionGroup: 'p-vowels' },
  { id: 'an', text: 'an', level: 1, category: 'vc', audioKey: 'an', confusionGroup: 'short-vc' },
  { id: 'am', text: 'am', level: 1, category: 'vc', audioKey: 'am', confusionGroup: 'short-vc' },
  { id: 'en', text: 'en', level: 1, category: 'vc', audioKey: 'en', confusionGroup: 'short-vc' },
  { id: 'in', text: 'in', level: 1, category: 'vc', audioKey: 'in', confusionGroup: 'short-vc' },
  { id: 'im', text: 'im', level: 1, category: 'vc', audioKey: 'im', confusionGroup: 'short-vc' },
  { id: 'es', text: 'es', level: 1, category: 'vc', audioKey: 'es', confusionGroup: 'short-vc' },
  { id: 'um', text: 'um', level: 1, category: 'vc', audioKey: 'um', confusionGroup: 'short-vc' },

  { id: 'est', text: 'est', level: 2, category: 'cvc', audioKey: 'est', confusionGroup: 'short-cvc' },
  { id: 'ich', text: 'ich', level: 2, category: 'cvc', audioKey: 'ich', confusionGroup: 'ch-context' },
  { id: 'ach', text: 'ach', level: 2, category: 'cvc', audioKey: 'ach', confusionGroup: 'ch-context' },
  { id: 'aus', text: 'aus', level: 2, category: 'cvc', audioKey: 'aus', confusionGroup: 'diphthongs' },
  { id: 'ein', text: 'ein', level: 2, category: 'cvc', audioKey: 'ein', confusionGroup: 'diphthongs' },
];
