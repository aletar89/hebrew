import { useEffect, useReducer, useCallback, useState } from 'react';
import { HebrewLetterItem } from '../utils/imageUtils'; // Adjust path
import { getRandomElement, shuffleArray } from '../utils/arrayUtils'; // Adjust path
import { GameState, gameReducer, initialState, ExerciseType } from '../state/gameReducer'; // Adjust path
import { ScoreDisplay } from './ScoreDisplay';
import { InstructionDisplay } from './InstructionDisplay';
import { FeedbackDisplay } from './FeedbackDisplay';
import { GameArea } from './GameArea';
import { NextRoundButton } from './NextRoundButton';
import { StatsDisplay } from './StatsDisplay';
import { saveSelection, SelectionRecord, getSelectionHistory } from '../utils/storageUtils'; // Adjust path
import { calculateLetterWeights, getWeightedRandomLetter } from '../utils/spacedRepetitionUtils'; // Adjust path

// --- Game Logic Component ---

export interface LetterPictureMatchProps {
  letterGroups: Record<string, HebrewLetterItem[]>;
  availableLetters: string[];
  isRecordingPaused: boolean;
  onSelectionSave: () => void;
  onTogglePause: () => void;
  updateTrigger: number;
}

export function LetterPictureMatch({ letterGroups, availableLetters, isRecordingPaused, onSelectionSave, onTogglePause, updateTrigger }: LetterPictureMatchProps) {
  // Let TS infer types from reducer and initial state
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(0);
  const [showStats, setShowStats] = useState(false);

  const handleToggleStats = () => setShowStats(prev => !prev);

  // --- Game Logic Callbacks ---
  const startNewRound = useCallback(() => {
    console.log("Starting new round...");
    const newQuestionTimestamp = Date.now();
    setCurrentQuestionId(newQuestionTimestamp);
    console.log("New Question ID (Timestamp):", newQuestionTimestamp);
    dispatch({ type: 'RESET_FEEDBACK' });

    if (availableLetters.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: "No Hebrew letters available to start a round." });
        return;
    }

    const rand = Math.random();
    let newExerciseType: ExerciseType;
    if (rand < 0.33) {
        newExerciseType = ExerciseType.DRAWING;
    } else if (rand < 0.66) {
        newExerciseType = ExerciseType.LETTER_TO_PICTURE;
    } else {
        newExerciseType = ExerciseType.PICTURE_TO_LETTER;
    }

    let roundPayload: Partial<GameState> = { exerciseType: newExerciseType };
    let selectedLetter: string | undefined;

    if (newExerciseType === ExerciseType.DRAWING) {
        selectedLetter = getRandomElement(availableLetters);
        if (!selectedLetter) {
             dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for drawing round." });
             return;
        }
        roundPayload.currentLetter = selectedLetter;
    } else {
        const lettersWithImages = availableLetters.filter(letter =>
            letterGroups[letter] && letterGroups[letter].length > 0
        );

        if (lettersWithImages.length === 0) {
             console.warn("Attempted non-drawing round, but no letters have images. Falling back to DRAWING.");
             newExerciseType = ExerciseType.DRAWING;
             selectedLetter = getRandomElement(availableLetters);
             if (!selectedLetter) {
                dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for fallback drawing round." });
                return;
             }
             roundPayload = { exerciseType: newExerciseType, currentLetter: selectedLetter };
        } else {
            console.log("Calculating weights for next round (non-drawing)...");
            const history = getSelectionHistory();
            const weightedLetters = calculateLetterWeights(history, lettersWithImages);
            selectedLetter = getWeightedRandomLetter(weightedLetters);

            if (!selectedLetter) {
                console.error("Weighted random selection failed. Falling back to uniform random from lettersWithImages.");
                selectedLetter = getRandomElement(lettersWithImages);
                if (!selectedLetter) {
                    dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for the round, even with fallback." });
                    return;
                }
            }
            console.log(`Selected letter based on weights: ${selectedLetter}`);
            roundPayload.currentLetter = selectedLetter;

            const letterImages = letterGroups[selectedLetter];
            const selectedImage = letterImages[Math.floor(Math.random() * letterImages.length)];
             if (!selectedImage) {
                 dispatch({ type: 'SET_ERROR', payload: `Failed to select an image for letter ${selectedLetter}.` });
                 return;
            }
            roundPayload.correctImageItem = selectedImage;

            let roundImageOptions: HebrewLetterItem[] = [];
            let roundLetterOptions: string[] = [];

            if (newExerciseType === ExerciseType.LETTER_TO_PICTURE) {
                const incorrectOptions: HebrewLetterItem[] = [];
                const otherLetters = lettersWithImages.filter(l => l !== selectedLetter);
                const shuffledOtherLetters = shuffleArray(otherLetters);
                for(let i = 0; i < Math.min(2, shuffledOtherLetters.length); i++) {
                    const incorrectLetter = shuffledOtherLetters[i];
                    const incorrectImages = letterGroups[incorrectLetter];
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
                roundPayload.imageOptions = roundImageOptions;
            } else { // ExerciseType.PICTURE_TO_LETTER
                const otherLetters = lettersWithImages.filter(l => l !== selectedLetter);
                const shuffledOtherLetters = shuffleArray(otherLetters);
                const finalIncorrectLetters = shuffledOtherLetters.slice(0, Math.min(2, shuffledOtherLetters.length));
                roundLetterOptions = shuffleArray([selectedLetter, ...finalIncorrectLetters]);
                roundPayload.letterOptions = roundLetterOptions;
            }
        }
    }

    dispatch({
      type: 'START_ROUND',
      payload: roundPayload
    });
  }, [availableLetters, letterGroups]); // Removed `dispatch` from deps as it's stable

  // --- Effects ---
  useEffect(() => {
    if (availableLetters.length > 0) {
      startNewRound();
    } else {
      dispatch({ type: 'SET_ERROR', payload: "No Hebrew letter images found in '/public/images/'. Please add images and rebuild." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to run only once on mount

  useEffect(() => {
    let timer: number | undefined;
    const shouldAdvance = state.isCorrect !== null &&
                          (state.exerciseType !== ExerciseType.DRAWING || state.isCorrect === true);

    if (shouldAdvance) {
      console.log(`Advancing round (Exercise: ${state.exerciseType}, Correct: ${state.isCorrect}). Starting next round soon...`);
      timer = setTimeout(() => {
        startNewRound();
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [state.isCorrect, state.exerciseType, startNewRound]);

  // --- Event Handlers ---
  const handleImageSelect = (option: HebrewLetterItem) => {
    if (state.isCorrect !== null) return;
    const isSelectionCorrect = state.correctImageItem?.letter === option.letter;

    if (!isRecordingPaused && state.exerciseType !== ExerciseType.DRAWING && state.correctImageItem && currentQuestionId > 0) {
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
    if (state.isCorrect !== null) return;
    const isSelectionCorrect = state.currentLetter === letter;

    if (!isRecordingPaused && state.exerciseType !== ExerciseType.DRAWING && state.currentLetter && currentQuestionId > 0) {
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
  if (state.error) {
    return <div className="letter-match-container error"><p>{state.error}</p></div>;
  }

  if (availableLetters.length === 0 && !state.error) {
    return (
      <div className="letter-match-container error">
        <p>No Hebrew letter images available.</p>
        <p>Please add images to the '/public/images/' directory (e.g., אבא.png).</p>
      </div>
    );
  }

  if (!state.gameReady) {
      return <div className="letter-match-container loading"><p>Loading game...</p></div>;
  }

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
                    // Pass dispatch directly IF GameArea actually needs it.
                    // Often it's better to pass specific handlers if GameArea shouldn't manage state broadly.
                    // Let's assume for now GameArea might need it or specific actions.
                    dispatch={dispatch}
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