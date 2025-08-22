import { describe, it, expect } from 'vitest';
import { processImageModules, GermanLetterItem } from './imageUtils';

describe('processImageModules', () => {

  it('should return an empty object with initialized letters when input is empty', () => {
    const imageModules = {};
    const result = processImageModules(imageModules);
    // Expect all known letters to be present as keys with empty arrays
    expect(Object.keys(result).length).toBeGreaterThan(20); // Check if main letters are initialized
    expect(result['A']).toEqual([]);
    expect(result['B']).toEqual([]);
    // ... potentially check more letters or just the structure
  });

  it('should process valid image paths and group them correctly by letter', () => {
    const imageModules = {
      '/public/images/Apfel.png': '/images/Apfel.png',
      '/public/images/Brot.jpeg': '/images/Brot.jpeg',
      '/public/images/Affe.svg': '/images/Affe.svg', // Another A
      '/public/images/Kamel.gif': '/images/Kamel.gif',
    };
    const result = processImageModules(imageModules);

    expect(result['A']).toHaveLength(2);
    expect(result['A']).toEqual(expect.arrayContaining([
      expect.objectContaining<Partial<GermanLetterItem>>({ letter: 'A', word: 'Apfel', imageUrl: '/images/Apfel.png' }),
      expect.objectContaining<Partial<GermanLetterItem>>({ letter: 'A', word: 'Affe', imageUrl: '/images/Affe.svg' })
    ]));

    expect(result['B']).toHaveLength(1);
    expect(result['B'][0]).toEqual(expect.objectContaining<Partial<GermanLetterItem>>({ letter: 'B', word: 'Brot', imageUrl: '/images/Brot.jpeg' }));

    expect(result['K']).toHaveLength(1);
    expect(result['K'][0]).toEqual(expect.objectContaining<Partial<GermanLetterItem>>({ letter: 'K', word: 'Kamel', imageUrl: '/images/Kamel.gif' }));

    // Ensure other letters are empty
    expect(result['D']).toEqual([]);
  });

  it('should ignore files that do not match the image extension regex', () => {
    const imageModules = {
      '/public/images/Apfel.png': '/images/Apfel.png',
      '/public/images/document.txt': '/images/document.txt', // Invalid extension
      '/public/images/Fisch': '/images/Fisch',                // No extension
    };
    const result = processImageModules(imageModules);

    expect(result['A']).toHaveLength(1);
    expect(result['A'][0].word).toBe('Apfel');
    expect(result['F']).toEqual([]); // Should not process 'Fisch'
  });

  it('should ignore files where the first character is not a recognized German letter', () => {
    const imageModules = {
      '/public/images/Hello.png': '/images/Hello.png',
      '/public/images/123.jpg': '/images/123.jpg',
      '/public/images/Brot.webp': '/images/Brot.webp',
    };
    const result = processImageModules(imageModules);

    expect(result['H']).toHaveLength(1);
    expect(result['H'][0].word).toBe('Hello');
    expect(result['B']).toHaveLength(1);
    expect(result['B'][0].word).toBe('Brot');
    expect(result['1']).toBeUndefined();
  });

  it('should handle different valid image extensions', () => {
    const imageModules = {
      '/public/images/Tomate.png': '/images/Tomate.png',
      '/public/images/Tiger.jpg': '/images/Tiger.jpg',
      '/public/images/Tasse.jpeg': '/images/Tasse.jpeg',
      '/public/images/Trommel.gif': '/images/Trommel.gif',
      '/public/images/Tisch.svg': '/images/Tisch.svg',
      '/public/images/Tuer.webp': '/images/Tuer.webp',
    };
    const result = processImageModules(imageModules);

    expect(result['T']).toHaveLength(6);
    expect(result['T'].map(item => item.word)).toEqual(expect.arrayContaining([
      'Tomate', 'Tiger', 'Tasse', 'Trommel', 'Tisch', 'Tuer'
    ]));
  });

  it('should correctly extract word even if filename contains dots before extension', () => {
    const imageModules = {
      '/public/images/Hund.haus.png': '/images/Hund.haus.png'
    };
    const result = processImageModules(imageModules);

    expect(result['H']).toHaveLength(1);
    expect(result['H'][0].word).toBe('Hund.haus');
    expect(result['H'][0].imageUrl).toBe('/images/Hund.haus.png');
  });

  it('should handle paths with deeper structures (though glob pattern might need adjustment)', () => {
    // Note: The glob pattern in App.tsx is '/public/images/*...'
    // This test assumes the glob pattern could potentially find deeper files
    // or the structure changes later.
    const imageModules = {
      '/public/images/animals/Esel.png': '/images/animals/Esel.png'
    };
    const result = processImageModules(imageModules);

    expect(result['E']).toHaveLength(1);
    expect(result['E'][0].word).toBe('Esel');
    expect(result['E'][0].imageUrl).toBe('/images/animals/Esel.png');
  });

}); 