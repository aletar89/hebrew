import { useState, useEffect } from 'react'
import './App.css'
import { HebrewLetterItem, processImageModules } from './utils/imageUtils';

// Get image modules at build time using Vite's import.meta.glob
// Note: `eager: true` loads the modules immediately.
// `as: 'url'` ensures we get the resolved URL string directly.
// Adjust the glob pattern if images are in subdirectories or have different extensions.
const imageModules = import.meta.glob('/public/images/*.{png,jpg,jpeg,gif,svg,webp}', { eager: true, as: 'url' });

// Process the modules immediately to get the initial grouped data
const initialLetterGroups = processImageModules(imageModules);
const initialAvailableLetters = Object.keys(initialLetterGroups).filter(letter =>
    initialLetterGroups[letter] && initialLetterGroups[letter].length > 0
);

console.log('Initial Letter Groups:', initialLetterGroups);
console.log('Initial Available Letters:', initialAvailableLetters);

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
  // State for available letters and images - initialized from build-time data
  const [letterGroups] = useState<Record<string, HebrewLetterItem[]>>(initialLetterGroups);
  const [availableLetters] = useState<string[]>(initialAvailableLetters);
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
  const [selectedOption, setSelectedOption] = useState<HebrewLetterItem | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  
  // Start the first round once the component mounts, using the pre-loaded data
  useEffect(() => {
    if (availableLetters.length > 0) {
      console.log('Starting first round...');
      startNewRound(letterGroups, availableLetters); // Pass initial data
    } else {
      // If no images were found at build time
      setError("No Hebrew letter images found in '/public/images/'. Please add images following the naming convention (e.g., אבא.png) and rebuild.");
      console.error("No available letters found after processing image modules.")
    }
    // Disable exhaustive-deps warning because we intentionally run this only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once

  // Start a new round of the game
  const startNewRound = (groups = letterGroups, letters = availableLetters) => {
    // Filter out any letters that might not have images (shouldn't be necessary with build-time data, but good practice)
    const lettersWithImages = letters.filter(letter =>
      groups[letter] && groups[letter].length > 0
    );

    // If, after filtering, no letters are left (e.g., empty image directory)
    if (lettersWithImages.length === 0) {
        // Avoid setting error if it was already set by the initial check
        if (!error) {
             setError("No Hebrew letter images available to start a round. Please add images to the '/public/images/' directory.");
        }
        console.error("Cannot start new round: No letters with associated images available.")
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
    setSelectedOption(null);
    setSelectedLetter(null);
  };

  // Handle when an image option is selected (for LETTER_TO_PICTURE mode)
  const handleOptionClick = (option: HebrewLetterItem) => {
    // Only prevent multiple clicks if the answer is already correct
    if (isCorrect === true) return; 
    
    setAttempts(attempts + 1);
    setSelectedOption(option);
    
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
    
    console.log(`Letter clicked: ${letter}, current letter: ${currentLetter}`);
    
    setAttempts(attempts + 1);
    setSelectedLetter(letter);
    
    if (currentLetter && letter === currentLetter) {
      console.log(`Correct answer! Setting isCorrect to true`);
      setIsCorrect(true);
      setScore(score + 1);
      
      // Wait for a moment and then start a new round
      setTimeout(() => startNewRound(), 2000);
    } else {
      console.log(`Incorrect answer. Selected: ${letter}, Expected: ${currentLetter}`);
      setIsCorrect(false);
      
      // Don't automatically move to the next question on incorrect answer
      // Let the child try again by clicking on the correct letter
    }
  };

  // Conditional rendering based on error or no letters
  if (error) {
    return (
      <div className="letter-match-container error">
        <p>{error}</p>
      </div>
    );
  }

  // If no letters were found initially, error state handles this.
  // This check might be redundant now but kept for safety.
  if (availableLetters.length === 0 && !error) {
    return (
      <div className="letter-match-container error">
        <p>No Hebrew letter images available.</p>
        <p>Please add images to the '/public/images/' directory using the naming convention (e.g., אבא.png).</p>
      </div>
    );
  }

  // Check if the game is ready to be displayed
  const gameReady = currentLetter && correctImageItem;

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
      
      {gameReady && (
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
                    key={`${option.word}-${index}`}
                    className={`option${isCorrect === true && option.letter === correctImageItem?.letter ? ' correct-option' : ''}${isCorrect === false && selectedOption && option.letter === selectedOption.letter ? ' incorrect-option' : ''}`}
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
                {letterOptions.map((letter, index) => {
                  return (
                    <div
                      key={index}
                      className={`letter-option${isCorrect === true && letter === currentLetter ? ' correct-option' : ''}${isCorrect === false && selectedLetter === letter ? ' incorrect-option' : ''}`}
                      onClick={() => handleLetterClick(letter)}
                    >
                      <span className="letter-text">{letter}</span>
                    </div>
                  );
                })}
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
