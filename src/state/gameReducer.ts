import { GermanLetterItem } from "../utils/imageUtils";

// --- Types ---

export enum ExerciseType {
    LETTER_TO_PICTURE = 'letter-to-picture',
    RACE_TO_PICTURE = 'race-to-picture',
    PICTURE_TO_LETTER = 'picture-to-letter',
    PICTURE_TO_WORD = 'picture-to-word',
    DRAWING = 'drawing',
    DOT_TRACING = 'dot-tracing',
    WORD_SCRAMBLE = 'word-scramble',
    WORD_TO_PICTURE = 'word-to-picture',
    CASE_MATCH = 'case-match'
}

export type MatchingLetterCase = 'upper' | 'lower';

export interface GameState {
    exerciseType: ExerciseType;
    currentLetter: string | null;
    letterDisplayCase: MatchingLetterCase | null;
    currentWord: string | null;
    correctImageItem: GermanLetterItem | null;
    imageOptions: GermanLetterItem[]; // Options for LETTER_TO_PICTURE and WORD_TO_PICTURE
    raceCorrectItems: GermanLetterItem[];
    raceDistractorItems: GermanLetterItem[];
    raceTargetCount: number;
    letterOptions: string[];         // Options for PICTURE_TO_LETTER
    wordOptions: string[];           // Options for PICTURE_TO_WORD
    uppercaseLetters: string[];
    lowercaseLetters: string[];
    targetWord: string | null;
    shuffledLetters: string[];
    currentArrangement: (string | null)[];
    isCorrect: boolean | null;
    score: number;
    selectedOption: GermanLetterItem | null; // Last selected image item
    selectedLetter: string | null;         // Last selected letter
    selectedWord: string | null;           // Last selected word
    gameReady: boolean;
    error: string | null;
}

export type GameAction =
    | { type: 'START_ROUND'; payload: Partial<GameState> }
    | { type: 'SET_SCORE'; payload: number }
    | { type: 'SELECT_IMAGE'; payload: { selected: GermanLetterItem; isCorrect: boolean } }
    | { type: 'SELECT_LETTER'; payload: { selected: string; isCorrect: boolean } }
    | { type: 'SELECT_WORD'; payload: { selected: string; isCorrect: boolean } }
    | { type: 'SUBMIT_DRAWING'; payload: { isCorrect: boolean } }
    | { type: 'FINISH_RACE'; payload: { isCorrect: boolean } }
    | { type: 'COMPLETE_TRACE' }
    | { type: 'PLACE_LETTER'; payload: { letterIndex: number; slotIndex: number } }
    | { type: 'REMOVE_LETTER'; payload: { slotIndex: number } }
    | { type: 'SUBMIT_WORD'; payload: { isCorrect: boolean } }
    | { type: 'COMPLETE_CASE_MATCH' }
    | { type: 'RESET_INCORRECT_WORD_ATTEMPT' }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'RESET_FEEDBACK' };

// --- Initial State ---

export const initialState: GameState = {
    exerciseType: ExerciseType.LETTER_TO_PICTURE,
    currentLetter: null,
    letterDisplayCase: null,
    currentWord: null,
    correctImageItem: null,
    imageOptions: [],
    raceCorrectItems: [],
    raceDistractorItems: [],
    raceTargetCount: 0,
    letterOptions: [],
    wordOptions: [],
    uppercaseLetters: [],
    lowercaseLetters: [],
    targetWord: null,
    shuffledLetters: [],
    currentArrangement: [],
    isCorrect: null,
    score: 0,
    selectedOption: null,
    selectedLetter: null,
    selectedWord: null,
    gameReady: false,
    error: null,
};

// --- Reducer Function ---

