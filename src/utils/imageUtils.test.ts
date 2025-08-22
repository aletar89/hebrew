import { describe, it, expect } from 'vitest';
import { processImageModules } from './imageUtils';

describe('processImageModules (German)', () => {
  it('groups images by first letter', () => {
    const imageModules = {
      '/public/images/Apfel.png': '/images/Apfel.png',
      '/public/images/Auto.jpg': '/images/Auto.jpg',
      '/public/images/Ball.webp': '/images/Ball.webp'
    };
    const result = processImageModules(imageModules);
    expect(result['A']).toHaveLength(2);
    expect(result['B']).toHaveLength(1);
  });

  it('ignores non-image files', () => {
    const imageModules = {
      '/public/images/Apfel.png': '/images/Apfel.png',
      '/public/images/readme.txt': '/images/readme.txt'
    };
    const result = processImageModules(imageModules);
    expect(result['A']).toHaveLength(1);
  });
});

