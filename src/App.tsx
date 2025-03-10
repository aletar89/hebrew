import { useState, useEffect } from 'react'
import './App.css'
import { HebrewLetterItem, getGroupedLetterItems, letterWordSuggestions } from './utils/imageUtils';

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>לומדים לקרוא עברית</h1>
        <h2>Learning to Read Hebrew</h2>
      </header>
      <main>
        <LetterPictureMatch />
      </main>
      <footer>
        <p>Created with ❤️ for learning Hebrew</p>
      </footer>
    </div>
  )
}

// Component for the letter-picture matching exercise
function LetterPictureMatch() {
  // State for available letters and images
  const [letterGroups, setLetterGroups] = useState<Record<string, HebrewLetterItem[]>>({});
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [correctImageItem, setCorrectImageItem] = useState<HebrewLetterItem | null>(null);
  const [options, setOptions] = useState<HebrewLetterItem[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  
  // Load available images when component mounts
  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        setError("Scanning for available images... This may take a moment.");
        
        const groups = await getGroupedLetterItems();
        
        // Get the list of available letters (we only use letters that have images)
        const lettersWithImages = Object.keys(groups).filter(letter => 
          groups[letter] && groups[letter].length > 0
        );
        
        console.log('Found letters with images:', lettersWithImages);
        console.log('Images per letter:', Object.entries(groups)
          .filter(([, items]) => items.length > 0)
          .map(([letter, items]) => `${letter}: ${items.length} images`)
        );
        
        setLetterGroups(groups);
        setAvailableLetters(lettersWithImages);
        
        // Only start a game if we have letters available
        if (lettersWithImages.length > 0) {
          setError(null);
          startNewRound(groups, lettersWithImages);
        } else {
          setError("No Hebrew letter images found. Please add images following the naming convention (e.g., aleph1.png).");
        }
      } catch (err) {
        console.error("Error loading images:", err);
        setError("Failed to load Hebrew letter images. Please check the console for details.");
      } finally {
        setLoading(false);
      }
    };
    
    loadImages();
  }, []);

  // Start a new round of the game
  const startNewRound = (groups = letterGroups, letters = availableLetters) => {
    if (letters.length === 0) return;
    
    // Filter out any letters that might not have images anymore
    const lettersWithImages = letters.filter(letter => 
      groups[letter] && groups[letter].length > 0
    );
    
    if (lettersWithImages.length === 0) {
      setError("No Hebrew letter images available. Please add images to the '/public/images/' directory.");
      return;
    }
    
    // Select a random letter
    const randomLetterIndex = Math.floor(Math.random() * lettersWithImages.length);
    const selectedLetter = lettersWithImages[randomLetterIndex];
    setCurrentLetter(selectedLetter);
    
    // Get all images for this letter
    const letterImages = groups[selectedLetter];
    
    // Select a random image for the correct answer
    const randomImageIndex = Math.floor(Math.random() * letterImages.length);
    const selectedImage = letterImages[randomImageIndex];
    setCorrectImageItem(selectedImage);
    
    // Create options (including the correct one)
    const optionLetters = [...lettersWithImages];
    // Remove the correct letter to avoid duplicates
    optionLetters.splice(randomLetterIndex, 1);
    
    // Only proceed with creating options if we have enough letters
    if (optionLetters.length === 0) {
      // If we only have one letter, just show multiple images for that letter
      const incorrectOptions = [];
      const remainingImages = [...letterImages];
      remainingImages.splice(randomImageIndex, 1); // Remove the correct image
      
      // Add up to 2 different images for the same letter if available
      for (let i = 0; i < Math.min(2, remainingImages.length); i++) {
        const randomIndex = Math.floor(Math.random() * remainingImages.length);
        incorrectOptions.push(remainingImages[randomIndex]);
        remainingImages.splice(randomIndex, 1);
      }
      
      // Combine correct and incorrect options
      const allOptions = [selectedImage, ...incorrectOptions];
      
      // Shuffle the options
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }
      
      setOptions(allOptions);
    } else {
      // Shuffle the remaining letters
      for (let i = optionLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionLetters[i], optionLetters[j]] = [optionLetters[j], optionLetters[i]];
      }
      
      // Take 2 random incorrect letters (or fewer if we don't have enough)
      const incorrectLetters = optionLetters.slice(0, Math.min(2, optionLetters.length));
      
      // Get a random image for each incorrect letter
      const incorrectOptions = incorrectLetters.map(letter => {
        const images = groups[letter];
        const randomIndex = Math.floor(Math.random() * images.length);
        return images[randomIndex];
      });
      
      // Combine correct and incorrect options
      const allOptions = [selectedImage, ...incorrectOptions];
      
      // Shuffle the options
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }
      
      setOptions(allOptions);
    }
    
    setIsCorrect(null);
  };

  // Handle when an option is selected
  const handleOptionClick = (option: HebrewLetterItem) => {
    if (isCorrect !== null) return; // Prevent multiple clicks
    
    setAttempts(attempts + 1);
    
    if (correctImageItem && option.letter === correctImageItem.letter) {
      setIsCorrect(true);
      setScore(score + 1);
      
      // Wait for a moment and then start a new round
      setTimeout(() => startNewRound(), 2000);
    } else {
      setIsCorrect(false);
    }
  };

  // Get a word suggestion for a given letter
  const getWordSuggestion = (letterName: string): string => {
    const suggestions = letterWordSuggestions[letterName];
    if (suggestions && suggestions.length > 0) {
      return suggestions[0]; // Just use the first suggestion
    }
    return letterName; // Fallback to the letter name
  };

  if (loading) {
    return (
      <div className="letter-match-container loading">
        <div className="loading-spinner"></div>
        <p>Scanning for Hebrew letter images...</p>
        <p>This may take a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="letter-match-container error">
        <p>{error}</p>
        {!loading && availableLetters.length === 0 && (
          <>
            <p>Please add images to the '/public/images/' directory using the naming convention:</p>
            <ul>
              <li>aleph1.png - for the letter א (Aleph)</li>
              <li>beth1.png - for the letter ב (Beth)</li>
              <li>gimel1.png - for the letter ג (Gimel)</li>
              <li>etc.</li>
            </ul>
          </>
        )}
      </div>
    );
  }

  if (availableLetters.length === 0) {
    return (
      <div className="letter-match-container error">
        <p>No Hebrew letter images available.</p>
        <p>Please add images to the '/public/images/' directory using the naming convention:</p>
        <ul>
          <li>aleph1.png - for the letter א (Aleph)</li>
          <li>beth1.png - for the letter ב (Beth)</li>
          <li>gimel1.png - for the letter ג (Gimel)</li>
          <li>etc.</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="letter-match-container">
      <div className="instruction">
        <p>התאם את האות לתמונה המתאימה</p>
        <p>Match the letter to the correct picture</p>
      </div>
      
      <div className="score-display">
        <div className="stars">
          {[...Array(score)].map((_, i) => (
            <span key={i} className="star">⭐</span>
          ))}
        </div>
      </div>
      
      {currentLetter && correctImageItem && (
        <div className="game-content">
          <div className="current-letter">
            <h2>{currentLetter}</h2>
          </div>
          
          <div className="options">
            {options.map((option, index) => (
              <div 
                key={index} 
                className={`option ${isCorrect !== null && option.letter === correctImageItem.letter ? (isCorrect ? 'correct-option' : '') : ''}`}
                onClick={() => isCorrect === null && handleOptionClick(option)}
              >
                <img 
                  src={option.imageUrl} 
                  alt={option.letterName}
                  className="option-image"
                  onError={(e) => {
                    // If image fails to load, show a placeholder
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' text-anchor='middle' alignment-baseline='middle'%3EImage Not Found%3C/text%3E%3C/svg%3E";
                  }}
                />
                <p className="option-word">{getWordSuggestion(option.letterName)}</p>
              </div>
            ))}
          </div>
          
          {isCorrect !== null && (
            <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? 'נכון! 🎉' : 'נסה שוב! 🤔'}
            </div>
          )}
          
          <button 
            className="new-letter-button"
            onClick={() => startNewRound()}
          >
            אות חדשה (New Letter)
          </button>
        </div>
      )}
    </div>
  );
}

export default App
