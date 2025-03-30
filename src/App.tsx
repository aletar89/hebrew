import { useEffect, useReducer, useCallback, useState } from 'react'
import './App.css'
import { HebrewLetterItem, processImageModules } from './utils/imageUtils';
import { shuffleArray } from './utils/arrayUtils';
import { gameReducer, initialState, ExerciseType } from './state/gameReducer';
import { ScoreDisplay } from './components/ScoreDisplay';
import { InstructionDisplay } from './components/InstructionDisplay';
import { FeedbackDisplay } from './components/FeedbackDisplay';
import { GameArea } from './components/GameArea';
import { NextRoundButton } from './components/NextRoundButton';
import { StatsDisplay } from './components/StatsDisplay';
import { saveSelection, SelectionRecord, getSelectionHistory } from './utils/storageUtils';
import { calculateLetterWeights, getWeightedRandomLetter } from './utils/spacedRepetitionUtils';

// --- Build-time Data Processing ---

// Update import.meta.glob syntax for Vite
const imageModules = import.meta.glob(
    '/public/images/*.{png,jpg,jpeg,gif,svg,webp}',
    { 
        // eager: true, as: 'url' // Deprecated syntax
        eager: true, 
        query: '?url',         // New syntax: request the URL
        import: 'default'       // New syntax: import the default export (the URL string)
    }
) as Record<string, string>; // Assert the type since Vite's type might be broader

const initialLetterGroups = processImageModules(imageModules);
const initialAvailableLetters = Object.keys(initialLetterGroups).filter(letter =>
  initialLetterGroups[letter] && initialLetterGroups[letter].length > 0
);

console.log('Initial Letter Groups:', initialLetterGroups);
console.log('Initial Available Letters:', initialAvailableLetters);

// --- Main App Component (Container for the game) ---

function App() {
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [selectionCounter, setSelectionCounter] = useState(0);

  const handleTogglePause = () => setIsRecordingPaused(prev => !prev);
  const triggerStatsUpdate = () => setSelectionCounter(count => count + 1);

  return (
    <div className="app-container">
      <LetterPictureMatch
        letterGroups={initialLetterGroups}
        availableLetters={initialAvailableLetters}
        isRecordingPaused={isRecordingPaused}
        onSelectionSave={triggerStatsUpdate}
        onTogglePause={handleTogglePause}
        updateTrigger={selectionCounter}
      />
    </div>
  );
}

// --- Game Logic Component (formerly the large LetterPictureMatch) ---

interface LetterPictureMatchProps {
  letterGroups: Record<string, HebrewLetterItem[]>;
  availableLetters: string[];
  isRecordingPaused: boolean;
  onSelectionSave: () => void;
  onTogglePause: () => void;
  updateTrigger: number;
}

