// Map of Hebrew letter names to their actual Hebrew characters
export const hebrewLetterMap: Record<string, string> = {
  aleph: 'א',
  beth: 'ב',
  gimel: 'ג',
  daleth: 'ד',
  he: 'ה',
  vav: 'ו',
  zayin: 'ז',
  heth: 'ח',
  teth: 'ט',
  yod: 'י',
  kaph: 'כ',
  lamed: 'ל',
  mem: 'מ',
  nun: 'נ',
  samekh: 'ס',
  ayin: 'ע',
  pe: 'פ',
  tsadi: 'צ',
  qoph: 'ק',
  resh: 'ר',
  shin: 'ש',
  tav: 'ת'
};

// Map of Hebrew characters to their transliterated names
export const hebrewCharToName: Record<string, string> = Object.entries(hebrewLetterMap)
  .reduce((acc, [name, char]) => ({ ...acc, [char]: name }), {});

// Words/meanings for each letter if we want to provide suggestions
export const letterWordSuggestions: Record<string, string[]> = {
  aleph: ['אבא', 'אריה', 'אוטו'],
  beth: ['בית', 'בננה', 'בלון'],
  gimel: ['גמל', 'גלידה', 'גן'],
  daleth: ['דג', 'דלת', 'דבורה'],
  // Add more as needed
};

// Interface for the structured letter item
export interface HebrewLetterItem {
  letter: string;      // Hebrew character
  letterName: string;  // Transliterated name (aleph, beth, etc.)
  imageUrl: string;    // Path to the image (URL provided by import.meta.glob)
  word: string;        // The Hebrew word (filename without extension)
}

// Helper function to get the first character of a Hebrew word
const getFirstCharacter = (word: string): string | null => {
  if (word && word.length > 0) {
    // Handle potential final forms (e.g., ם, ן, ץ, ף, ך) if needed, although file names might not use them.
    // For simplicity, we assume the base form is used in filenames or the first char is sufficient.
    return word.charAt(0);
  }
  return null;
};

// Process the image modules obtained from import.meta.glob
export const processImageModules = (
    imageModules: Record<string, string> // Vite returns a map like { '/public/images/אבא.png': '/images/אבא.png' }
): Record<string, HebrewLetterItem[]> => {

  const grouped: Record<string, HebrewLetterItem[]> = {};

  // Initialize with empty arrays for all letters
  Object.values(hebrewLetterMap).forEach(letter => {
    grouped[letter] = [];
  });

  // console.log("Processing modules:", imageModules); // Already commented out

  for (const [path, imageUrl] of Object.entries(imageModules)) {
      try {
        // Extract the filename from the path (e.g., "אבא.png")
        const filename = path.split('/').pop();
        if (!filename) continue;

        // Extract the word (filename without extension)
        // Regex accounts for various image extensions
        const wordMatch = filename.match(/^(.+?)\.(png|jpg|jpeg|gif|svg|webp)$/i);

        if (wordMatch) {
          const word = wordMatch[1];
          const firstChar = getFirstCharacter(word);

          // Check if the first character is a valid Hebrew letter
          if (firstChar && hebrewCharToName[firstChar]) {
            const letterItem: HebrewLetterItem = {
              letter: firstChar,
              letterName: hebrewCharToName[firstChar],
              // Use the imageUrl provided directly by import.meta.glob
              // Vite typically handles mapping /public/images/... to /images/...
              imageUrl: imageUrl,
              word: word
            };

            // Add the item to the correct group
            if (!grouped[letterItem.letter]) {
                // console.warn(`Letter ${letterItem.letter} derived from filename ${filename} was not pre-initialized in grouped object. Skipping.`); // Comment out
                continue; // Should not happen if hebrewLetterMap is complete
            }
            grouped[letterItem.letter].push(letterItem);

          } else {
             // console.warn(`Skipping file: ${filename}. Could not determine a valid Hebrew starting letter for word: '${word}'`); // Comment out
          }
        } else {
            // console.warn(`Skipping file: ${filename}. Does not match expected image format.`); // Comment out
        }
      } catch (_error) {
        // console.error(`Error processing image path: ${path}`, _error); // Keep commented out
      }
  }

  // Keep this log for verifying the final structure
  console.log("Grouped letter items:", grouped);
  return grouped;
}; 