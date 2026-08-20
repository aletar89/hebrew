import { useEffect, useReducer, useCallback, useState, useRef } from 'react';
import { GermanLetterItem } from '../utils/imageUtils'; // Adjust path
import { getRandomElement, shuffleArray } from '../utils/arrayUtils'; // Adjust path
import { GameState, gameReducer, initialState, ExerciseType, MatchingLetterCase } from '../state/gameReducer'; // Adjust path
import { ReadingChunk, readingChunks } from '../data/readingChunks';
import { ScoreDisplay } from './ScoreDisplay';
import { ScoreProgressBar } from './ScoreProgressBar';
import { FeedbackDisplay } from './FeedbackDisplay';
import { GameArea } from './GameArea';
import { NextRoundButton } from './NextRoundButton';
import { StatsDisplay } from './StatsDisplay';
import { ComboIndicator } from './ComboIndicator';
import { ScoreRewardBurst } from './ScoreRewardBurst';
import {
  saveSelection,
  SelectionRecord,
  StoredCurrentRound,
  clearCurrentRound,
  getCurrentRound,
  getSelectionHistory,
  getSessionCombo,
  getSessionScore,
  resetSessionCombo,
  resetSessionScore,
  saveCurrentRound,
  saveSessionCombo,
  saveSessionScore,
} from '../utils/storageUtils'; // Adjust path
import { calculateItemWeights, calculateLetterWeights, getWeightedRandomItem, getWeightedRandomLetter } from '../utils/spacedRepetitionUtils'; // Adjust path
import { ConfettiManager } from './ConfettiManager'; // Import the new manager
import { letterDotPatterns } from '../utils/letterDotPatterns';
import { enqueueIdleTasks, preloadImage } from '../utils/preloadUtils';
import { preloadChunkAudio, preloadWordAudio } from '../utils/audioUtils';
import { canScrambleWord, getWordScrambleUnits } from '../utils/syllableUtils';

// --- Game Logic Component ---
const RACE_COMBO_UNLOCK = 9;
const CHUNK_OPTION_COUNT = 4;
const LOWERCASE_EXERCISE_PROBABILITY = 0.75;

const getRandomMatchingLetterCase = (): MatchingLetterCase => (
  Math.random() < LOWERCASE_EXERCISE_PROBABILITY ? 'lower' : 'upper'
);

const getConflictingLetter = (letter: string): string | null => {
  if (letter === 'I') return 'L';
  if (letter === 'L') return 'I';
  return null;
};

const getUnlockedChunkLevels = (score: number): number[] => {
  if (score >= 12) return [1, 2];
  return [1];
};

const buildChunkOptions = (targetChunk: ReadingChunk, candidates: ReadingChunk[]): ReadingChunk[] => {
  const sameGroup = shuffleArray(candidates.filter(chunk =>
    chunk.id !== targetChunk.id && chunk.confusionGroup === targetChunk.confusionGroup
  ));
  const sameLevel = shuffleArray(candidates.filter(chunk =>
    chunk.id !== targetChunk.id &&
    chunk.confusionGroup !== targetChunk.confusionGroup &&
    chunk.level === targetChunk.level
  ));
  const fallback = shuffleArray(candidates.filter(chunk =>
    chunk.id !== targetChunk.id &&
    chunk.confusionGroup !== targetChunk.confusionGroup &&
    chunk.level !== targetChunk.level
  ));

  return shuffleArray([
    targetChunk,
    ...[...sameGroup, ...sameLevel, ...fallback].slice(0, CHUNK_OPTION_COUNT - 1),
  ]);
};

export interface LetterPictureMatchProps {
  letterGroups: Record<string, GermanLetterItem[]>;
  availableLetters: string[];
  isRecordingPaused: boolean;
  onSelectionSave: () => void;
  onTogglePause: () => void;
  updateTrigger: number;
  showDebugControls: boolean;
}

