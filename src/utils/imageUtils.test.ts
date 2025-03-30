import { describe, it, expect } from 'vitest';
import { processImageModules, HebrewLetterItem } from './imageUtils';

describe('processImageModules', () => {

  it('should return an empty object with initialized letters when input is empty', () => {
    const imageModules = {};
    const result = processImageModules(imageModules);
    // Expect all known letters to be present as keys with empty arrays
    expect(Object.keys(result).length).toBeGreaterThan(20); // Check if main letters are initialized
    expect(result['א']).toEqual([]);
    expect(result['ב']).toEqual([]);
    // ... potentially check more letters or just the structure
  });

  it('should process valid image paths and group them correctly by letter', () => {
    const imageModules = {
      '/public/images/אבא.png': '/images/אבא.png',
      '/public/images/בית.jpeg': '/images/בית.jpeg',
      '/public/images/ארנב.svg': '/images/ארנב.svg', // Another Aleph
      '/public/images/גמל.gif': '/images/גמל.gif',
    };
    const result = processImageModules(imageModules);

    expect(result['א']).toHaveLength(2);
    expect(result['א']).toEqual(expect.arrayContaining([
      expect.objectContaining<Partial<HebrewLetterItem>>({ letter: 'א', word: 'אבא', imageUrl: '/images/אבא.png' }),
      expect.objectContaining<Partial<HebrewLetterItem>>({ letter: 'א', word: 'ארנב', imageUrl: '/images/ארנב.svg' })
    ]));

    expect(result['ב']).toHaveLength(1);
    expect(result['ב'][0]).toEqual(expect.objectContaining<Partial<HebrewLetterItem>>({ letter: 'ב', word: 'בית', imageUrl: '/images/בית.jpeg' }));

    expect(result['ג']).toHaveLength(1);
    expect(result['ג'][0]).toEqual(expect.objectContaining<Partial<HebrewLetterItem>>({ letter: 'ג', word: 'גמל', imageUrl: '/images/גמל.gif' }));

    // Ensure other letters are empty
    expect(result['ד']).toEqual([]);
  });

  it('should ignore files that do not match the image extension regex', () => {
    const imageModules = {
      '/public/images/אבא.png': '/images/אבא.png',
      '/public/images/document.txt': '/images/document.txt', // Invalid extension
      '/public/images/דג': '/images/דג',                     // No extension
    };
    const result = processImageModules(imageModules);

    expect(result['א']).toHaveLength(1);
    expect(result['א'][0].word).toBe('אבא');
    expect(result['ד']).toEqual([]); // Should not process 'דג'
  });

  it('should ignore files where the first character is not a recognized Hebrew letter', () => {
    const imageModules = {
      '/public/images/Hello.png': '/images/Hello.png',
      '/public/images/123.jpg': '/images/123.jpg',
      '/public/images/בית.webp': '/images/בית.webp',
    };
    const result = processImageModules(imageModules);

    expect(result['ב']).toHaveLength(1);
    expect(result['ב'][0].word).toBe('בית');
    // Check a letter that shouldn't exist based on input
    expect(result['ה']).toEqual([]);
  });

  it('should handle different valid image extensions', () => {
    const imageModules = {
      '/public/images/תפוח.png': '/images/תפוח.png',
      '/public/images/תמונה.jpg': '/images/תמונה.jpg',
      '/public/images/תרנגול.jpeg': '/images/תרנגול.jpeg',
      '/public/images/תנין.gif': '/images/תנין.gif',
      '/public/images/תיק.svg': '/images/תיק.svg',
      '/public/images/תות.webp': '/images/תות.webp',
    };
    const result = processImageModules(imageModules);

    expect(result['ת']).toHaveLength(6);
    expect(result['ת'].map(item => item.word)).toEqual(expect.arrayContaining([
      'תפוח', 'תמונה', 'תרנגול', 'תנין', 'תיק', 'תות'
    ]));
  });

  it('should correctly extract word even if filename contains dots before extension', () => {
    const imageModules = {
      '/public/images/דג.זהב.png': '/images/דג.זהב.png'
    };
    const result = processImageModules(imageModules);

    expect(result['ד']).toHaveLength(1);
    expect(result['ד'][0].word).toBe('דג.זהב');
    expect(result['ד'][0].imageUrl).toBe('/images/דג.זהב.png');
  });

  it('should handle paths with deeper structures (though glob pattern might need adjustment)', () => {
    // Note: The glob pattern in App.tsx is '/public/images/*...'
    // This test assumes the glob pattern could potentially find deeper files
    // or the structure changes later.
    const imageModules = {
      '/public/images/animals/חמור.png': '/images/animals/חמור.png'
    };
    const result = processImageModules(imageModules);

    expect(result['ח']).toHaveLength(1);
    expect(result['ח'][0].word).toBe('חמור');
    expect(result['ח'][0].imageUrl).toBe('/images/animals/חמור.png');
  });

}); 