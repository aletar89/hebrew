import { HebrewLetterItem } from "../utils/imageUtils";

// --- Types ---

export enum ExerciseType {
    LETTER_TO_PICTURE = 'letter-to-picture',
    PICTURE_TO_LETTER = 'picture-to-letter',
    PICTURE_TO_WORD = 'picture-to-word',
    DRAWING = 'drawing',
    WORD_SCRAMBLE = 'word-scramble',
    WORD_TO_PICTURE = 'word-to-picture'
}

export interface GameState {
    exerciseType: ExerciseType;
    currentLetter: string | null;
    currentWord: string | null;
    correctImageItem: HebrewLetterItem | null;
    imageOptions: HebrewLetterItem[]; // Options for LETTER_TO_PICTURE and WORD_TO_PICTURE
    letterOptions: string[];         // Options for PICTURE_TO_LETTER
    wordOptions: string[];           // Options for PICTURE_TO_WORD
    targetWord: string | null;
    shuffledLetters: string[];
    currentArrangement: (string | null)[];
    isCorrect: boolean | null;
    score: number;
    selectedOption: HebrewLetterItem | null; // Last selected image item
    selectedLetter: string | null;         // Last selected letter
    selectedWord: string | null;           // Last selected word
    gameReady: boolean;
    error: string | null;
}

export type GameAction =
    | { type: 'START_ROUND'; payload: Partial<GameState> }
    | { type: 'SELECT_IMAGE'; payload: { selected: HebrewLetterItem; isCorrect: boolean } }
    | { type: 'SELECT_LETTER'; payload: { selected: string; isCorrect: boolean } }
    | { type: 'SELECT_WORD'; payload: { selected: string; isCorrect: boolean } }
    | { type: 'SUBMIT_DRAWING'; payload: { isCorrect: boolean } }
    | { type: 'PLACE_LETTER'; payload: { letterIndex: number; slotIndex: number } }
    | { type: 'REMOVE_LETTER'; payload: { slotIndex: number } }
    | { type: 'SUBMIT_WORD'; payload: { isCorrect: boolean } }
    | { type: 'RESET_INCORRECT_WORD_ATTEMPT' }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'RESET_FEEDBACK' };

// --- Initial State ---

export const initialState: GameState = {
    exerciseType: ExerciseType.LETTER_TO_PICTURE,
    currentLetter: null,
    currentWord: null,
    correctImageItem: null,
    imageOptions: [],
    letterOptions: [],
    wordOptions: [],
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
        case 'START_ROUND': {
            const isDrawing = action.payload.exerciseType === ExerciseType.DRAWING;
            const isWordScramble = action.payload.exerciseType === ExerciseType.WORD_SCRAMBLE;
            const isWordToPicture = action.payload.exerciseType === ExerciseType.WORD_TO_PICTURE;
            const isPictureToWord = action.payload.exerciseType === ExerciseType.PICTURE_TO_WORD;

            const baseState = {
                ...state,
                exerciseType: action.payload.exerciseType ?? state.exerciseType,
                currentLetter: isDrawing ? action.payload.currentLetter ?? null : null,
                currentWord: isWordToPicture ? action.payload.currentWord ?? null : null,
                correctImageItem: (isDrawing || isWordScramble || isWordToPicture || isPictureToWord) ? (action.payload.correctImageItem ?? null) : (action.payload.correctImageItem ?? null),
                imageOptions: (isDrawing || isWordScramble) ? [] : (action.payload.imageOptions ?? []),
                letterOptions: (isDrawing || isWordScramble) ? [] : (action.payload.letterOptions ?? []),
                wordOptions: (isDrawing || isWordScramble) ? [] : (action.payload.wordOptions ?? []),
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
            return { ...state, isCorrect: null, selectedLetter: null, selectedOption: null };
        default:
            return state;
    }
} 