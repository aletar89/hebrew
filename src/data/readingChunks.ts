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
  { id: 'mel', text: 'mel', level: 2, category: 'cvc', audioKey: 'mel', confusionGroup: 'frequent-image-syllables' },
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

  { id: 'se', text: 'se', level: 1, category: 'cv', audioKey: 'se', confusionGroup: 'frequent-image-syllables' },
  { id: 're', text: 're', level: 1, category: 'cv', audioKey: 're', confusionGroup: 'frequent-image-syllables' },
  { id: 'ge', text: 'ge', level: 1, category: 'cv', audioKey: 'ge', confusionGroup: 'frequent-image-syllables' },
  { id: 'le', text: 'le', level: 1, category: 'cv', audioKey: 'le', confusionGroup: 'frequent-image-syllables' },
  { id: 'te', text: 'te', level: 1, category: 'cv', audioKey: 'te', confusionGroup: 'frequent-image-syllables' },
  { id: 'fe', text: 'fe', level: 1, category: 'cv', audioKey: 'fe', confusionGroup: 'frequent-image-syllables' },
  { id: 'ze', text: 'ze', level: 1, category: 'cv', audioKey: 'ze', confusionGroup: 'frequent-image-syllables' },
  { id: 'o', text: 'O', level: 1, category: 'word', audioKey: 'o', confusionGroup: 'frequent-image-syllables' },
  { id: 'ter', text: 'ter', level: 2, category: 'cvc', audioKey: 'ter', confusionGroup: 'frequent-image-syllables' },
  { id: 'gen', text: 'gen', level: 2, category: 'cvc', audioKey: 'gen', confusionGroup: 'frequent-image-syllables' },
  { id: 'cke', text: 'cke', level: 2, category: 'cvc', audioKey: 'cke', confusionGroup: 'frequent-image-syllables' },
  { id: 'fel', text: 'fel', level: 2, category: 'cvc', audioKey: 'fel', confusionGroup: 'frequent-image-syllables' },
  { id: 'gel', text: 'gel', level: 2, category: 'cvc', audioKey: 'gel', confusionGroup: 'frequent-image-syllables' },
  { id: 'sche', text: 'sche', level: 2, category: 'cvc', audioKey: 'sche', confusionGroup: 'frequent-image-syllables' },
];