function LetterPictureMatch({ letterGroups, availableLetters, isRecordingPaused, onSelectionSave, onTogglePause, updateTrigger }: LetterPictureMatchProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(0);
  const [showStats, setShowStats] = useState(false);

  const handleToggleStats = () => setShowStats(prev => !prev);

  // --- Game Logic Callbacks ---

  // Memoize startNewRound with useCallback to avoid unnecessary re-renders if passed down
  const startNewRound = useCallback(() => {
    console.log("Starting new round...");
    const newQuestionTimestamp = Date.now();
    setCurrentQuestionId(newQuestionTimestamp);
    console.log("New Question ID (Timestamp):", newQuestionTimestamp);
    dispatch({ type: 'RESET_FEEDBACK' }); // Reset feedback immediately

    // Filter letters that actually have images loaded
    const lettersWithImages = availableLetters.filter(letter =>
        letterGroups[letter] && letterGroups[letter].length > 0
    );
    
    if (lettersWithImages.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: "No Hebrew letter images available to start a round." });
      return;
    }

    // --- Spaced Repetition Logic ---
    console.log("Calculating weights for next round...");
    const history = getSelectionHistory();
    const weightedLetters = calculateLetterWeights(history, lettersWithImages);
    const selectedLetter = getWeightedRandomLetter(weightedLetters);

    if (!selectedLetter) {
        // Fallback if weighted random somehow fails
        console.error("Weighted random selection failed. Falling back to uniform random.");
        const fallbackIndex = Math.floor(Math.random() * lettersWithImages.length);
        const fallbackLetter = lettersWithImages[fallbackIndex];
        if (!fallbackLetter) {
             dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for the round." });
             return;
        }
         // Manually select the fallback letter (need to re-assign to satisfy TypeScript)
         // This block is just a safety net, ideally getWeightedRandomLetter handles it.
         dispatch({ type: 'START_ROUND', payload: { currentLetter: fallbackLetter } }); // Trigger state update
         return; // Or proceed with fallbackLetter assigned below? For simplicity, let's re-assign if !selectedLetter
    }
    console.log(`Selected letter based on weights: ${selectedLetter}`);
    // --- End Spaced Repetition Logic ---

    const newExerciseType = Math.random() < 0.5 ? ExerciseType.LETTER_TO_PICTURE : ExerciseType.PICTURE_TO_LETTER;
    // const selectedLetter = getRandomElement(lettersWithImages); // Replaced by weighted selection

    const letterImages = letterGroups[selectedLetter]; // Use the weighted selected letter
    if (!letterImages || letterImages.length === 0) { // Safety check for the selected letter
         dispatch({ type: 'SET_ERROR', payload: `No images found for selected letter ${selectedLetter}.` });
         return;
    }

    // Use standard Math.random() for selecting the *image* for the chosen letter
    const selectedImage = letterImages[Math.floor(Math.random() * letterImages.length)];
    if (!selectedImage) { // Should be redundant if letterImages check passed
         dispatch({ type: 'SET_ERROR', payload: `Failed to select an image for letter ${selectedLetter}.` });
         return;
    }

    // --- Generate Round Options (Logic remains the same, uses selectedLetter) ---
    let roundImageOptions: HebrewLetterItem[] = [];
    let roundLetterOptions: string[] = [];

    if (newExerciseType === ExerciseType.LETTER_TO_PICTURE) {
        const incorrectOptions: HebrewLetterItem[] = [];
        const otherLetters = lettersWithImages.filter(l => l !== selectedLetter);
        const shuffledOtherLetters = shuffleArray(otherLetters);
        for(let i = 0; i < Math.min(2, shuffledOtherLetters.length); i++) {
            const incorrectLetter = shuffledOtherLetters[i];
            const incorrectImages = letterGroups[incorrectLetter];
            // Ensure we get a valid image
            if (incorrectImages && incorrectImages.length > 0) {
                 const incorrectImage = incorrectImages[Math.floor(Math.random() * incorrectImages.length)];
                 if (incorrectImage) incorrectOptions.push(incorrectImage);
            }
        }
         if (incorrectOptions.length < 2) {
            const otherImagesFromSameLetter = letterImages.filter(img => img.word !== selectedImage.word);
            const shuffledSameLetterImages = shuffleArray(otherImagesFromSameLetter);
            for (let i = 0; i < Math.min(2 - incorrectOptions.length, shuffledSameLetterImages.length); i++) {
                incorrectOptions.push(shuffledSameLetterImages[i]);
            }
        }
        roundImageOptions = shuffleArray([selectedImage, ...incorrectOptions]);
    } else { // PICTURE_TO_LETTER
        const otherLetters = lettersWithImages.filter(l => l !== selectedLetter);
        const shuffledOtherLetters = shuffleArray(otherLetters);
        const finalIncorrectLetters = shuffledOtherLetters.slice(0, Math.min(2, shuffledOtherLetters.length));
        roundLetterOptions = shuffleArray([selectedLetter, ...finalIncorrectLetters]);
    }
    // --- End Generate Round Options ---

    dispatch({
      type: 'START_ROUND',
      payload: {
        exerciseType: newExerciseType,
        currentLetter: selectedLetter, // Use the weighted selected letter
        correctImageItem: selectedImage,
        imageOptions: roundImageOptions,
        letterOptions: roundLetterOptions,
      }
    });
  }, [availableLetters, letterGroups]);

  // --- Effects ---

  // Effect to start the first round on mount
  useEffect(() => {
    if (availableLetters.length > 0) {
      startNewRound();
    } else {
      dispatch({ type: 'SET_ERROR', payload: "No Hebrew letter images found in '/public/images/'. Please add images and rebuild." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to automatically start a new round after *any* answer is selected
  useEffect(() => {
    let timer: number | undefined;
    // If an answer has been selected (correct or incorrect)
    if (state.isCorrect !== null) {
      console.log(`Answer selected (Correct: ${state.isCorrect}). Starting next round soon...`);
      timer = setTimeout(() => {
        startNewRound();
      }, 2000); // Delay before next round
    }
    // Cleanup function to clear timeout if component unmounts or state changes before timeout finishes
    return () => clearTimeout(timer);
  }, [state.isCorrect, startNewRound]); // Depend on isCorrect and the memoized startNewRound

  // --- Event Handlers ---

  const handleImageSelect = (option: HebrewLetterItem) => {
    // Prevent multiple selections in the same round by checking if feedback is already shown
    if (state.isCorrect !== null) return;
    const isSelectionCorrect = state.correctImageItem?.letter === option.letter;

    if (!isRecordingPaused && state.correctImageItem && currentQuestionId > 0) {
        const record: SelectionRecord = {
            timestamp: Date.now(),
            questionId: currentQuestionId,
            targetLetter: state.correctImageItem.letter,
            selectedAnswer: option.word,
            isCorrect: isSelectionCorrect,
            exerciseType: state.exerciseType,
        };
        saveSelection(record);
        onSelectionSave();
    }

    dispatch({ type: 'SELECT_IMAGE', payload: { selected: option, isCorrect: isSelectionCorrect } });
  };

  const handleLetterSelect = (letter: string) => {
    // Prevent multiple selections in the same round by checking if feedback is already shown
    if (state.isCorrect !== null) return;
    const isSelectionCorrect = state.currentLetter === letter;

    if (!isRecordingPaused && state.currentLetter && currentQuestionId > 0) {
        const record: SelectionRecord = {
            timestamp: Date.now(),
            questionId: currentQuestionId,
            targetLetter: state.currentLetter,
            selectedAnswer: letter,
            isCorrect: isSelectionCorrect,
            exerciseType: state.exerciseType,
        };
        saveSelection(record);
        onSelectionSave();
    }

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
    <>
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
                <div className="game-controls-container">
                    <NextRoundButton onClick={startNewRound} exerciseType={state.exerciseType} />
                    <button onClick={handleToggleStats} className="new-letter-button">
                        {showStats ? 'Hide Stats' : 'Show Stats'}
                    </button>
                </div>
            </div>
        </div>

        {showStats && (
            <StatsDisplay
                isRecordingPaused={isRecordingPaused}
                onTogglePause={onTogglePause}
                updateTrigger={updateTrigger}
                allAvailableLetters={availableLetters}
            />
        )}
    </>
  );
}

export default App