const isStoredRoundValid = (
  storedRound: StoredCurrentRound | null,
  letterGroups: Record<string, GermanLetterItem[]>,
  availableLetters: string[]
): storedRound is StoredCurrentRound => {
  if (!storedRound || !Object.values(ExerciseType).includes(storedRound.payload.exerciseType as ExerciseType)) {
    return false;
  }

  const payload = storedRound.payload;
  const knownImageUrls = new Set(Object.values(letterGroups).flat().map(item => item.imageUrl));
  const hasKnownImage = (item: GermanLetterItem | null | undefined) => (
    !item || knownImageUrls.has(item.imageUrl)
  );
  const hasKnownImages = (items: GermanLetterItem[] | undefined) => (
    !items || items.every(hasKnownImage)
  );
  const hasKnownChunks = (chunks: ReadingChunk[] | undefined) => (
    !chunks || chunks.every(chunk => readingChunks.some(knownChunk => knownChunk.id === chunk.id))
  );

  return (
    (!payload.currentLetter || availableLetters.includes(payload.currentLetter)) &&
    hasKnownImage(payload.correctImageItem) &&
    hasKnownImages(payload.imageOptions) &&
    hasKnownImages(payload.raceCorrectItems) &&
    hasKnownImages(payload.raceDistractorItems) &&
    (!payload.currentChunk || readingChunks.some(chunk => chunk.id === payload.currentChunk?.id)) &&
    hasKnownChunks(payload.chunkOptions)
  );
};

