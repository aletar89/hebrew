// src/utils/storageUtils.ts
// Removed unused import: import { GermanLetterItem } from "./imageUtils";

const STORAGE_KEY = 'germanLearningStats';
const SESSION_SCORE_STORAGE_KEY = 'germanLearningSessionScore';

// Define the structure for each recorded selection
export interface SelectionRecord {
    timestamp: number; // Time the selection was made
    questionId: number; // Timestamp when the question round started
    targetLetter: string; // The correct German letter for this question
    targetWord?: string; // The correct German word for this question (optional)
    selectedAnswer: string; // The letter or image word the user selected
    isCorrect: boolean;
    exerciseType: string; // e.g., 'letter-to-picture'
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
        if (!storedScore) {
            return 0;
        }
        const parsedScore = Number(storedScore);
        return Number.isFinite(parsedScore) && parsedScore >= 0 ? parsedScore : 0;
    } catch (error) {
        console.error("Error reading session score from localStorage:", error);
        return 0;
    }
};

export const saveSessionScore = (score: number): void => {
    try {
        const safeScore = Number.isFinite(score) && score >= 0 ? score : 0;
        localStorage.setItem(SESSION_SCORE_STORAGE_KEY, String(safeScore));
    } catch (error) {
        console.error("Error writing session score to localStorage:", error);
    }
};

export const resetSessionScore = (): void => {
    try {
        localStorage.setItem(SESSION_SCORE_STORAGE_KEY, '0');
    } catch (error) {
        console.error("Error resetting session score in localStorage:", error);
    }
};
