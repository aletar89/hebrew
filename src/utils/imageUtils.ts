// Map of German letter names to their actual German characters
export const germanLetterMap: Record<string, string> = {
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
  e: 'E',
  f: 'F',
  g: 'G',
  h: 'H',
  i: 'I',
  j: 'J',
  k: 'K',
  l: 'L',
  m: 'M',
  n: 'N',
  o: 'O',
  p: 'P',
  q: 'Q',
  r: 'R',
  s: 'S',
  t: 'T',
  u: 'U',
  v: 'V',
  w: 'W',
  x: 'X',
  y: 'Y',
  z: 'Z',
  ä: 'Ä',
  ö: 'Ö',
  ü: 'Ü',
  ß: 'ß'
};

// Map of German characters to their names
export const germanCharToName: Record<string, string> = Object.entries(germanLetterMap)
  .reduce((acc, [name, char]) => ({ ...acc, [char]: name }), {});

// Words/meanings for each letter if we want to provide suggestions
export const letterWordSuggestions: Record<string, string[]> = {
  a: ['Apfel', 'Auto', 'Ameise'],
  b: ['Banane', 'Brot', 'Berg'],
  c: ['Clown'],
  d: ['Drache', 'Dorf'],
  e: ['Esel', 'Ente', 'Erdbeere'],
  f: ['Fisch', 'Fuchs', 'Feder'],
};

// Interface for the structured letter item
export interface GermanLetterItem {
  letter: string;      // German character
  letterName: string;  // Name (a, b, c, etc.)
  imageUrl: string;    // Path to the image (URL provided by import.meta.glob)
  word: string;        // The German word (filename without extension)
}

// Helper function to get the first character of a German word
const getFirstCharacter = (word: string): string | null => {
  if (word && word.length > 0) {
    return word.charAt(0);
  }
  return null;
};

// Process the image modules obtained from import.meta.glob
export const processImageModules = (
    imageModules: Record<string, string> // Vite returns a map like { '/public/images/Apfel.png': '/images/Apfel.png' }
): Record<string, GermanLetterItem[]> => {

  const grouped: Record<string, GermanLetterItem[]> = {};

  // Initialize with empty arrays for all letters
  Object.values(germanLetterMap).forEach(letter => {
    grouped[letter] = [];
  });

  for (const [path, imageUrl] of Object.entries(imageModules)) {
      try {
        // Extract the filename from the path (e.g., "Apfel.png")
        const filename = path.split('/').pop();
        if (!filename) continue;

        // Extract the word (filename without extension)
        // Regex accounts for various image extensions
        const wordMatch = filename.match(/^(.+?)\.(png|jpg|jpeg|gif|svg|webp)$/i);

        if (wordMatch) {
          const word = wordMatch[1];
          const firstChar = getFirstCharacter(word);

          // Check if the first character is a valid German letter
          if (firstChar && germanCharToName[firstChar]) {
            const letterItem: GermanLetterItem = {
              letter: firstChar,
              letterName: germanCharToName[firstChar],
              imageUrl: imageUrl,
              word: word
            };

            // Add the item to the correct group
            if (!grouped[letterItem.letter]) {
                continue; // Should not happen if germanLetterMap is complete
            }
            grouped[letterItem.letter].push(letterItem);

          } else {
             // Skipping file due to unrecognized starting letter
          }
        } else {
            // Skipping file due to unsupported image format
        }
      } catch (error) {
        console.error(`Error processing image path: ${path}`, error);
      }
  }

  console.log("Grouped letter items:", grouped);
  return grouped;
};
