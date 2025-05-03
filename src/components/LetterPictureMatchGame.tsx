import { useEffect, useReducer, useCallback, useState, useRef } from 'react';
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
import ConfettiBoom from 'react-confetti-boom'; // <-- Add new confetti import

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
  const [showConfetti, setShowConfetti] = useState(false); // State to trigger the boom
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 0.5, y: 0.5 }); // State for confetti origin (default center)
  const confettiTimeoutRef = useRef<number | null>(null);
  const scoreDisplayRef = useRef<HTMLDivElement>(null); // Ref for the ScoreDisplay component

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
    // Adjust probabilities for 4 types (e.g., 0.25 each)
    if (rand < 0.25) { // Example: 25% chance
        newExerciseType = ExerciseType.DRAWING;
    } else if (rand < 0.50) { // Example: 25% chance
        newExerciseType = ExerciseType.LETTER_TO_PICTURE;
    } else if (rand < 0.75) { // Example: 25% chance
        newExerciseType = ExerciseType.PICTURE_TO_LETTER;
    } else { // Example: 25% chance
        newExerciseType = ExerciseType.WORD_SCRAMBLE;
    }

    // Fallback if selected type is not possible (e.g., Word Scramble needs words > 1 letter)
    // This needs refinement based on actual data
    const canDoWordScramble = availableLetters.some(letter =>
        letterGroups[letter]?.some(item => item.word && item.word.length > 1 && item.word.length <= 5)
    );
     const canDoMatching = availableLetters.some(letter =>
         letterGroups[letter]?.length > 0
     );


    if (newExerciseType === ExerciseType.WORD_SCRAMBLE && !canDoWordScramble) {
        console.warn("Cannot do Word Scramble, falling back...");
        newExerciseType = canDoMatching ? ExerciseType.LETTER_TO_PICTURE : ExerciseType.DRAWING; // Example fallback
    } else if ((newExerciseType === ExerciseType.LETTER_TO_PICTURE || newExerciseType === ExerciseType.PICTURE_TO_LETTER) && !canDoMatching) {
         console.warn("Cannot do Matching, falling back to Drawing...");
         newExerciseType = ExerciseType.DRAWING;
    }
    // Add more fallback logic as needed


    let roundPayload: Partial<GameState> = { exerciseType: newExerciseType };
    let selectedLetter: string | undefined;
    let selectedImage: HebrewLetterItem | undefined; // Define selectedImage earlier

    // --- Drawing Logic ---
    if (newExerciseType === ExerciseType.DRAWING) {
        selectedLetter = getRandomElement(availableLetters);
        if (!selectedLetter) {
             dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for drawing round." });
             return;
        }
        roundPayload.currentLetter = selectedLetter;
        // Drawing doesn't use correctImageItem directly in the round setup
        // Find an image for potential display later if needed, but not crucial for round start
         const potentialImages = letterGroups[selectedLetter];
         if (potentialImages && potentialImages.length > 0) {
             roundPayload.correctImageItem = potentialImages[Math.floor(Math.random() * potentialImages.length)];
         }


    } else {
        // --- Logic for Non-Drawing Rounds (Matching & Word Scramble) ---

        // Filter letters suitable for the chosen exercise type
        let candidateLetters: string[];
        if (newExerciseType === ExerciseType.WORD_SCRAMBLE) {
            candidateLetters = availableLetters.filter(letter =>
                letterGroups[letter]?.some(item => item.word && item.word.length > 1 && item.word.length <= 5)
            );
        } else { // LETTER_TO_PICTURE or PICTURE_TO_LETTER
            candidateLetters = availableLetters.filter(letter =>
                letterGroups[letter] && letterGroups[letter].length > 0
            );
        }


        if (candidateLetters.length === 0) {
             // This case should be less likely due to fallbacks above, but handle defensively
             console.error(`No candidate letters found for exercise type ${newExerciseType}. Falling back to DRAWING.`);
             newExerciseType = ExerciseType.DRAWING;
             selectedLetter = getRandomElement(availableLetters);
             if (!selectedLetter) {
                 dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for fallback drawing round." });
                 return;
             }
             roundPayload = { exerciseType: newExerciseType, currentLetter: selectedLetter };
              // Assign a potential image for drawing's correctImageItem here too
             const potentialImages = letterGroups[selectedLetter];
             if (potentialImages && potentialImages.length > 0) {
                  roundPayload.correctImageItem = potentialImages[Math.floor(Math.random() * potentialImages.length)];
             }

        } else {
             // Select letter using weighted random logic based on history
             console.log(`Calculating weights for next round (${newExerciseType})...`);
             const history = getSelectionHistory();
             const weightedLetters = calculateLetterWeights(history, candidateLetters); // Use candidate letters
             selectedLetter = getWeightedRandomLetter(weightedLetters);

             if (!selectedLetter) {
                 console.error("Weighted random selection failed. Falling back to uniform random from candidateLetters.");
                 selectedLetter = getRandomElement(candidateLetters);
                 if (!selectedLetter) {
                     dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for the round, even with fallback." });
                     return;
                 }
             }
             console.log(`Selected letter based on weights: ${selectedLetter}`);
             roundPayload.currentLetter = selectedLetter; // Store the driving letter

             // Select Image Item based on the selected letter
             const possibleImages = letterGroups[selectedLetter].filter(item =>
                 // Ensure valid word for scramble (length > 1 and <= 5)
                 newExerciseType === ExerciseType.WORD_SCRAMBLE
                    ? (item.word && item.word.length > 1 && item.word.length <= 5)
                    : true
             );

             if (possibleImages.length === 0) {
                  // This indicates an issue with filtering or data inconsistency
                  dispatch({ type: 'SET_ERROR', payload: `No suitable images/words found for letter ${selectedLetter} and exercise type ${newExerciseType}.` });
                  return;
             }
             selectedImage = possibleImages[Math.floor(Math.random() * possibleImages.length)];
             if (!selectedImage) { // Should not happen if possibleImages is not empty
                 dispatch({ type: 'SET_ERROR', payload: `Internal error selecting image for letter ${selectedLetter}.` });
                 return;
            }
             roundPayload.correctImageItem = selectedImage; // Essential for all non-drawing types


            // --- Prepare Exercise-Specific Options ---
            if (newExerciseType === ExerciseType.LETTER_TO_PICTURE) {
                const incorrectOptions: HebrewLetterItem[] = [];
                const otherLetters = availableLetters.filter(l => l !== selectedLetter && letterGroups[l]?.length > 0); // Ensure other letters have images
                const shuffledOtherLetters = shuffleArray(otherLetters);

                for (let i = 0; i < Math.min(2, shuffledOtherLetters.length); i++) {
                    const incorrectLetter = shuffledOtherLetters[i];
                    const incorrectImages = letterGroups[incorrectLetter]; // Already checked for length > 0
                    const incorrectImage = incorrectImages[Math.floor(Math.random() * incorrectImages.length)];
                    incorrectOptions.push(incorrectImage);
                }

                // If not enough options from other letters, use other images from the same letter
                 if (incorrectOptions.length < 2 && selectedImage) {
                     const otherImagesFromSameLetter = letterGroups[selectedLetter].filter(img => img.imageUrl !== selectedImage!.imageUrl); // Use selectedImage
                    const shuffledSameLetterImages = shuffleArray(otherImagesFromSameLetter);
                    for (let i = 0; i < Math.min(2 - incorrectOptions.length, shuffledSameLetterImages.length); i++) {
                        incorrectOptions.push(shuffledSameLetterImages[i]);
                    }
                }

                roundPayload.imageOptions = shuffleArray([selectedImage, ...incorrectOptions]);

            } else if (newExerciseType === ExerciseType.PICTURE_TO_LETTER) {
                 const otherLetters = availableLetters.filter(l => l !== selectedLetter);
                 const shuffledOtherLetters = shuffleArray(otherLetters);
                 const finalIncorrectLetters = shuffledOtherLetters.slice(0, Math.min(2, shuffledOtherLetters.length));
                 roundPayload.letterOptions = shuffleArray([selectedLetter, ...finalIncorrectLetters]);

            } else if (newExerciseType === ExerciseType.WORD_SCRAMBLE) {
                 const targetWord = selectedImage?.word; // Get word from the selected image
                 // Re-check length constraint here for safety, though filtering above should handle it
                 if (!targetWord || targetWord.length <= 1 || targetWord.length > 5) {
                      // This case should have been prevented by candidate letter filtering, but handle defensively
                     dispatch({ type: 'SET_ERROR', payload: `Selected image for Word Scramble has invalid word: '${targetWord}' (length ${targetWord?.length}) for letter ${selectedLetter}.` });
                     return; // Or fallback again
                 }
                 roundPayload.targetWord = targetWord;
                 roundPayload.shuffledLetters = shuffleArray(targetWord.split(''));
                 // currentArrangement is initialized by the reducer based on targetWord length
            }
        }
    }


    // Dispatch the final payload
    dispatch({
      type: 'START_ROUND',
      payload: roundPayload
    });

  }, [availableLetters, letterGroups]); // Dependencies: letterGroups added

  // --- Effects ---
  useEffect(() => {
    if (availableLetters.length > 0) {
      startNewRound();
    } else {
      dispatch({ type: 'SET_ERROR', payload: "No Hebrew letter images found in '/public/images/'. Please add images and rebuild." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to run only once on mount

  // Effect to trigger confetti on score milestones
  useEffect(() => {
    if (state.score > 0 && state.score % 2 === 0) {
      console.log(`Score milestone reached: ${state.score}. Triggering confetti boom!`);

      // Calculate confetti origin from ScoreDisplay position
      if (scoreDisplayRef.current) {
        const rect = scoreDisplayRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        console.log(`Setting confetti origin to x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`);
        setConfettiOrigin({ x, y });
      } else {
        console.warn("ScoreDisplay ref not found, using default center origin for confetti.");
        setConfettiOrigin({ x: 0.5, y: 0.5 }); // Fallback to center
      }

      setShowConfetti(true); // Trigger the confetti component to mount

      // Clear previous timeout if it exists
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }

      // Set a timer to unmount the confetti component after animation
      confettiTimeoutRef.current = window.setTimeout(() => {
        console.log("Hiding confetti component.");
        setShowConfetti(false);
        confettiTimeoutRef.current = null;
      }, 1500); // 3 seconds duration (adjust if needed)
    }

    // Cleanup timeout on component unmount or if score changes before timeout finishes
    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, [state.score]); // Rerun effect when score changes

  useEffect(() => {
    let timer: number | undefined;
    // --- Condition to advance round ---
    const shouldAdvance =
        // Always advance if correct
        state.isCorrect === true ||
        // Advance if incorrect, BUT NOT for Word Scramble (allow correction)
        (state.isCorrect === false && state.exerciseType !== ExerciseType.WORD_SCRAMBLE);

    if (shouldAdvance) {
      console.log(`Advancing round automatically (Exercise: ${state.exerciseType}, Correct: ${state.isCorrect}). Starting next round soon...`);
      timer = setTimeout(() => {
        startNewRound();
      }, 2000); // Adjust delay as needed
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
    // Correct check: Compare selected letter with the letter of the correct image item
    const isSelectionCorrect = state.correctImageItem?.letter === letter;

    // Recording logic needs the target letter, which is correctImageItem.letter here
    if (!isRecordingPaused && state.exerciseType === ExerciseType.PICTURE_TO_LETTER && state.correctImageItem && currentQuestionId > 0) {
        const record: SelectionRecord = {
            timestamp: Date.now(),
            questionId: currentQuestionId,
            targetLetter: state.correctImageItem.letter, // Use correct target letter
            selectedAnswer: letter,
            isCorrect: isSelectionCorrect,
            exerciseType: state.exerciseType,
        };
        saveSelection(record);
        onSelectionSave();
    }
    // Note: The old recording logic for non-drawing might need review if currentLetter was used elsewhere incorrectly.
    // For PICTURE_TO_LETTER, the above block handles it correctly.

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
        {/* Confetti Container with high z-index */}
        {showConfetti && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}>
            <ConfettiBoom
              mode="boom"
              x={confettiOrigin.x} // Set horizontal origin
              y={confettiOrigin.y} // Set vertical origin
              particleCount={200} // More particles
              shapeSize={32} // Bigger particles
              deg={90} // Initial upward angle
              spreadDeg={60} // Wider spread
              launchSpeed={1.3} // Slower launch
              effectCount={1} // Only one boom
            />
          </div>
        )}
        <div className="letter-match-container">
            <InstructionDisplay exerciseType={state.exerciseType} />
            <ScoreDisplay score={state.score} ref={scoreDisplayRef} />
            <div className="game-content">
                <GameArea
                    gameState={state}
                    onImageSelect={handleImageSelect}
                    onLetterSelect={handleLetterSelect}
                    dispatch={dispatch}
                />
                <div className="feedback-container">
                    {/* Only show text feedback for non-word-scramble types */}
                    {state.exerciseType !== ExerciseType.WORD_SCRAMBLE && (
                        <FeedbackDisplay isCorrect={state.isCorrect} />
                    )}
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