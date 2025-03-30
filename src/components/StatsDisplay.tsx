import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    getSelectionHistory,
    clearSelectionHistory,
    SelectionRecord
} from '../utils/storageUtils';
import { hebrewLetterMap } from '../utils/imageUtils';

interface StatsDisplayProps {
    isRecordingPaused: boolean;
    onTogglePause: () => void;
}

interface LetterStat {
    correct: number;
    incorrect: number;
}

type LetterStats = Record<string, LetterStat>;

// Function to calculate stats from history
// Excludes multiple identical wrong answers for the same question round
const calculateLetterStats = (history: SelectionRecord[]): LetterStats => {
    const stats: LetterStats = {};
    const processedAnswers = new Set<string>(); // Store "questionId|selectedAnswer"

    // Initialize stats for all known letters
    Object.values(hebrewLetterMap).forEach(letter => {
        stats[letter] = { correct: 0, incorrect: 0 };
    });

    history.forEach(record => {
        const answerKey = `${record.questionId}|${record.selectedAnswer}`;

        // Only process if this specific answer hasn't been processed for this question
        if (!processedAnswers.has(answerKey)) {
            if (stats[record.targetLetter]) { // Ensure the target letter exists in our map
                if (record.isCorrect) {
                    stats[record.targetLetter].correct += 1;
                } else {
                    stats[record.targetLetter].incorrect += 1;
                }
            }
            // Mark this specific answer for this question as processed
            processedAnswers.add(answerKey);
        }
    });
    console.log("Calculated Stats:", stats);
    return stats;
};

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ isRecordingPaused, onTogglePause }) => {
    const [letterStats, setLetterStats] = useState<LetterStats>({});

    // Function to update stats from storage
    const updateStats = useCallback(() => {
        console.log("Updating stats display...");
        const history = getSelectionHistory();
        const newStats = calculateLetterStats(history);
        setLetterStats(newStats);
    }, []);

    // Load initial stats and listen for storage changes
    useEffect(() => {
        updateStats();

        const handleStorageChange = (event: StorageEvent) => {
            // Check if the relevant storage key changed
            if (event.key === 'hebrewLearningStats') {
                console.log("Storage changed, updating stats...");
                updateStats();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [updateStats]);

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all learning history? This cannot be undone.")) {
            clearSelectionHistory();
            updateStats(); // Recalculate stats (will be empty)
        }
    };

    // Use useMemo to create the sorted list of letters only when stats change
    const sortedLetters = useMemo(() => {
        return Object.entries(letterStats)
                     .filter(([, stat]) => stat.correct > 0 || stat.incorrect > 0) // Only show letters with attempts
                     .sort(([letterA], [letterB]) => letterA.localeCompare(letterB)); // Sort alphabetically
    }, [letterStats]);

    const totalAttempts = useMemo(() => {
        return sortedLetters.reduce((sum, [, stat]) => sum + stat.correct + stat.incorrect, 0);
    }, [sortedLetters]);


    return (
        <div className="stats-display">
            <h4>Learning Stats</h4>
             <div className="stats-summary">
                <p>Total Unique Attempts Recorded: {totalAttempts}</p>
                {/* Optionally show overall success rate */} 
            </div>
            <div className="stats-controls">
                <button onClick={onTogglePause}>
                    {isRecordingPaused ? 'Resume Recording' : 'Pause Recording'}
                </button>
                <button onClick={handleReset} disabled={totalAttempts === 0}>
                    Reset History
                </button>
            </div>
            {sortedLetters.length > 0 && (
                <div className="letter-stats-details">
                    <h5>Success Rate per Letter:</h5>
                    <ul>
                        {sortedLetters.map(([letter, stat]) => {
                            const attempts = stat.correct + stat.incorrect;
                            const successRate = attempts === 0 ? 0 : Math.round((stat.correct / attempts) * 100);
                            return (
                                <li key={letter}>
                                    <span className="stat-letter">{letter}:</span>
                                    <span className="stat-rate"> {successRate}%</span>
                                    <span className="stat-counts"> ({stat.correct}/{attempts})</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}; 