export function LetterPictureMatch({ letterGroups, availableLetters, isRecordingPaused, onSelectionSave, onTogglePause, updateTrigger, showDebugControls }: LetterPictureMatchProps) {
  // Let TS infer types from reducer and initial state
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(0);
  const [showStats, setShowStats] = useState(false);
  const [isConfirmingNewSession, setIsConfirmingNewSession] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scoreDisplayRef = useRef<HTMLDivElement>(null); // Keep ref for potential future use or other components
  const hasQueuedIdlePreload = useRef(false);
  const caseMatchAttemptCounter = useRef(0);
  const hasLoadedStoredScore = useRef(false);
  const previousScoreRef = useRef(0);
  const handledOutcomeQuestionIdRef = useRef<number | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const raceCandidateLetters = availableLetters.filter(letter =>
    letterGroups[letter] && letterGroups[letter].length >= 4
  );
  const canDoRaceToPicture = raceCandidateLetters.length > 0 &&
    availableLetters.some(letter =>
      !raceCandidateLetters.includes(letter) && (letterGroups[letter]?.length ?? 0) > 0
    );

  const handleToggleStats = () => {
    setShowStats(prev => !prev);
    setIsMenuOpen(false);
  };
  const handleStartNewSession = () => {
    if (!isConfirmingNewSession) {
      setIsConfirmingNewSession(true);
      return;
    }

    setIsConfirmingNewSession(false);
    setIsMenuOpen(false);
    resetSessionScore();
    resetSessionCombo();
    clearCurrentRound();
    setComboCount(0);
    dispatch({ type: 'SET_SCORE', payload: 0 });
    startNewRound();
  };

  useEffect(() => {
    if (!isConfirmingNewSession) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsConfirmingNewSession(false);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isConfirmingNewSession]);

  // --- Game Logic Callbacks ---
  const startNewRound = useCallback((forcedExerciseType?: ExerciseType) => {
    console.log("Starting new round...");
    setIsConfirmingNewSession(false);
    const newQuestionTimestamp = Date.now();
    setCurrentQuestionId(newQuestionTimestamp);
    caseMatchAttemptCounter.current = 0;
    console.log("New Question ID (Timestamp):", newQuestionTimestamp);
    dispatch({ type: 'RESET_FEEDBACK' });

    if (availableLetters.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: "No German letters available to start a round." });
        return;
    }

    let newExerciseType: ExerciseType = forcedExerciseType ?? ExerciseType.PICTURE_TO_WORD;
    if (!forcedExerciseType) {
      const rand = Math.random();
      const exerciseWeights = {
          // Favor word-based rounds more often than the other exercise types.
          [ExerciseType.CASE_MATCH]: 8,
          [ExerciseType.DOT_TRACING]: 5,
          [ExerciseType.DRAWING]: 5,
          [ExerciseType.LETTER_TO_PICTURE]: 5,
          [ExerciseType.PICTURE_TO_LETTER]: 5,
          [ExerciseType.PICTURE_TO_WORD]: 8,
          [ExerciseType.WORD_TO_PICTURE]: 14,
          [ExerciseType.WORD_SCRAMBLE]: 15,
          [ExerciseType.RACE_TO_PICTURE]: 0,
          [ExerciseType.CHUNK_SOUND_TO_TEXT]: 20,
          [ExerciseType.CHUNK_TEXT_TO_SOUND]: 20,
      };
      const totalWeight = Object.values(exerciseWeights).reduce((sum, weight) => sum + weight, 0);
      let cumulativeWeight = 0;

      for (const [exerciseType, weight] of Object.entries(exerciseWeights)) {
          cumulativeWeight += weight;
          if (rand < cumulativeWeight / totalWeight) {
              newExerciseType = exerciseType as ExerciseType;
              break;
          }
      }

      if (!newExerciseType) {
          newExerciseType = ExerciseType.PICTURE_TO_WORD;
          console.warn("No exercise type selected, falling back to PICTURE_TO_WORD");
          console.warn("rand:", rand);
          console.warn("cumulativeWeight:", cumulativeWeight);
          console.warn("totalWeight:", totalWeight);
          console.warn("newExerciseType:", newExerciseType);
      }
    }

    const canDoWordScramble = availableLetters.some(letter =>
        letterGroups[letter]?.some(item => canScrambleWord(item.word))
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
    const canDoCaseMatch = availableLetters.length >= 4;
    const unlockedChunkLevels = getUnlockedChunkLevels(state.score);
    const availableChunks = readingChunks.filter(chunk => unlockedChunkLevels.includes(chunk.level));
    const canDoChunkSoundChoice = availableChunks.length >= CHUNK_OPTION_COUNT;
    const dotTracingLetters = availableLetters.filter(letter => letterDotPatterns[letter]);
    const canDoDotTracing = dotTracingLetters.length > 0;
    if (newExerciseType === ExerciseType.CASE_MATCH && !canDoCaseMatch) {
        console.warn("Cannot do Case Match, falling back...");
        newExerciseType = canDoMatching ? ExerciseType.LETTER_TO_PICTURE : ExerciseType.DRAWING;
    } else if (newExerciseType === ExerciseType.WORD_SCRAMBLE && !canDoWordScramble) {
        console.warn("Cannot do Word Scramble, falling back...");
        newExerciseType = canDoMatching ? ExerciseType.LETTER_TO_PICTURE : ExerciseType.DRAWING;
    } else if ((newExerciseType === ExerciseType.LETTER_TO_PICTURE || newExerciseType === ExerciseType.PICTURE_TO_LETTER) && !canDoMatching) {
        console.warn("Cannot do Matching, falling back to Drawing...");
        newExerciseType = ExerciseType.DRAWING;
    } else if (newExerciseType === ExerciseType.WORD_TO_PICTURE && !canDoWordToPicture) {
        console.warn("Cannot do Word to Picture, falling back...");
        newExerciseType = canDoMatching ? ExerciseType.LETTER_TO_PICTURE : ExerciseType.DRAWING;
    } else if (newExerciseType === ExerciseType.PICTURE_TO_WORD && !canDoPictureToWord) {
        console.warn("Cannot do Picture to Word, falling back...");
        newExerciseType = canDoMatching ? ExerciseType.PICTURE_TO_LETTER : ExerciseType.DRAWING;
    } else if (newExerciseType === ExerciseType.DOT_TRACING && !canDoDotTracing) {
        console.warn("Cannot do Dot Tracing, falling back to Drawing...");
        newExerciseType = ExerciseType.DRAWING;
    } else if (newExerciseType === ExerciseType.RACE_TO_PICTURE && !canDoRaceToPicture) {
        console.warn("Cannot do Race to Picture, falling back...");
        newExerciseType = canDoMatching ? ExerciseType.LETTER_TO_PICTURE : ExerciseType.DRAWING;
    } else if (
      (
        newExerciseType === ExerciseType.CHUNK_SOUND_TO_TEXT ||
        newExerciseType === ExerciseType.CHUNK_TEXT_TO_SOUND
      ) &&
      !canDoChunkSoundChoice
    ) {
        console.warn("Cannot do Chunk Sound Choice, falling back...");
        newExerciseType = canDoMatching ? ExerciseType.LETTER_TO_PICTURE : ExerciseType.DRAWING;
    }

    let roundPayload: Partial<GameState> = { exerciseType: newExerciseType };
    let selectedLetter: string | undefined;
    let selectedImage: GermanLetterItem | undefined;

    if (newExerciseType === ExerciseType.CASE_MATCH) {
        const selectedLetters = shuffleArray(availableLetters).slice(0, 4);
        if (selectedLetters.length < 4) {
            dispatch({ type: 'SET_ERROR', payload: "Need at least 4 letters to start a capital/lowercase matching round." });
            return;
        }

        roundPayload.uppercaseLetters = selectedLetters;
        roundPayload.lowercaseLetters = shuffleArray(
            selectedLetters.map(letter => letter.toLocaleLowerCase('de-DE'))
        );
    } else if (newExerciseType === ExerciseType.DOT_TRACING) {
        selectedLetter = getRandomElement(dotTracingLetters.length > 0 ? dotTracingLetters : availableLetters);
        if (!selectedLetter) {
            dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for dot tracing round." });
            return;
        }

        roundPayload.currentLetter = selectedLetter;
    } else if (newExerciseType === ExerciseType.DRAWING) {
        selectedLetter = getRandomElement(availableLetters);
        if (!selectedLetter) {
            dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for drawing round." });
            return;
        }

        roundPayload.currentLetter = selectedLetter;
        const potentialImages = letterGroups[selectedLetter];
        if (potentialImages && potentialImages.length > 0) {
            roundPayload.correctImageItem = potentialImages[Math.floor(Math.random() * potentialImages.length)];
        }
    } else if (newExerciseType === ExerciseType.RACE_TO_PICTURE) {
        const selectedRaceLetter = getRandomElement(raceCandidateLetters);
        if (!selectedRaceLetter) {
            dispatch({ type: 'SET_ERROR', payload: "Failed to select a letter for race mode." });
            return;
        }

        const correctRaceItems = shuffleArray(letterGroups[selectedRaceLetter]).slice(0, 4);
        const distractorPool = shuffleArray(
            availableLetters
                .filter(letter => letter !== selectedRaceLetter)
                .flatMap(letter => letterGroups[letter] ?? [])
        ).slice(0, 8);

        if (correctRaceItems.length < 4 || distractorPool.length < 2) {
            dispatch({ type: 'SET_ERROR', payload: `Need more pictures to start race mode for ${selectedRaceLetter}.` });
            return;
        }

        roundPayload.currentLetter = selectedRaceLetter;
        roundPayload.raceCorrectItems = correctRaceItems;
        roundPayload.raceDistractorItems = distractorPool;
        roundPayload.raceTargetCount = 50;
    } else if (
      newExerciseType === ExerciseType.CHUNK_SOUND_TO_TEXT ||
      newExerciseType === ExerciseType.CHUNK_TEXT_TO_SOUND
    ) {
        const candidateChunkIds = availableChunks.map(chunk => chunk.id);
        const weightedChunks = calculateItemWeights(
          getSelectionHistory(),
          candidateChunkIds,
          record => record.targetChunk
        );
        const selectedChunkId = getWeightedRandomItem(weightedChunks) ?? getRandomElement(candidateChunkIds);
        const selectedChunk = availableChunks.find(chunk => chunk.id === selectedChunkId);

        if (!selectedChunk) {
            dispatch({ type: 'SET_ERROR', payload: "Failed to select a reading chunk for sound practice." });
            return;
        }

        const chunkOptions = buildChunkOptions(selectedChunk, availableChunks);
        if (chunkOptions.length < CHUNK_OPTION_COUNT) {
            dispatch({ type: 'SET_ERROR', payload: "Need more reading chunks to start sound practice." });
            return;
        }

        roundPayload.currentChunk = selectedChunk;
        roundPayload.chunkOptions = chunkOptions;
    } else {
        let candidateLetters: string[];
        if (newExerciseType === ExerciseType.WORD_SCRAMBLE) {
            candidateLetters = availableLetters.filter(letter =>
                letterGroups[letter]?.some(item => canScrambleWord(item.word))
            );
        } else {
            candidateLetters = availableLetters.filter(letter =>
                letterGroups[letter] && letterGroups[letter].length > 0
            );
        }

        if (candidateLetters.length === 0) {
            console.error(`No candidate letters found for exercise type ${newExerciseType}. Falling back to DRAWING.`);
            newExerciseType = ExerciseType.DRAWING;
            selectedLetter = getRandomElement(availableLetters);
            if (!selectedLetter) {
                dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for fallback drawing round." });
                return;
            }

            roundPayload = { exerciseType: newExerciseType, currentLetter: selectedLetter };
            const potentialImages = letterGroups[selectedLetter];
            if (potentialImages && potentialImages.length > 0) {
                roundPayload.correctImageItem = potentialImages[Math.floor(Math.random() * potentialImages.length)];
            }
        } else {
            if (newExerciseType === ExerciseType.WORD_SCRAMBLE) {
                selectedLetter = getRandomElement(candidateLetters);
            } else {
                const history = getSelectionHistory();
                const weightedLetters = calculateLetterWeights(history, candidateLetters);
                selectedLetter = getWeightedRandomLetter(weightedLetters) ?? getRandomElement(candidateLetters);
            }

            if (!selectedLetter) {
                console.error("Failed to select any letter for the round, even with fallback. Reverting to random DRAWING.");
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

                saveCurrentRound({ questionId: newQuestionTimestamp, payload: roundPayload });
                dispatch({ type: 'START_ROUND', payload: roundPayload });
                return;
            }

            roundPayload.currentLetter = selectedLetter;
            roundPayload.letterDisplayCase = getRandomMatchingLetterCase();
            const possibleImages = letterGroups[selectedLetter].filter(item =>
                newExerciseType === ExerciseType.WORD_SCRAMBLE
                    ? canScrambleWord(item.word)
                    : true
            );

            if (possibleImages.length === 0) {
                dispatch({ type: 'SET_ERROR', payload: `No suitable images/words found for letter ${selectedLetter} and exercise type ${newExerciseType}.` });
                return;
            }

            selectedImage = possibleImages[Math.floor(Math.random() * possibleImages.length)];
            if (!selectedImage) {
                dispatch({ type: 'SET_ERROR', payload: `Internal error selecting image for letter ${selectedLetter}.` });
                return;
            }

            roundPayload.correctImageItem = selectedImage;

            if (newExerciseType === ExerciseType.LETTER_TO_PICTURE) {
                const correctImage = selectedImage;
                const incorrectOptions: GermanLetterItem[] = [];
                const otherLetters = availableLetters.filter(letter => letter !== selectedLetter && letterGroups[letter]?.length > 0);
                const shuffledOtherLetters = shuffleArray(otherLetters);

                for (let i = 0; i < Math.min(2, shuffledOtherLetters.length); i += 1) {
                    const incorrectLetter = shuffledOtherLetters[i];
                    const incorrectImages = letterGroups[incorrectLetter];
                    const incorrectImage = incorrectImages[Math.floor(Math.random() * incorrectImages.length)];
                    incorrectOptions.push(incorrectImage);
                }

                if (incorrectOptions.length < 2) {
                    const otherImagesFromSameLetter = letterGroups[selectedLetter].filter(img => img.imageUrl !== correctImage.imageUrl);
                    const shuffledSameLetterImages = shuffleArray(otherImagesFromSameLetter);
                    for (let i = 0; i < Math.min(2 - incorrectOptions.length, shuffledSameLetterImages.length); i += 1) {
                        incorrectOptions.push(shuffledSameLetterImages[i]);
                    }
                }

                roundPayload.imageOptions = shuffleArray([correctImage, ...incorrectOptions]);
            } else if (newExerciseType === ExerciseType.PICTURE_TO_LETTER) {
                roundPayload.letterDisplayCase = getRandomMatchingLetterCase();
                const forbiddenLetter = getConflictingLetter(selectedLetter);
                const otherLetters = availableLetters.filter(letter =>
                    letter !== selectedLetter &&
                    letter !== forbiddenLetter
                );
                const shuffledOtherLetters = shuffleArray(otherLetters);
                const finalIncorrectLetters = shuffledOtherLetters.slice(0, Math.min(2, shuffledOtherLetters.length));
                roundPayload.letterOptions = shuffleArray([selectedLetter, ...finalIncorrectLetters]);
            } else if (newExerciseType === ExerciseType.WORD_SCRAMBLE) {
                const targetWord = selectedImage.word;
                if (!canScrambleWord(targetWord)) {
                    dispatch({ type: 'SET_ERROR', payload: `Selected image for Word Scramble has invalid word: '${targetWord}' for letter ${selectedLetter}.` });
                    return;
                }

                const targetWordUnits = getWordScrambleUnits(targetWord);
                roundPayload.targetWord = targetWord;
                roundPayload.targetWordUnits = targetWordUnits;
                roundPayload.shuffledLetters = shuffleArray(targetWordUnits);
            } else if (newExerciseType === ExerciseType.WORD_TO_PICTURE) {
                const candidateWordLetters = availableLetters.filter(letter =>
                    letterGroups[letter] && letterGroups[letter].length >= 3
                );
                selectedLetter = getWeightedRandomLetter(calculateLetterWeights(getSelectionHistory(), candidateWordLetters))
                  ?? getRandomElement(candidateWordLetters);

                if (!selectedLetter) {
                    dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for Word to Picture round." });
                    return;
                }

                const allWordsForLetter = letterGroups[selectedLetter];
                selectedImage = getRandomElement(allWordsForLetter);
                if (!selectedImage) {
                    dispatch({ type: 'SET_ERROR', payload: `Failed to select image for letter ${selectedLetter}.` });
                    return;
                }
                const correctImage = selectedImage;

                const incorrectOptions = shuffleArray(
                    allWordsForLetter.filter(img => img.word !== correctImage.word)
                ).slice(0, 2);

                if (incorrectOptions.length < 2) {
                    dispatch({ type: 'SET_ERROR', payload: `Not enough words for letter ${selectedLetter}.` });
                    return;
                }

                roundPayload.currentWord = correctImage.word;
                roundPayload.currentLetter = selectedLetter;
                roundPayload.correctImageItem = correctImage;
                roundPayload.imageOptions = shuffleArray([correctImage, ...incorrectOptions]);
            } else if (newExerciseType === ExerciseType.PICTURE_TO_WORD) {
                const candidateWordLetters = availableLetters.filter(letter =>
                    letterGroups[letter] && letterGroups[letter].length >= 3
                );
                selectedLetter = getWeightedRandomLetter(calculateLetterWeights(getSelectionHistory(), candidateWordLetters))
                  ?? getRandomElement(candidateWordLetters);

                if (!selectedLetter) {
                    dispatch({ type: 'SET_ERROR', payload: "Failed to select any letter for Picture to Word round." });
                    return;
                }

                const allWordsForLetter = letterGroups[selectedLetter];
                selectedImage = getRandomElement(allWordsForLetter);
                if (!selectedImage) {
                    dispatch({ type: 'SET_ERROR', payload: `Failed to select image for letter ${selectedLetter}.` });
                    return;
                }
                const correctImage = selectedImage;

                const incorrectWordOptions = shuffleArray(
                    allWordsForLetter.filter(img => img.word !== correctImage.word)
                ).slice(0, 2).map(img => img.word);

                if (incorrectWordOptions.length < 2) {
                    dispatch({ type: 'SET_ERROR', payload: `Not enough words for letter ${selectedLetter}.` });
                    return;
                }

                roundPayload.currentLetter = selectedLetter;
                roundPayload.correctImageItem = correctImage;
                roundPayload.wordOptions = shuffleArray([correctImage.word, ...incorrectWordOptions]);
            }
        }
    }


    // Dispatch the final payload
    saveCurrentRound({ questionId: newQuestionTimestamp, payload: roundPayload });
    dispatch({
      type: 'START_ROUND',
      payload: roundPayload
    });

  }, [availableLetters, canDoRaceToPicture, letterGroups, raceCandidateLetters, state.score]); // Dependencies: letterGroups added

  // --- Effects ---
  useEffect(() => {
    const storedSessionScore = getSessionScore();
    previousScoreRef.current = storedSessionScore;
    setComboCount(getSessionCombo());
    dispatch({ type: 'SET_SCORE', payload: storedSessionScore });
    hasLoadedStoredScore.current = true;

    if (availableLetters.length > 0) {
      const storedRound = getCurrentRound();
      if (isStoredRoundValid(storedRound, letterGroups, availableLetters)) {
        setCurrentQuestionId(storedRound.questionId);
        dispatch({ type: 'START_ROUND', payload: storedRound.payload });
      } else {
        clearCurrentRound();
        startNewRound();
      }
    } else {
      dispatch({ type: 'SET_ERROR', payload: "No German letter images found in '/public/images/'. Please add images and rebuild." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to run only once on mount

  useEffect(() => {
    if (!state.correctImageItem) {
      return;
    }

    preloadImage(state.correctImageItem.imageUrl);
    preloadWordAudio(state.correctImageItem.word);
  }, [state.correctImageItem]);

  useEffect(() => {
    if (!state.currentChunk) {
      return;
    }

    preloadChunkAudio(state.currentChunk.audioKey);
    state.chunkOptions.forEach(chunk => preloadChunkAudio(chunk.audioKey));
  }, [state.currentChunk, state.chunkOptions]);

  useEffect(() => {
    if (hasQueuedIdlePreload.current) {
      return;
    }

    const allItems = Object.values(letterGroups).flat();
    if (allItems.length === 0) {
      return;
    }

    const idleTasks = allItems.flatMap(item => [
      () => preloadImage(item.imageUrl),
      () => preloadWordAudio(item.word),
    ]);

    enqueueIdleTasks(idleTasks);
    hasQueuedIdlePreload.current = true;
  }, [letterGroups]);

  useEffect(() => {
    if (!hasLoadedStoredScore.current) {
      return;
    }

    const scoreIncreased = state.score > previousScoreRef.current;
    saveSessionScore(state.score, scoreIncreased ? Date.now() : undefined);
    previousScoreRef.current = state.score;
  }, [state.score]);

  useEffect(() => {
    saveSessionCombo(comboCount);
  }, [comboCount]);

  useEffect(() => {
    if (state.isCorrect === null || currentQuestionId <= 0) {
      return;
    }

    if (handledOutcomeQuestionIdRef.current === currentQuestionId) {
      return;
    }

    handledOutcomeQuestionIdRef.current = currentQuestionId;

    setComboCount(previousCombo => (state.isCorrect ? previousCombo + 1 : 0));
  }, [currentQuestionId, state.isCorrect]);

  useEffect(() => {
    let timer: number | undefined;
    const isChunkSoundRound =
      state.exerciseType === ExerciseType.CHUNK_SOUND_TO_TEXT ||
      state.exerciseType === ExerciseType.CHUNK_TEXT_TO_SOUND;
    // --- Condition to advance round ---
    const shouldAdvance =
        // Always advance if correct
        state.isCorrect === true ||
        // Keep retry-based exercises on screen after failure so the child can inspect and correct mistakes.
        (state.isCorrect === false &&
         state.exerciseType !== ExerciseType.WORD_SCRAMBLE &&
         state.exerciseType !== ExerciseType.DRAWING &&
         state.exerciseType !== ExerciseType.RACE_TO_PICTURE);

    if (shouldAdvance) {
      console.log(`Advancing round automatically (Exercise: ${state.exerciseType}, Correct: ${state.isCorrect}). Starting next round soon...`);
      timer = window.setTimeout(() => {
        startNewRound();
      }, state.isCorrect === false && isChunkSoundRound ? 1000 : 2000);
    }
    return () => clearTimeout(timer);
  }, [state.isCorrect, state.exerciseType, startNewRound]);

  // --- Event Handlers ---
  const handleImageSelect = (option: GermanLetterItem) => {
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

  const handleCaseMatchAttempt = (uppercase: string, lowercase: string, isCorrect: boolean) => {
    if (
      isRecordingPaused ||
      state.exerciseType !== ExerciseType.CASE_MATCH ||
      currentQuestionId <= 0
    ) {
      return;
    }

    const questionId = currentQuestionId + caseMatchAttemptCounter.current;
    caseMatchAttemptCounter.current += 1;

    const record: SelectionRecord = {
      timestamp: Date.now(),
      questionId,
      targetLetter: uppercase,
      selectedAnswer: lowercase,
      isCorrect,
      exerciseType: state.exerciseType,
    };

    saveSelection(record);
    onSelectionSave();
  };

  const handleChunkSelect = (selectedChunk: ReadingChunk) => {
    if (
      state.isCorrect !== null ||
      !state.currentChunk ||
      (
        state.exerciseType !== ExerciseType.CHUNK_SOUND_TO_TEXT &&
        state.exerciseType !== ExerciseType.CHUNK_TEXT_TO_SOUND
      )
    ) {
      return;
    }

    const isSelectionCorrect = selectedChunk.id === state.currentChunk.id;

    if (!isRecordingPaused && currentQuestionId > 0) {
        const record: SelectionRecord = {
            timestamp: Date.now(),
            questionId: currentQuestionId,
            targetLetter: state.currentChunk.id,
            targetChunk: state.currentChunk.id,
            selectedAnswer: selectedChunk.id,
            isCorrect: isSelectionCorrect,
            exerciseType: state.exerciseType,
        };

        saveSelection(record);
        onSelectionSave();
    }

    dispatch({
      type: 'SELECT_CHUNK',
      payload: { selectedChunkId: selectedChunk.id, isCorrect: isSelectionCorrect },
    });
  };

  const handleRaceAttempt = (item: GermanLetterItem, isCorrect: boolean) => {
    if (
      isRecordingPaused ||
      state.exerciseType !== ExerciseType.RACE_TO_PICTURE ||
      !state.currentLetter ||
      currentQuestionId <= 0
    ) {
      return;
    }

    const questionId = currentQuestionId + caseMatchAttemptCounter.current;
    caseMatchAttemptCounter.current += 1;

    const record: SelectionRecord = {
      timestamp: Date.now(),
      questionId,
      targetLetter: state.currentLetter,
      targetWord: isCorrect ? item.word : undefined,
      selectedAnswer: item.word,
      isCorrect,
      exerciseType: state.exerciseType,
    };

    saveSelection(record);
    onSelectionSave();
  };

  const handleActivateRace = useCallback(() => {
    if (comboCount < RACE_COMBO_UNLOCK || state.exerciseType === ExerciseType.RACE_TO_PICTURE || !canDoRaceToPicture) {
      return;
    }

    startNewRound(ExerciseType.RACE_TO_PICTURE);
  }, [canDoRaceToPicture, comboCount, startNewRound, state.exerciseType]);

  // --- Rendering ---
  if (state.error) {
    return <div className="letter-match-container error"><p>{state.error}</p></div>;
  }

  if (availableLetters.length === 0 && !state.error) {
    return (
      <div className="letter-match-container error">
        <p>No German letter images available.</p>
        <p>Please add images to the '/public/images/' directory (e.g., Apfel.png).</p>
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
            <div className="game-hud">
              <div className="hud-status-row">
                <ScoreDisplay score={state.score} ref={scoreDisplayRef} />
                <ComboIndicator
                    comboCount={comboCount}
                    unlocked={comboCount >= RACE_COMBO_UNLOCK && state.exerciseType !== ExerciseType.RACE_TO_PICTURE && canDoRaceToPicture}
                    onActivateRace={handleActivateRace}
                />
                <div className="game-menu">
                    <button
                        type="button"
                        className="game-menu-button"
                        aria-label="Game menu"
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen(open => !open)}
                    >
                        <span aria-hidden="true" className="game-menu-icon">⚙️</span>
                    </button>
                    {isMenuOpen && (
                        <div className="game-menu-panel">
                            {showDebugControls && (
                                <NextRoundButton onClick={() => { setIsMenuOpen(false); startNewRound(); }} exerciseType={state.exerciseType} />
                            )}
                            <button
                                onClick={handleStartNewSession}
                                className={`new-letter-button${isConfirmingNewSession ? ' confirm-button' : ''}`}
                            >
                                {isConfirmingNewSession ? 'Click Again to Confirm' : 'New Session'}
                            </button>
                            <button onClick={handleToggleStats} className="new-letter-button">
                                {showStats ? 'Hide Stats' : 'Show Stats'}
                            </button>
                        </div>
                    )}
                </div>
              </div>
              <div className="score-progress-row">
                <ScoreProgressBar score={state.score} />
                <ScoreRewardBurst score={state.score} />
              </div>
            </div>
            <div className="feedback-container">
                {state.exerciseType !== ExerciseType.WORD_SCRAMBLE && state.exerciseType !== ExerciseType.CASE_MATCH && state.exerciseType !== ExerciseType.RACE_TO_PICTURE && (
                    <FeedbackDisplay isCorrect={state.isCorrect} />
                )}
            </div>
            <div className="game-content">
                <div key={currentQuestionId} className="game-round-panel">
                    <GameArea
                        gameState={state}
                        onImageSelect={handleImageSelect}
                        onLetterSelect={handleLetterSelect}
                        onWordSelect={handleWordSelect}
                        onCaseMatchAttempt={handleCaseMatchAttempt}
                        onChunkSelect={handleChunkSelect}
                        onRaceAttempt={handleRaceAttempt}
                        onContinueRace={() => startNewRound()}
                        dispatch={dispatch}
                    />
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
