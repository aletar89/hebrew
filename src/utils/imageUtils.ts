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

export interface HebrewLetterItem {
  letter: string;      // Hebrew character
  letterName: string;  // Transliterated name (aleph, beth, etc.)
  imageUrl: string;    // Path to the image
  word: string;        // The Hebrew word (filename without extension)
}

// Helper function to check if an image exists by actually loading it
const imageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

// Helper function to get the first character of a Hebrew word
const getFirstCharacter = (word: string): string | null => {
  if (word && word.length > 0) {
    return word.charAt(0);
  }
  return null;
};

// Scan available images and organize them by letter
export const getAvailableHebrewLetters = async (imageFilenames: string[]): Promise<HebrewLetterItem[]> => {
  const letterItems: HebrewLetterItem[] = [];
  
  // Process each filename
  for (const filename of imageFilenames) {
    try {
      // Extract the word (filename without extension)
      const wordMatch = filename.match(/^(.+)\.(png|jpg|jpeg|gif|svg|webp)$/i);
      
      if (wordMatch) {
        const word = wordMatch[1];
        const firstChar = getFirstCharacter(word);
        
        // Check if the first character is a valid Hebrew letter
        if (firstChar && hebrewCharToName[firstChar]) {
          letterItems.push({
            letter: firstChar,
            letterName: hebrewCharToName[firstChar],
            imageUrl: `/images/${filename}`,
            word
          });
        }
      }
    } catch (error) {
      console.error(`Error processing filename: ${filename}`, error);
    }
  }
  
  return letterItems;
};

// Helper function to get a list of image files
export const getAvailableImageFilenames = async (): Promise<string[]> => {
  // In a production environment, this would be an API call to list files
  // For now, we'll simulate with a check of common image formats
  
  console.log('Testing for Hebrew-named image files, please wait...');
  
  // Attempt to list files in the directory
  // For browser environments, we will try to discover them by checking if they exist
  const testFormats = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
  
  // Known Hebrew word image files to test for
  const knownWordImages = [
    'אדם', 'ארנב', 'אריה', 'אבא', 'אוטו',  // Aleph
    'בית', 'בננה', 'בקבוק', 'בלון',        // Beth
    'גמל', 'גלידה', 'גן',                  // Gimel
    'דג', 'דלת', 'דוב', 'דינוזאור', 'דרקון' // Daleth
    // Add more common words as necessary
  ];
  
  const availableImages: string[] = [];
  
  // Process images in batches to avoid too many concurrent requests
  const batchSize = 5;
  for (let i = 0; i < knownWordImages.length; i += batchSize) {
    const batch = knownWordImages.slice(i, i + batchSize);
    const batchPromises = batch.flatMap(word => 
      testFormats.map(async format => {
        const filename = `${word}.${format}`;
        const exists = await imageExists(`/images/${filename}`);
        return { filename, exists };
      })
    );
    
    const results = await Promise.all(batchPromises);
    
    results.forEach(({ filename, exists }) => {
      if (exists) {
        availableImages.push(filename);
      }
    });
  }
  
  console.log('Available images found:', availableImages);
  return availableImages;
};

// Get letter items grouped by letter for easier game logic
export const getGroupedLetterItems = async (): Promise<Record<string, HebrewLetterItem[]>> => {
  // Get filenames
  const filenames = await getAvailableImageFilenames();
  
  // Get letter items from valid filenames
  const letterItems = await getAvailableHebrewLetters(filenames);
  
  // Group by letter
  const grouped: Record<string, HebrewLetterItem[]> = {};
  
  // Initialize with empty arrays for all letters
  Object.values(hebrewLetterMap).forEach(letter => {
    grouped[letter] = [];
  });
  
  // Populate with found images
  for (const item of letterItems) {
    grouped[item.letter].push(item);
  }
  
  return grouped;
}; 