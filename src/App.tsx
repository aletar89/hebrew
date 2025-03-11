import { useState, useEffect } from 'react'
import './App.css'
import { HebrewLetterItem, getGroupedLetterItems } from './utils/imageUtils';

// Define the exercise types
enum ExerciseType {
  LETTER_TO_PICTURE = 'letter-to-picture',
  PICTURE_TO_LETTER = 'picture-to-letter'
}

function App() {
  return (
    <div className="app-container">
      <LetterPictureMatch />
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
  const [exerciseType, setExerciseType] = useState<ExerciseType>(ExerciseType.LETTER_TO_PICTURE);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [correctImageItem, setCorrectImageItem] = useState<HebrewLetterItem | null>(null);
  const [options, setOptions] = useState<HebrewLetterItem[]>([]);
  const [letterOptions, setLetterOptions] = useState<string[]>([]);
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

    // Randomly select exercise type
    const newExerciseType = Math.random() < 0.5 
      ? ExerciseType.LETTER_TO_PICTURE 
      : ExerciseType.PICTURE_TO_LETTER;
    setExerciseType(newExerciseType);
    
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
    
    // Create letter options (for PICTURE_TO_LETTER mode)
    const letterOptionsList = [...lettersWithImages];
    // Ensure the correct letter is not removed in PICTURE_TO_LETTER mode
    if (newExerciseType === ExerciseType.PICTURE_TO_LETTER) {
      // Shuffle the letter options
      for (let i = letterOptionsList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letterOptionsList[i], letterOptionsList[j]] = [letterOptionsList[j], letterOptionsList[i]];
      }
      
      // Make sure the correct letter is among the options
      // Find if the correct letter is already in the first 3 options
      const correctLetterIndex = letterOptionsList.slice(0, 3).indexOf(selectedLetter);
      
      if (correctLetterIndex === -1) {
        // If not, replace a random option with the correct letter
        const replaceIndex = Math.floor(Math.random() * Math.min(3, letterOptionsList.length));
        letterOptionsList[replaceIndex] = selectedLetter;
      }
      
      // Take the first 3 options (or fewer if we don't have enough)
      setLetterOptions(letterOptionsList.slice(0, Math.min(3, letterOptionsList.length)));
    }
    
    // Create image options (for LETTER_TO_PICTURE mode)
    if (newExerciseType === ExerciseType.LETTER_TO_PICTURE) {
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
    }
    
    setIsCorrect(null);
  };

  // Handle when an image option is selected (for LETTER_TO_PICTURE mode)
  const handleOptionClick = (option: HebrewLetterItem) => {
    // Only prevent multiple clicks if the answer is already correct
    if (isCorrect === true) return; 
    
    setAttempts(attempts + 1);
    
    if (correctImageItem && option.letter === correctImageItem.letter) {
      setIsCorrect(true);
      setScore(score + 1);
      
      // Wait for a moment and then start a new round
      setTimeout(() => startNewRound(), 2000);
    } else {
      setIsCorrect(false);
      
      // Don't automatically move to the next question on incorrect answer
      // Let the child try again by clicking on the correct image
    }
  };

  // Handle when a letter option is selected (for PICTURE_TO_LETTER mode)
  const handleLetterClick = (letter: string) => {
    // Only prevent multiple clicks if the answer is already correct
    if (isCorrect === true) return; 
    
    setAttempts(attempts + 1);
    
    if (currentLetter && letter === currentLetter) {
      setIsCorrect(true);
      setScore(score + 1);
      
      // Wait for a moment and then start a new round
      setTimeout(() => startNewRound(), 2000);
    } else {
      setIsCorrect(false);
      
      // Don't automatically move to the next question on incorrect answer
      // Let the child try again by clicking on the correct letter
    }
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
        {exerciseType === ExerciseType.LETTER_TO_PICTURE ? (
          <>
            <p>התאם את האות לתמונה המתאימה</p>
            <p>Match the letter to the correct picture</p>
          </>
        ) : (
          <>
            <p>התאם את התמונה לאות המתאימה</p>
            <p>Match the picture to the correct letter</p>
          </>
        )}
      </div>
      
      <div className="score-display">
        <div className="score-number">Score: {score}</div>
      </div>
      
      {currentLetter && correctImageItem && (
        <div className="game-content">
          {exerciseType === ExerciseType.LETTER_TO_PICTURE ? (
            // Exercise: Show letter, select matching picture
            <>
              <div className="current-letter">
                <h2>{currentLetter}</h2>
              </div>
              
              <div className="options">
                {options.map((option, index) => (
                  <div 
                    key={index} 
                    className={`option ${isCorrect !== null && option.letter === correctImageItem.letter ? (isCorrect ? 'correct-option' : 'highlight-correct') : ''} ${isCorrect === false && option.letter !== correctImageItem.letter ? 'incorrect-option' : ''}`}
                    onClick={() => handleOptionClick(option)}
                  >
                    <img 
                      src={option.imageUrl} 
                      alt={option.word}
                      className="option-image"
                      onError={(e) => {
                        // If image fails to load, show a placeholder with the letter
                        e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f0f0f0'/%3E%3Ctext x='75' y='75' font-family='Arial' font-size='60' text-anchor='middle' alignment-baseline='middle' fill='%234682b4'%3E${option.letter}%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Exercise: Show picture, select matching letter
            <>
              <div className="current-image">
                <img 
                  src={correctImageItem.imageUrl}
                  alt={correctImageItem.word}
                  className="target-image"
                  onError={(e) => {
                    // If image fails to load, show a placeholder with the letter
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f0f0f0'/%3E%3Ctext x='75' y='75' font-family='Arial' font-size='60' text-anchor='middle' alignment-baseline='middle' fill='%234682b4'%3E${correctImageItem.letter}%3C/text%3E%3C/svg%3E`;
                  }}
                />
              </div>
              
              <div className="letter-options">
                {letterOptions.map((letter, index) => (
                  <div 
                    key={index} 
                    className={`letter-option ${isCorrect !== null && letter === currentLetter ? (isCorrect ? 'correct-option' : 'highlight-correct') : ''} ${isCorrect === false && letter !== currentLetter ? 'incorrect-option' : ''}`}
                    onClick={() => handleLetterClick(letter)}
                  >
                    <span className="letter-text">{letter}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div className="feedback-container">
            {isCorrect !== null && (
              <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect 
                  ? '🎉 !נכון! כל הכבוד' 
                  : '🤗 !נסה שוב! אתה יכול'
                }
              </div>
            )}
          </div>
          
          <button 
            className="new-letter-button"
            onClick={() => startNewRound()}
          >
            {exerciseType === ExerciseType.LETTER_TO_PICTURE ? 'אות חדשה (New Letter)' : 'תמונה חדשה (New Picture)'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App
