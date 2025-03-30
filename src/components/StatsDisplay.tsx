import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    getSelectionHistory,
    clearSelectionHistory,
} from '../utils/storageUtils';
import {
    LetterPerformance,
    getLetterPerformance,
    MIN_WEIGHT,
    INCORRECT_PENALTY_MULTIPLIER,
    LOW_CONFIDENCE_BOOST_THRESHOLD,
    LOW_CONFIDENCE_BOOST_MULTIPLIER
} from '../utils/spacedRepetitionUtils';

interface StatsDisplayProps {
    isRecordingPaused: boolean;
    onTogglePause: () => void;
    updateTrigger: number;
    allAvailableLetters: string[];
}

// Helper function to calculate display weight (mirroring logic in calculateLetterWeights)
const calculateDisplayWeight = (perf: LetterPerformance): number => {
    let weight = 1.0; // Base weight
    if (perf.totalAttempts > 0) {
        const successRate = perf.correct / perf.totalAttempts;
        weight *= (1.0 + (1.0 - successRate));
        if (perf.lastAttemptCorrect === false) {
            weight *= INCORRECT_PENALTY_MULTIPLIER;
        }
    } else {
        weight *= LOW_CONFIDENCE_BOOST_MULTIPLIER; // Boost never attempted
    }
    if (perf.totalAttempts < LOW_CONFIDENCE_BOOST_THRESHOLD) {
         weight *= LOW_CONFIDENCE_BOOST_MULTIPLIER; // Boost low confidence
    }
    return Math.max(MIN_WEIGHT, weight);
};

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ isRecordingPaused, onTogglePause, updateTrigger, allAvailableLetters }) => {
    const [performanceData, setPerformanceData] = useState<Record<string, LetterPerformance>>({});

    const updatePerformanceData = useCallback(() => {
        console.log("Updating performance data display...");
        const history = getSelectionHistory();
        const perfData = getLetterPerformance(history, allAvailableLetters);
        setPerformanceData(perfData);
    }, [allAvailableLetters]);

    useEffect(() => {
        updatePerformanceData();
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'hebrewLearningStats') {
                console.log("Storage changed externally, updating performance data...");
                updatePerformanceData();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [updatePerformanceData, updateTrigger]);

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all learning history? This cannot be undone.")) {
            clearSelectionHistory();
            updatePerformanceData();
        }
    };

    const tableData = useMemo(() => {
        const allPerformanceEntries = Object.entries(performanceData);
        const totalWeightSum = allPerformanceEntries.reduce((sum, [, perf]) => sum + calculateDisplayWeight(perf), 0);

        return allPerformanceEntries
            .map(([letter, perf]) => {
                const displayWeight = calculateDisplayWeight(perf);
                const probability = totalWeightSum > 0 ? Math.round((displayWeight / totalWeightSum) * 100) : 0;
                return {
                    letter,
                    ...perf,
                    displayWeight: parseFloat(displayWeight.toFixed(2)),
                    probability: probability,
                };
            })
            .sort((a, b) => b.probability - a.probability);
    }, [performanceData]);

    const totalAttempts = useMemo(() => {
        return Object.values(performanceData).reduce((sum, perf) => sum + perf.totalAttempts, 0);
    }, [performanceData]);

    return (
        <div className="stats-display">
            <h4>Learning Stats & Next Letter Probability</h4>
             <div className="stats-controls">
                <button onClick={onTogglePause}>
                    {isRecordingPaused ? 'Resume Recording' : 'Pause Recording'}
                </button>
                <button onClick={handleReset} disabled={totalAttempts === 0}>
                    Reset History
                </button>
            </div>

            {tableData.length > 0 ? (
                <div className="stats-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Letter</th>
                                <th>Correct</th>
                                <th>Incorrect</th>
                                <th>Total</th>
                                <th>Weight</th>
                                <th>Next Prob %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((item) => (
                                <tr key={item.letter}>
                                    <td>{item.letter}</td>
                                    <td>{item.correct}</td>
                                    <td>{item.incorrect}</td>
                                    <td>{item.totalAttempts}</td>
                                    <td>{item.displayWeight}</td>
                                    <td>{item.probability}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                 <p>No available letters found or history recorded.</p>
            )}
        </div>
    );
}; 