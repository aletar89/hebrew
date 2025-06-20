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
import { ConfettiManager } from './ConfettiManager'; // Import the new manager

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
  const scoreDisplayRef = useRef<HTMLDivElement>(null); // Keep ref for potential future use or other components

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
    let newExerciseType: ExerciseType = ExerciseType.PICTURE_TO_WORD; // Default fallback
    
    // Define weights for each exercise type (easily adjustable)
    // The probability of each exercise = weight / totalWeight
    // Example: If you want PICTURE_TO_WORD to be 50% and others 10% each:
    // PICTURE_TO_WORD: 50, others: 10 each (total = 100, so 50% vs 10% each)
    const exerciseWeights = {
        [ExerciseType.DRAWING]: 10,
        [ExerciseType.LETTER_TO_PICTURE]: 10,
        [ExerciseType.PICTURE_TO_LETTER]: 10,
        [ExerciseType.PICTURE_TO_WORD]: 10,
        [ExerciseType.WORD_TO_PICTURE]: 10,
        [ExerciseType.WORD_SCRAMBLE]: 10
    };
    
    // Calculate total weight
    const totalWeight = Object.values(exerciseWeights).reduce((sum, weight) => sum + weight, 0);
    
    // Calculate cumulative weights and select exercise type
    let cumulativeWeight = 0;
    for (const [exerciseType, weight] of Object.entries(exerciseWeights)) {
        cumulativeWeight += weight;
        if (rand < cumulativeWeight / totalWeight) {
            newExerciseType = exerciseType as ExerciseType;
            break;
        }
    }
    
    // Fallback to first exercise type if something goes wrong
    if (!newExerciseType) {
        newExerciseType = ExerciseType.PICTURE_TO_WORD;
    }

    // Fallback if selected type is not possible (e.g., Word Scramble needs words > 1 letter)
    // This needs refinement based on actual data
    const canDoWordScramble = availableLetters.some(letter =>
        letterGroups[letter]?.some(item => item.word && item.word.length > 1 && item.word.length <= 5)
    );
     const canDoMatching = availableLetters.some(letter =>
         letterGroups[letter]?.length > 0
     );
     const canDoWordToPicture = availableLetters.some(letter =>
         letterGroups[letter] && letterGroups[letter].length >= 3
     );
     const canDoPictureToWord = availableLetters.some(letter =>
         letterGroups[letter] && letterGroups[letter].length >= 3
     );


    if (newExerciseType === ExerciseType.WORD_SCRAMBLE && !canDoWordScramble) {
        console.warn("Cannot do Word Scramble, falling back...");
        newExerciseType = canDoMatching ? ExerciseType.LETTER_TO_PICTURE : ExerciseType.DRAWING; // Example fallback
    } else if ((newExerciseType === ExerciseType.LETTER_TO_PICTURE || newExerciseType === ExerciseType.PICTURE_TO_LETTER) && !canDoMatching) {
         console.warn("Cannot do Matching, falling back to Drawing...");
         newExerciseType = ExerciseType.DRAWING;
    } else if (newExerciseType === ExerciseType.WORD_TO_PICTURE && !canDoWordToPicture) {
         console.warn("Cannot do Word to Picture, falling back...");
         newExerciseType = canDoMatching ? ExerciseType.LETTER_TO_PICTURE : ExerciseType.DRAWING;
    } else if (newExerciseType === ExerciseType.PICTURE_TO_WORD && !canDoPictureToWord) {
         console.warn("Cannot do Picture to Word, falling back...");
         newExerciseType = canDoMatching ? ExerciseType.PICTURE_TO_LETTER : ExerciseType.DRAWING;
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
             // Select letter using weighted random logic based on history FOR MATCHING GAMES
             // For Word Scramble, use simple random selection

             if (newExerciseType === ExerciseType.WORD_SCRAMBLE) {
                 console.log(`Selecting random letter for Word Scramble from ${candidateLetters.length} candidates...`);
                 selectedLetter = getRandomElement(candidateLetters);
             } else {
                 // Use weighted random for LETTER_TO_PICTURE and PICTURE_TO_LETTER
                 console.log(`Calculating weights for next round (${newExerciseType})...`);
                 const history = getSelectionHistory();
                 const weightedLetters = calculateLetterWeights(history, candidateLetters);
                 selectedLetter = getWeightedRandomLetter(weightedLetters);

                 if (!selectedLetter) {
                     console.error("Weighted random selection failed. Falling back to uniform random from candidateLetters.");
                     selectedLetter = getRandomElement(candidateLetters); // Fallback still needed
                 }
             }

             // Fallback if selection still failed (should be rare)
             if (!selectedLetter) {
                 console.error("Failed to select any letter for the round, even with fallback. Reverting to random DRAWING.");
                 // Minimal payload for a drawing fallback
                 newExerciseType = ExerciseType.DRAWING;
                 selectedLetter = getRandomElement(availableLetters);
                 if (!selectedLetter) {
                     dispatch({ type: 'SET_ERROR', payload: "CRITICAL: Failed to select any letter for fallback drawing round." });
                     return;
                 }
                 roundPayload = { exerciseType: newExerciseType, currentLetter: selectedLetter };
                 const potentialImages = letterGroups[selectedLetter];
                 if (potentialImages && potentialImages.length > 0) {
                     roundPayload.correctImageItem = potentialImages[Math.floor(Math.random() * potentialImages.length)];
                 }
                  dispatch({ type: 'START_ROUND', payload: roundPayload }); // Dispatch fallback round
                  return; // Exit startNewRound early
             }

             console.log(`Selected letter: ${selectedLetter}`);
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
            } else if (newExerciseType === ExerciseType.WORD_TO_PICTURE) {
                // Find letters that have multiple words (at least 3 for 3 options)
                const candidateLetters = availableLetters.filter(letter =>
                    letterGroups[letter] && letterGroups[letter].length >= 3
                );

                if (candidateLetters.length === 0) {
                    console.warn("Cannot do Word to Picture - no letters with enough words");
                    newExerciseType = ExerciseType.LETTER_TO_PICTURE;
                    // Fallback logic will be handled in the next iteration
                    return;
                }

                // Select a letter using weighted random
                const history = getSelectionHistory();
                const weightedLetters = calculateLetterWeights(history, candidateLetters);
                selectedLetter = getWeightedRandomLetter(weightedLetters);
                
                if (!selectedLetter) {
                    selectedLetter = getRandomElement(candidateLetters);
                }

                if (!selectedLetter) {
                    dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for Word to Picture round." });
                    return;
                }

                // Get all words for this letter
                const allWordsForLetter = letterGroups[selectedLetter];
                
                // Select the correct word/image
                selectedImage = getRandomElement(allWordsForLetter);
                
                if (!selectedImage) {
                    dispatch({ type: 'SET_ERROR', payload: `Failed to select image for letter ${selectedLetter}.` });
                    return;
                }
                
                // Get 2 other words from the same letter as incorrect options
                const otherWords = allWordsForLetter.filter((img: HebrewLetterItem) => img.word !== selectedImage!.word);
                const shuffledOtherWords = shuffleArray(otherWords);
                const incorrectOptions = shuffledOtherWords.slice(0, 2);
                
                // If we don't have enough other words, this shouldn't happen due to filtering
                if (incorrectOptions.length < 2) {
                    console.warn(`Not enough words for letter ${selectedLetter}`);
                    newExerciseType = ExerciseType.LETTER_TO_PICTURE;
                    // Fallback logic will be handled in the next iteration
                    return;
                }

                roundPayload.currentWord = selectedImage.word;
                roundPayload.currentLetter = selectedLetter;
                roundPayload.correctImageItem = selectedImage;
                roundPayload.imageOptions = shuffleArray([selectedImage, ...incorrectOptions]);
            } else if (newExerciseType === ExerciseType.PICTURE_TO_WORD) {
                // Find letters that have multiple words (at least 3 for 3 options)
                const candidateLetters = availableLetters.filter(letter =>
                    letterGroups[letter] && letterGroups[letter].length >= 3
                );

                if (candidateLetters.length === 0) {
                    console.warn("Cannot do Picture to Word - no letters with enough words");
                    newExerciseType = ExerciseType.PICTURE_TO_LETTER;
                    // Fallback logic will be handled in the next iteration
                    return;
                }

                // Select a letter using weighted random
                const history = getSelectionHistory();
                const weightedLetters = calculateLetterWeights(history, candidateLetters);
                selectedLetter = getWeightedRandomLetter(weightedLetters);
                
                if (!selectedLetter) {
                    selectedLetter = getRandomElement(candidateLetters);
                }

                if (!selectedLetter) {
                    dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for Picture to Word round." });
                    return;
                }

                // Get all words for this letter
                const allWordsForLetter = letterGroups[selectedLetter];
                
                // Select the correct word/image
                selectedImage = getRandomElement(allWordsForLetter);
                
                if (!selectedImage) {
                    dispatch({ type: 'SET_ERROR', payload: `Failed to select image for letter ${selectedLetter}.` });
                    return;
                }
                
                // Get 2 other words from the same letter as incorrect options
                const otherWords = allWordsForLetter.filter((img: HebrewLetterItem) => img.word !== selectedImage!.word);
                const shuffledOtherWords = shuffleArray(otherWords);
                const incorrectWordOptions = shuffledOtherWords.slice(0, 2).map(img => img.word);
                
                // If we don't have enough other words, this shouldn't happen due to filtering
                if (incorrectWordOptions.length < 2) {
                    console.warn(`Not enough words for letter ${selectedLetter}`);
                    newExerciseType = ExerciseType.PICTURE_TO_LETTER;
                    // Fallback logic will be handled in the next iteration
                    return;
                }

                roundPayload.currentLetter = selectedLetter;
                roundPayload.correctImageItem = selectedImage;
                roundPayload.wordOptions = shuffleArray([selectedImage.word, ...incorrectWordOptions]);
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
    
    // Different correctness check based on exercise type
    let isSelectionCorrect: boolean;
    if (state.exerciseType === ExerciseType.LETTER_TO_PICTURE) {
        isSelectionCorrect = state.correctImageItem?.letter === option.letter;
    } else if (state.exerciseType === ExerciseType.WORD_TO_PICTURE) {
        isSelectionCorrect = state.correctImageItem?.word === option.word;
    } else {
        isSelectionCorrect = false; // Shouldn't happen
    }

    if (!isRecordingPaused && 
        (state.exerciseType === ExerciseType.LETTER_TO_PICTURE || 
         state.exerciseType === ExerciseType.WORD_TO_PICTURE) &&
        state.correctImageItem && currentQuestionId > 0) {
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

  const handleWordSelect = (word: string) => {
    if (state.isCorrect !== null) return;
    const isSelectionCorrect = state.correctImageItem?.word === word;

    if (!isRecordingPaused && state.exerciseType === ExerciseType.PICTURE_TO_WORD && 
        state.correctImageItem && currentQuestionId > 0) {
        const record: SelectionRecord = {
            timestamp: Date.now(),
            questionId: currentQuestionId,
            targetLetter: state.correctImageItem.letter,
            targetWord: state.correctImageItem.word,
            selectedAnswer: word,
            isCorrect: isSelectionCorrect,
            exerciseType: state.exerciseType,
        };
        saveSelection(record);
        onSelectionSave();
    }

    dispatch({ type: 'SELECT_WORD', payload: { selected: word, isCorrect: isSelectionCorrect } });
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
        {/* Add the ConfettiManager component here, passing the score */}
        <ConfettiManager score={state.score} />

        <div className="letter-match-container">
            <InstructionDisplay exerciseType={state.exerciseType} />
            <ScoreDisplay score={state.score} ref={scoreDisplayRef} />
            <div className="game-content">
                <GameArea
                    gameState={state}
                    onImageSelect={handleImageSelect}
                    onLetterSelect={handleLetterSelect}
                    onWordSelect={handleWordSelect}
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