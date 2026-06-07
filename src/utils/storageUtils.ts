// src/utils/storageUtils.ts
import type { GameState } from "../state/gameReducer";

const STORAGE_KEY = 'germanLearningStats';
const SESSION_SCORE_STORAGE_KEY = 'germanLearningSessionScore';
const SESSION_SCORE_LAST_SUCCESS_STORAGE_KEY = 'germanLearningSessionLastSuccessAt';
const SESSION_SCORE_EXPIRY_MS = 60 * 60 * 1000;
const CURRENT_ROUND_STORAGE_KEY = 'germanLearningCurrentRound';
const SESSION_COMBO_STORAGE_KEY = 'germanLearningSessionCombo';

// Define the structure for each recorded selection
export interface SelectionRecord {
    timestamp: number; // Time the selection was made
    questionId: number; // Timestamp when the question round started
    targetLetter: string; // The correct German letter for this question
    targetWord?: string; // The correct German word for this question (optional)
    targetChunk?: string; // The correct reading chunk for chunk sound games (optional)
    selectedAnswer: string; // The letter or image word the user selected
    isCorrect: boolean;
    exerciseType: string; // e.g., 'letter-to-picture'
}

export interface StoredCurrentRound {
    questionId: number;
    payload: Partial<GameState>;
}

// Retrieve the full history from localStorage
export const getSelectionHistory = (): SelectionRecord[] => {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            // Add validation to ensure elements have expected number type for questionId
            if (Array.isArray(parsedData) && parsedData.every(item => typeof item.questionId === 'number')) {
                return parsedData;
            }
        }
    } catch (error) {
        console.error("Error reading or validating selection history from localStorage:", error);
    }
    return [];
};

// Add a new selection record to localStorage
export const saveSelection = (record: SelectionRecord): void => {
    // Updated validation for numeric questionId
    if (!record || typeof record.questionId !== 'number' || record.questionId <= 0 || !record.targetLetter || !record.selectedAnswer || typeof record.isCorrect !== 'boolean') {
        console.warn("Attempted to save invalid record:", record);
        return;
    }
    try {
        const history = getSelectionHistory();
        history.push(record);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
        console.error("Error writing to localStorage:", error);
    }
};

// Clear all history from localStorage
export const clearSelectionHistory = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log("Selection history cleared from localStorage.");
    } catch (error) {
        console.error("Error clearing localStorage:", error);
    }
};

export const getSessionScore = (): number => {
    try {
        const storedScore = localStorage.getItem(SESSION_SCORE_STORAGE_KEY);
        const storedLastSuccessAt = localStorage.getItem(SESSION_SCORE_LAST_SUCCESS_STORAGE_KEY);
        if (!storedScore) {
            return 0;
        }

        const parsedScore = Number(storedScore);
        if (!Number.isFinite(parsedScore) || parsedScore < 0) {
            return 0;
        }

        if (parsedScore === 0) {
            return 0;
        }

        const parsedLastSuccessAt = Number(storedLastSuccessAt);
        const hasValidLastSuccessAt = Number.isFinite(parsedLastSuccessAt) && parsedLastSuccessAt > 0;
        const isExpired =
            !hasValidLastSuccessAt || Date.now() - parsedLastSuccessAt > SESSION_SCORE_EXPIRY_MS;

        if (isExpired) {
            resetSessionScore();
            return 0;
        }

        return parsedScore;
    } catch (error) {
        console.error("Error reading session score from localStorage:", error);
        return 0;
    }
};

export const saveSessionScore = (score: number, lastSuccessAt?: number): void => {
    try {
        const safeScore = Number.isFinite(score) && score >= 0 ? score : 0;
        localStorage.setItem(SESSION_SCORE_STORAGE_KEY, String(safeScore));

        if (safeScore === 0) {
            localStorage.removeItem(SESSION_SCORE_LAST_SUCCESS_STORAGE_KEY);
            return;
        }

        if (typeof lastSuccessAt === 'number' && Number.isFinite(lastSuccessAt) && lastSuccessAt > 0) {
            localStorage.setItem(SESSION_SCORE_LAST_SUCCESS_STORAGE_KEY, String(lastSuccessAt));
        }
    } catch (error) {
        console.error("Error writing session score to localStorage:", error);
    }
};

export const resetSessionScore = (): void => {
    try {
        localStorage.setItem(SESSION_SCORE_STORAGE_KEY, '0');
        localStorage.removeItem(SESSION_SCORE_LAST_SUCCESS_STORAGE_KEY);
    } catch (error) {
        console.error("Error resetting session score in localStorage:", error);
    }
};

export const getSessionCombo = (): number => {
    try {
        const storedCombo = localStorage.getItem(SESSION_COMBO_STORAGE_KEY);
        if (!storedCombo) {
            return 0;
        }

        const parsedCombo = Number(storedCombo);
        if (!Number.isFinite(parsedCombo) || parsedCombo < 0) {
            return 0;
        }

        return parsedCombo;
    } catch (error) {
        console.error("Error reading session combo from localStorage:", error);
        return 0;
    }
};

export const saveSessionCombo = (combo: number): void => {
    try {
        const safeCombo = Number.isFinite(combo) && combo >= 0 ? combo : 0;
        localStorage.setItem(SESSION_COMBO_STORAGE_KEY, String(safeCombo));
    } catch (error) {
        console.error("Error writing session combo to localStorage:", error);
    }
};

export const resetSessionCombo = (): void => {
    try {
        localStorage.setItem(SESSION_COMBO_STORAGE_KEY, '0');
    } catch (error) {
        console.error("Error resetting session combo in localStorage:", error);
    }
};

export const getCurrentRound = (): StoredCurrentRound | null => {
    try {
        const storedRound = localStorage.getItem(CURRENT_ROUND_STORAGE_KEY);
        if (!storedRound) {
            return null;
        }

        const parsedRound = JSON.parse(storedRound);
        if (
            parsedRound &&
            typeof parsedRound.questionId === 'number' &&
            parsedRound.questionId > 0 &&
            parsedRound.payload &&
            typeof parsedRound.payload === 'object'
        ) {
            return parsedRound;
        }
    } catch (error) {
        console.error("Error reading current round from localStorage:", error);
    }

    return null;
};

export const saveCurrentRound = (round: StoredCurrentRound): void => {
    if (!round || typeof round.questionId !== 'number' || round.questionId <= 0 || !round.payload.exerciseType) {
        console.warn("Attempted to save invalid current round:", round);
        return;
    }

    try {
        localStorage.setItem(CURRENT_ROUND_STORAGE_KEY, JSON.stringify(round));
    } catch (error) {
        console.error("Error writing current round to localStorage:", error);
    }
};

export const clearCurrentRound = (): void => {
    try {
        localStorage.removeItem(CURRENT_ROUND_STORAGE_KEY);
    } catch (error) {
        console.error("Error clearing current round from localStorage:", error);
    }
};
