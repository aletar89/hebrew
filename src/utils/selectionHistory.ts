// Interface for tracking selection history
export interface SelectionRecord {
  letter: string;
  correct: boolean;
  timestamp: number;
  exerciseType: string;
}

const STORAGE_KEY = 'hebrew-selection-history';

// Retrieve the selection history from localStorage
export const getSelectionHistory = (): SelectionRecord[] => {
  try {
    const history = localStorage.getItem(STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error retrieving selection history from localStorage:', error);
    return [];
  }
};

// Add a new selection record to history
export const addSelectionRecord = (record: SelectionRecord): void => {
  try {
    const history = getSelectionHistory();
    history.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving selection history to localStorage:', error);
  }
};

// Clear the entire selection history
export const clearSelectionHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing selection history from localStorage:', error);
  }
};

// Get selection stats for a specific letter
export const getLetterStats = (letter: string): { 
  totalAttempts: number; 
  correctAttempts: number; 
  lastAttempt: number | null;
} => {
  const history = getSelectionHistory();
  const letterRecords = history.filter(record => record.letter === letter);
  
  return {
    totalAttempts: letterRecords.length,
    correctAttempts: letterRecords.filter(record => record.correct).length,
    lastAttempt: letterRecords.length > 0 ? 
      Math.max(...letterRecords.map(record => record.timestamp)) : null
  };
}; 