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

// Words/meanings for each letter if we want to provide suggestions
export const letterWordSuggestions: Record<string, string[]> = {
  aleph: ['אבא (Father)', 'אריה (Lion)', 'אוטו (Car)'],
  beth: ['בית (House)', 'בננה (Banana)', 'בלון (Balloon)'],
  gimel: ['גמל (Camel)', 'גלידה (Ice Cream)', 'גן (Garden)'],
  daleth: ['דג (Fish)', 'דלת (Door)', 'דבורה (Bee)'],
  // Add more as needed
};

export interface HebrewLetterItem {
  letter: string;      // Hebrew character
  letterName: string;  // Transliterated name (aleph, beth, etc.)
  imageUrl: string;    // Path to the image
}

// Parse a filename to extract the letter name and number
// Example: "aleph1.png" -> { letterName: "aleph", number: 1 }
const parseImageFilename = (filename: string): { letterName: string, number: number } | null => {
  // Match letter name followed by a number and then any image extension
  // This regex is more flexible with file extensions
  const match = filename.match(/^([a-z]+)(\d+)\.([a-z0-9]+)$/i);
  
  if (match) {
    const letterName = match[1].toLowerCase();
    const number = parseInt(match[2], 10);
    
    // Check if the letter name is valid
    if (hebrewLetterMap[letterName]) {
      return { letterName, number };
    }
  }
  
  return null;
};

// Scan available images and organize them by letter
export const getAvailableHebrewLetters = async (imageFilenames: string[]): Promise<HebrewLetterItem[]> => {
  const letterItems: HebrewLetterItem[] = [];
  
  // Process each filename
  for (const filename of imageFilenames) {
    const parsed = parseImageFilename(filename);
    
    if (parsed) {
      const { letterName } = parsed;
      const letter = hebrewLetterMap[letterName];
      
      letterItems.push({
        letter,
        letterName,
        imageUrl: `/images/${filename}`
      });
    }
  }
  
  return letterItems;
};

// Helper function to check if an image exists by actually loading it
const imageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

// Helper function to simulate scanning a directory for image files
export const getAvailableImageFilenames = async (): Promise<string[]> => {
  // For production, you would replace this with an API call or build-time process
  // to list all files in the images directory
  
  // Let's test only a reasonable number of combinations to avoid too many network requests
  const testImages: string[] = [];
  const fileExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
  
  // Generate test image names for each letter
  for (const letterName of Object.keys(hebrewLetterMap)) {
    // Try only the first 3 numbers for each letter for performance reasons
    for (let i = 1; i <= 3; i++) {
      for (const ext of fileExtensions) {
        testImages.push(`${letterName}${i}.${ext}`);
      }
    }
  }
  
  console.log('Testing for image files, please wait...');
  
  // Check which images actually exist
  const availableImages: string[] = [];
  
  // Process images in batches to avoid too many concurrent requests
  const batchSize = 10;
  for (let i = 0; i < testImages.length; i += batchSize) {
    const batch = testImages.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (filename) => {
        const exists = await imageExists(`/images/${filename}`);
        return { filename, exists };
      })
    );
    
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
  // Get filenames (in a real app, this would scan the directory)
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