export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'SET_ERROR':
            return { ...initialState, error: action.payload, gameReady: false };
        case 'SET_SCORE':
            return { ...state, score: Math.max(0, action.payload) };
        case 'START_ROUND': {
            const isDrawing = action.payload.exerciseType === ExerciseType.DRAWING;
            const isDotTracing = action.payload.exerciseType === ExerciseType.DOT_TRACING;
            const isWordScramble = action.payload.exerciseType === ExerciseType.WORD_SCRAMBLE;
            const isWordToPicture = action.payload.exerciseType === ExerciseType.WORD_TO_PICTURE;
            const isPictureToWord = action.payload.exerciseType === ExerciseType.PICTURE_TO_WORD;
            const isCaseMatch = action.payload.exerciseType === ExerciseType.CASE_MATCH;
            const isRaceToPicture = action.payload.exerciseType === ExerciseType.RACE_TO_PICTURE;

            const baseState = {
                ...state,
                exerciseType: action.payload.exerciseType ?? state.exerciseType,
                currentLetter: (isDrawing || isDotTracing || isRaceToPicture) ? action.payload.currentLetter ?? null : null,
                letterDisplayCase: (
                    action.payload.exerciseType === ExerciseType.LETTER_TO_PICTURE ||
                    action.payload.exerciseType === ExerciseType.PICTURE_TO_LETTER
                ) ? action.payload.letterDisplayCase ?? 'upper' : null,
                currentWord: isWordToPicture ? action.payload.currentWord ?? null : null,
                correctImageItem: (isDrawing || isWordScramble || isWordToPicture || isPictureToWord) ? (action.payload.correctImageItem ?? null) : (action.payload.correctImageItem ?? null),
                imageOptions: (isDrawing || isDotTracing || isWordScramble || isRaceToPicture) ? [] : (action.payload.imageOptions ?? []),
                raceCorrectItems: isRaceToPicture ? (action.payload.raceCorrectItems ?? []) : [],
                raceDistractorItems: isRaceToPicture ? (action.payload.raceDistractorItems ?? []) : [],
                raceTargetCount: isRaceToPicture ? (action.payload.raceTargetCount ?? 0) : 0,
                letterOptions: (isDrawing || isDotTracing || isWordScramble || isRaceToPicture) ? [] : (action.payload.letterOptions ?? []),
                wordOptions: (isDrawing || isDotTracing || isWordScramble || isRaceToPicture) ? [] : (action.payload.wordOptions ?? []),
                uppercaseLetters: isCaseMatch ? (action.payload.uppercaseLetters ?? []) : [],
                lowercaseLetters: isCaseMatch ? (action.payload.lowercaseLetters ?? []) : [],
                targetWord: isWordScramble ? action.payload.targetWord ?? null : null,
                shuffledLetters: isWordScramble ? action.payload.shuffledLetters ?? [] : [],
                currentArrangement: isWordScramble ? (action.payload.targetWord?.split('').map(() => null) ?? []) : [],
                isCorrect: null,
                selectedOption: null,
                selectedLetter: null,
                selectedWord: null,
                gameReady: true,
                error: null,
            };

            if (action.payload.exerciseType === ExerciseType.LETTER_TO_PICTURE) {
                baseState.currentLetter = action.payload.currentLetter ?? null;
            }
            if (action.payload.exerciseType === ExerciseType.RACE_TO_PICTURE) {
                baseState.currentLetter = action.payload.currentLetter ?? null;
            }
            if (action.payload.exerciseType === ExerciseType.WORD_TO_PICTURE) {
                baseState.currentWord = action.payload.currentWord ?? null;
                baseState.currentLetter = action.payload.currentLetter ?? null;
            }
            if (action.payload.exerciseType === ExerciseType.PICTURE_TO_WORD) {
                baseState.currentLetter = action.payload.currentLetter ?? null;
            }
             if (action.payload.exerciseType === ExerciseType.PICTURE_TO_LETTER) {
                 // CorrectImageItem is already handled above
            }

            return baseState;
        }
        case 'SELECT_IMAGE':
            if (state.exerciseType !== ExerciseType.LETTER_TO_PICTURE && 
                state.exerciseType !== ExerciseType.WORD_TO_PICTURE) return state;
            return {
                ...state,
                selectedOption: action.payload.selected,
                isCorrect: action.payload.isCorrect,
                score: action.payload.isCorrect ? state.score + 1 : state.score,
            };
        case 'SELECT_LETTER':
            if (state.exerciseType !== ExerciseType.PICTURE_TO_LETTER) return state;
            return {
                ...state,
                selectedLetter: action.payload.selected,
                isCorrect: action.payload.isCorrect,
                score: action.payload.isCorrect ? state.score + 1 : state.score,
            };
        case 'SELECT_WORD':
            if (state.exerciseType !== ExerciseType.PICTURE_TO_WORD) return state;
            return {
                ...state,
                selectedWord: action.payload.selected,
                isCorrect: action.payload.isCorrect,
                score: action.payload.isCorrect ? state.score + 1 : state.score,
            };
        case 'SUBMIT_DRAWING':
            if (state.exerciseType !== ExerciseType.DRAWING) return state;
            return {
                ...state,
                isCorrect: action.payload.isCorrect,
                score: action.payload.isCorrect ? state.score + 1 : state.score,
            };
        case 'FINISH_RACE':
            if (state.exerciseType !== ExerciseType.RACE_TO_PICTURE || state.isCorrect !== null) return state;
            return {
                ...state,
                isCorrect: action.payload.isCorrect,
                score: action.payload.isCorrect ? state.score + 1 : state.score,
            };
        case 'COMPLETE_TRACE':
            if (state.exerciseType !== ExerciseType.DOT_TRACING || state.isCorrect === true) return state;
            return {
                ...state,
                isCorrect: true,
                score: state.score + 1,
            };
         case 'PLACE_LETTER': {
            if (state.exerciseType !== ExerciseType.WORD_SCRAMBLE || state.isCorrect === true) return state;

            const { letterIndex, slotIndex } = action.payload;
            const newArrangement = [...state.currentArrangement];
            if (slotIndex >= 0 && slotIndex < newArrangement.length && newArrangement[slotIndex] === null) {
                const letterToPlace = state.shuffledLetters[letterIndex];
                const newShuffledLetters = state.shuffledLetters.filter((_, idx) => idx !== letterIndex);
                newArrangement[slotIndex] = letterToPlace;

                 return {
                     ...state,
                     currentArrangement: newArrangement,
                     shuffledLetters: newShuffledLetters,
                 };
            }
            return state;
        }
         case 'REMOVE_LETTER': {
             if (state.exerciseType !== ExerciseType.WORD_SCRAMBLE || state.isCorrect === true) return state;
             const { slotIndex } = action.payload;
             if (slotIndex >= 0 && slotIndex < state.currentArrangement.length && state.currentArrangement[slotIndex] !== null) {
                 const letterToRemove = state.currentArrangement[slotIndex];
                 const newArrangement = [...state.currentArrangement];
                 newArrangement[slotIndex] = null;
                 const newShuffledLetters = [...state.shuffledLetters, letterToRemove as string];

                 return {
                     ...state,
                     currentArrangement: newArrangement,
                     shuffledLetters: newShuffledLetters,
                 };
             }
             return state;
         }

        case 'SUBMIT_WORD': {
            if (state.exerciseType !== ExerciseType.WORD_SCRAMBLE || state.isCorrect !== null) return state;
            const submittedWord = state.currentArrangement.join('');
            const isWordCorrect = submittedWord === state.targetWord;
             console.log(`Submitting word: ${submittedWord}, Target: ${state.targetWord}, Correct: ${isWordCorrect}`);
            return {
                ...state,
                isCorrect: isWordCorrect,
                score: isWordCorrect ? state.score + 1 : state.score,
            };
         }
        case 'COMPLETE_CASE_MATCH':
            if (state.exerciseType !== ExerciseType.CASE_MATCH || state.isCorrect === true) return state;
            return {
                ...state,
                isCorrect: true,
                score: state.score + 1,
            };
        case 'RESET_INCORRECT_WORD_ATTEMPT': {
            if (
                state.exerciseType !== ExerciseType.WORD_SCRAMBLE ||
                state.isCorrect !== false || // Only run if incorrect
                !state.targetWord
            ) {
                return state;
            }

            const newArrangement = [...state.currentArrangement];
            const lettersToReturnToBank: string[] = [];

            for (let i = 0; i < newArrangement.length; i++) {
                // If the letter in the slot doesn't match the target word at that position
                if (newArrangement[i] !== null && newArrangement[i] !== state.targetWord[i]) {
                    lettersToReturnToBank.push(newArrangement[i] as string);
                    newArrangement[i] = null; // Clear the incorrect letter from the slot
                }
            }

            // Add the incorrect letters back to the shuffled letters bank
            const newShuffledLetters = [...state.shuffledLetters, ...lettersToReturnToBank];

            console.log('Resetting incorrect letters:', lettersToReturnToBank);

            return {
                ...state,
                currentArrangement: newArrangement,
                shuffledLetters: newShuffledLetters, // Consider shuffling these again?
                isCorrect: null,
            };
        }
        case 'RESET_FEEDBACK':
            // Ensure this also resets word scramble state if needed when moving to next round
            return { ...state, isCorrect: null, selectedLetter: null, selectedOption: null, selectedWord: null };
        default:
            return state;
    }
} 
