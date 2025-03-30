import { HebrewLetterItem } from "../utils/imageUtils";

// --- Types ---

export enum ExerciseType {
    LETTER_TO_PICTURE = 'letter-to-picture',
    PICTURE_TO_LETTER = 'picture-to-letter'
}

export interface GameState {
    exerciseType: ExerciseType;
    currentLetter: string | null;
    correctImageItem: HebrewLetterItem | null;
    imageOptions: HebrewLetterItem[]; // Options for LETTER_TO_PICTURE
    letterOptions: string[];         // Options for PICTURE_TO_LETTER
    isCorrect: boolean | null;
    score: number;
    selectedOption: HebrewLetterItem | null; // Last selected image item
    selectedLetter: string | null;         // Last selected letter
    gameReady: boolean;
    error: string | null;
}

export type GameAction =
    | { type: 'START_ROUND'; payload: Partial<GameState> }
    | { type: 'SELECT_IMAGE'; payload: { selected: HebrewLetterItem; isCorrect: boolean } }
    | { type: 'SELECT_LETTER'; payload: { selected: string; isCorrect: boolean } }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'RESET_FEEDBACK' };

// --- Initial State ---

export const initialState: GameState = {
    exerciseType: ExerciseType.LETTER_TO_PICTURE,
    currentLetter: null,
    correctImageItem: null,
    imageOptions: [],
    letterOptions: [],
    isCorrect: null,
    score: 0,
    selectedOption: null,
    selectedLetter: null,
    gameReady: false,
    error: null,
};

// --- Reducer Function ---

export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'SET_ERROR':
            return { ...initialState, error: action.payload }; // Reset most state on error
        case 'START_ROUND':
            return {
                ...state,
                exerciseType: action.payload.exerciseType ?? state.exerciseType,
                currentLetter: action.payload.currentLetter ?? null,
                correctImageItem: action.payload.correctImageItem ?? null,
                imageOptions: action.payload.imageOptions ?? [],
                letterOptions: action.payload.letterOptions ?? [],
                isCorrect: null,
                selectedOption: null,
                selectedLetter: null,
                gameReady: true,
                error: null,
            };
        case 'SELECT_IMAGE':
            return {
                ...state,
                selectedOption: action.payload.selected,
                isCorrect: action.payload.isCorrect,
                score: action.payload.isCorrect ? state.score + 1 : state.score,
            };
        case 'SELECT_LETTER':
            return {
                ...state,
                selectedLetter: action.payload.selected,
                isCorrect: action.payload.isCorrect,
                score: action.payload.isCorrect ? state.score + 1 : state.score,
            };
        case 'RESET_FEEDBACK':
            return { ...state, isCorrect: null, selectedLetter: null, selectedOption: null };
        default:
            return state;
    }
} 