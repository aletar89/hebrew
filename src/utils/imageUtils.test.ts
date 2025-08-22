import { describe, it, expect } from 'vitest';
import { processImageModules, GermanLetterItem } from './imageUtils';

describe('processImageModules', () => {
  it('should return an empty object with initialized letters when input is empty', () => {
    const imageModules = {};
    const result = processImageModules(imageModules);
    expect(Object.keys(result).length).toBeGreaterThan(20);
    expect(result['A']).toEqual([]);
    expect(result['B']).toEqual([]);
  });

  it('should process valid image paths and group them correctly by letter', () => {
    const imageModules = {
      '/public/images/Apfel.png': '/images/Apfel.png',
      '/public/images/Banane.jpeg': '/images/Banane.jpeg',
      '/public/images/Auto.svg': '/images/Auto.svg',
      '/public/images/Zebra.gif': '/images/Zebra.gif',
    };
    const result = processImageModules(imageModules);

    expect(result['A']).toHaveLength(2);
    expect(result['A']).toEqual(expect.arrayContaining([
      expect.objectContaining<Partial<GermanLetterItem>>({ letter: 'A', word: 'Apfel', imageUrl: '/images/Apfel.png' }),
      expect.objectContaining<Partial<GermanLetterItem>>({ letter: 'A', word: 'Auto', imageUrl: '/images/Auto.svg' })
    ]));

    expect(result['B']).toHaveLength(1);
    expect(result['B'][0]).toEqual(expect.objectContaining<Partial<GermanLetterItem>>({ letter: 'B', word: 'Banane', imageUrl: '/images/Banane.jpeg' }));

    expect(result['Z']).toHaveLength(1);
    expect(result['Z'][0]).toEqual(expect.objectContaining<Partial<GermanLetterItem>>({ letter: 'Z', word: 'Zebra', imageUrl: '/images/Zebra.gif' }));

    expect(result['C']).toEqual([]);
  });

  it('should ignore files that do not match the image extension regex', () => {
    const imageModules = {
      '/public/images/Apfel.png': '/images/Apfel.png',
      '/public/images/document.txt': '/images/document.txt',
      '/public/images/Fisch': '/images/Fisch',
    };
    const result = processImageModules(imageModules);

    expect(result['A']).toHaveLength(1);
    expect(result['A'][0].word).toBe('Apfel');
    expect(result['F']).toEqual([]);
  });

  it('should ignore files where the first character is not a recognized German letter', () => {
    const imageModules = {
      '/public/images/!Test.png': '/images/!Test.png',
      '/public/images/123.jpg': '/images/123.jpg',
      '/public/images/Brot.webp': '/images/Brot.webp',
    };
    const result = processImageModules(imageModules);

    expect(result['B']).toHaveLength(1);
    expect(result['B'][0].word).toBe('Brot');
    expect(result['!']).toBeUndefined();
  });

  it('should handle different valid image extensions', () => {
    const imageModules = {
      '/public/images/Brot.png': '/images/Brot.png',
      '/public/images/Bild.jpg': '/images/Bild.jpg',
      '/public/images/Bahn.jpeg': '/images/Bahn.jpeg',
      '/public/images/Besen.gif': '/images/Besen.gif',
      '/public/images/Ball.svg': '/images/Ball.svg',
      '/public/images/Baum.webp': '/images/Baum.webp',
    };
    const result = processImageModules(imageModules);

    expect(result['B']).toHaveLength(6);
    expect(result['B'].map(item => item.word)).toEqual(expect.arrayContaining([
      'Brot', 'Bild', 'Bahn', 'Besen', 'Ball', 'Baum'
    ]));
  });

  it('should correctly extract word even if filename contains dots before extension', () => {
    const imageModules = {
      '/public/images/Fisch.blau.png': '/images/Fisch.blau.png'
    };
    const result = processImageModules(imageModules);

    expect(result['F']).toHaveLength(1);
    expect(result['F'][0].word).toBe('Fisch.blau');
    expect(result['F'][0].imageUrl).toBe('/images/Fisch.blau.png');
  });

  it('should handle paths with deeper structures (though glob pattern might need adjustment)', () => {
    const imageModules = {
      '/public/images/animals/Esel.png': '/images/animals/Esel.png'
    };
    const result = processImageModules(imageModules);

    expect(result['E']).toHaveLength(1);
    expect(result['E'][0].word).toBe('Esel');
    expect(result['E'][0].imageUrl).toBe('/images/animals/Esel.png');
  });
});
