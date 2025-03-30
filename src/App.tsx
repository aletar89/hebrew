import { useEffect, useReducer, useCallback } from 'react'
import './App.css'
import { HebrewLetterItem, processImageModules } from './utils/imageUtils';
import { getRandomElement, shuffleArray } from './utils/arrayUtils';
import { GameState, GameAction, gameReducer, initialState, ExerciseType } from './state/gameReducer';
import { ScoreDisplay } from './components/ScoreDisplay';
import { InstructionDisplay } from './components/InstructionDisplay';
import { FeedbackDisplay } from './components/FeedbackDisplay';
import { GameArea } from './components/GameArea';
import { NextRoundButton } from './components/NextRoundButton';

// --- Build-time Data Processing ---

const imageModules = import.meta.glob('/public/images/*.{png,jpg,jpeg,gif,svg,webp}', { eager: true, as: 'url' });
const initialLetterGroups = processImageModules(imageModules);
const initialAvailableLetters = Object.keys(initialLetterGroups).filter(letter =>
  initialLetterGroups[letter] && initialLetterGroups[letter].length > 0
);

console.log('Initial Letter Groups:', initialLetterGroups);
console.log('Initial Available Letters:', initialAvailableLetters);

// --- Main App Component (Container for the game) ---

function App() {
  return (
    <div className="app-container">
      {/* Pass build-time data as props to the main game component */}
      <LetterPictureMatch
        letterGroups={initialLetterGroups}
        availableLetters={initialAvailableLetters}
      />
    </div>
  );
}

// --- Game Logic Component (formerly the large LetterPictureMatch) ---

interface LetterPictureMatchProps {
  letterGroups: Record<string, HebrewLetterItem[]>;
  availableLetters: string[];
}

function LetterPictureMatch({ letterGroups, availableLetters }: LetterPictureMatchProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // --- Game Logic Callbacks ---

  // Memoize startNewRound with useCallback to avoid unnecessary re-renders if passed down
  const startNewRound = useCallback(() => {
    console.log("Starting new round...");
    dispatch({ type: 'RESET_FEEDBACK' }); // Reset feedback immediately

    const lettersWithImages = availableLetters.filter(letter =>
        letterGroups[letter] && letterGroups[letter].length > 0
    );

    if (lettersWithImages.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: "No Hebrew letter images available to start a round." });
      return;
    }

    // Generate Round Data
    const newExerciseType = Math.random() < 0.5 ? ExerciseType.LETTER_TO_PICTURE : ExerciseType.PICTURE_TO_LETTER;
    const selectedLetter = getRandomElement(lettersWithImages);
    if (!selectedLetter) return; // Should not happen

    const letterImages = letterGroups[selectedLetter];
    if (!letterImages || letterImages.length === 0) return; // Safety check

    const selectedImage = getRandomElement(letterImages);
    if (!selectedImage) return; // Safety check

    let roundImageOptions: HebrewLetterItem[] = [];
    let roundLetterOptions: string[] = [];

    if (newExerciseType === ExerciseType.LETTER_TO_PICTURE) {
        // Generate image options (correct + 2 incorrect)
        const incorrectOptions: HebrewLetterItem[] = [];
        const otherLetters = lettersWithImages.filter(l => l !== selectedLetter);
        const shuffledOtherLetters = shuffleArray(otherLetters);

        for(let i = 0; i < Math.min(2, shuffledOtherLetters.length); i++) {
            const incorrectLetter = shuffledOtherLetters[i];
            const incorrectImages = letterGroups[incorrectLetter];
            const incorrectImage = getRandomElement(incorrectImages);
            if (incorrectImage) incorrectOptions.push(incorrectImage);
        }
         // Fill remaining slots with different images from the *same* letter if needed
         if (incorrectOptions.length < 2) {
            const otherImagesFromSameLetter = letterImages.filter(img => img.word !== selectedImage.word);
            const shuffledSameLetterImages = shuffleArray(otherImagesFromSameLetter);
            for (let i = 0; i < Math.min(2 - incorrectOptions.length, shuffledSameLetterImages.length); i++) {
                incorrectOptions.push(shuffledSameLetterImages[i]);
            }
        }
        roundImageOptions = shuffleArray([selectedImage, ...incorrectOptions]);

    } else { // PICTURE_TO_LETTER
        // Generate letter options (correct + 2 incorrect)
        const otherLetters = lettersWithImages.filter(l => l !== selectedLetter);
        const shuffledOtherLetters = shuffleArray(otherLetters);
        const finalIncorrectLetters = shuffledOtherLetters.slice(0, Math.min(2, shuffledOtherLetters.length));
        roundLetterOptions = shuffleArray([selectedLetter, ...finalIncorrectLetters]);
    }

    // Dispatch action to update state with the new round data
    dispatch({
      type: 'START_ROUND',
      payload: {
        exerciseType: newExerciseType,
        currentLetter: selectedLetter,
        correctImageItem: selectedImage,
        imageOptions: roundImageOptions,
        letterOptions: roundLetterOptions,
      }
    });
  }, [availableLetters, letterGroups]); // Dependencies: Available data

  // --- Effects ---

  // Effect to start the first round on mount
  useEffect(() => {
    if (availableLetters.length > 0) {
      startNewRound();
    } else {
      dispatch({ type: 'SET_ERROR', payload: "No Hebrew letter images found in '/public/images/'. Please add images and rebuild." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // Effect to automatically start a new round after a correct answer
  useEffect(() => {
    let timer: number | undefined;
    if (state.isCorrect === true) {
      timer = setTimeout(() => {
        startNewRound();
      }, 2000); // Delay
    }
    return () => clearTimeout(timer); // Cleanup timeout
  }, [state.isCorrect, startNewRound]);

  // --- Event Handlers ---

  const handleImageSelect = (option: HebrewLetterItem) => {
    if (state.isCorrect === true) return; // Prevent clicking after correct answer
    const isSelectionCorrect = state.correctImageItem?.letter === option.letter;
    dispatch({ type: 'SELECT_IMAGE', payload: { selected: option, isCorrect: isSelectionCorrect } });
  };

  const handleLetterSelect = (letter: string) => {
     if (state.isCorrect === true) return; // Prevent clicking after correct answer
    const isSelectionCorrect = state.currentLetter === letter;
    dispatch({ type: 'SELECT_LETTER', payload: { selected: letter, isCorrect: isSelectionCorrect } });
  };

  // --- Rendering ---

  // Handle error state
  if (state.error) {
    return <div className="letter-match-container error"><p>{state.error}</p></div>;
  }

  // Handle case where no letters available (redundant check, but safe)
  if (availableLetters.length === 0 && !state.error) {
    return (
      <div className="letter-match-container error">
        <p>No Hebrew letter images available.</p>
        <p>Please add images to the '/public/images/' directory (e.g., אבא.png).</p>
      </div>
    );
  }

  // Loading state until first round is ready
  if (!state.gameReady) {
      return <div className="letter-match-container loading"><p>Loading game...</p></div>;
  }

  // Render the game using child components
  return (
    <div className="letter-match-container">
      <InstructionDisplay exerciseType={state.exerciseType} />
      <ScoreDisplay score={state.score} />
      <div className="game-content">
        <GameArea
          gameState={state}
          onImageSelect={handleImageSelect}
          onLetterSelect={handleLetterSelect}
        />
        <div className="feedback-container">
          <FeedbackDisplay isCorrect={state.isCorrect} />
        </div>
        <NextRoundButton onClick={startNewRound} exerciseType={state.exerciseType} />
      </div>
    </div>
  );
}

export default App
