// Map of German letter names to their actual characters
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

// Interface for the structured letter item
export interface GermanLetterItem {
  letter: string;      // German character
  letterName: string;  // Transliteration or same letter
  imageUrl: string;    // Path to the image (URL provided by import.meta.glob)
  word: string;        // The German word (filename without extension)
}

// Helper function to get the first character of a German word
const getFirstCharacter = (word: string): string | null => {
  if (word && word.length > 0) {
    return word.charAt(0).toUpperCase();
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

  // console.log("Processing modules:", imageModules); // Already commented out

  for (const [path, imageUrl] of Object.entries(imageModules)) {
      try {
        // Extract the filename from the path (e.g., "Apfel.png")
        const filename = path.split('/').pop();
        if (!filename) continue;

        // Extract the word (filename without extension)
        // Regex accounts for various image extensions
        const wordMatch = filename.match(/^(.+?)\.(png|jpg|jpeg|gif|svg|webp|avif)$/i);

        if (wordMatch) {
          const word = wordMatch[1];
          const firstChar = getFirstCharacter(word);

          // Check if the first character is a valid German letter
          if (firstChar && germanCharToName[firstChar]) {
            const letterItem: GermanLetterItem = {
              letter: firstChar,
              letterName: germanCharToName[firstChar],
              // Use the imageUrl provided directly by import.meta.glob
              imageUrl: imageUrl,
              word: word
            };

            // Add the item to the correct group
            if (!grouped[letterItem.letter]) {
                continue; // Should not happen if germanLetterMap is complete
            }
            grouped[letterItem.letter].push(letterItem);

          } else {
             // console.warn(`Skipping file: ${filename}. Could not determine a valid German starting letter for word: '${word}'`);
          }
        } else {
            // console.warn(`Skipping file: ${filename}. Does not match expected image format.`); // Comment out
        }
      } catch (error) {
        // Use the error variable if uncommenting the log
        console.error(`Error processing image path: ${path}`, error); 
      }
  }

  // Keep this log for verifying the final structure
  console.log("Grouped letter items:", grouped);
  return grouped;
};