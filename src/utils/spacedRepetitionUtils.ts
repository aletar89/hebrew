import { SelectionRecord } from "./storageUtils";

// --- Configuration ---
// Export constants so they can be used in StatsDisplay for calculation mirroring
export const MIN_WEIGHT = 0.1;
export const INCORRECT_PENALTY_MULTIPLIER = 3.0;
export const LOW_CONFIDENCE_BOOST_THRESHOLD = 5;
export const LOW_CONFIDENCE_BOOST_MULTIPLIER = 1.5;

// --- Data Structures ---
// Export LetterPerformance interface
export interface LetterPerformance {
    correct: number;
    incorrect: number;
    totalAttempts: number;
    lastAttemptTimestamp: number;
    lastAttemptCorrect: boolean | null;
}

export interface WeightedLetter {
    letter: string;
    weight: number;
}

// --- Calculation Functions ---

/**
 * Processes history to get performance stats for each letter.
 * Counts unique attempts per question ID.
 * Export this function for use in StatsDisplay.
 */
export const getLetterPerformance = (
    history: SelectionRecord[],
    allAvailableLetters: string[]
): Record<string, LetterPerformance> => {
    const performance: Record<string, LetterPerformance> = {};
    const processedAnswers = new Set<string>(); // "questionId|selectedAnswer"
    const latestAttempt: Record<string, SelectionRecord> = {};

    // Initialize for all *provided* available letters
    allAvailableLetters.forEach(letter => {
        performance[letter] = {
            correct: 0,
            incorrect: 0,
            totalAttempts: 0,
            lastAttemptTimestamp: 0,
            lastAttemptCorrect: null
        };
    });

    // Find latest attempt for recency (only for letters in history)
    history.forEach(record => {
        // Ensure the letter exists in our initialized map before processing
        if (performance[record.targetLetter]) {
            if (!latestAttempt[record.targetLetter] || record.timestamp > latestAttempt[record.targetLetter].timestamp) {
                latestAttempt[record.targetLetter] = record;
            }
        }
    });

    // Calculate correct/incorrect counts based on unique attempts per question
    history.forEach(record => {
        const letterPerf = performance[record.targetLetter];
        // Ensure the letter exists in our initialized map before processing
        if (!letterPerf) return;

        const answerKey = `${record.questionId}|${record.selectedAnswer}`;
        if (!processedAnswers.has(answerKey)) {
            if (record.isCorrect) {
                letterPerf.correct += 1;
            } else {
                letterPerf.incorrect += 1;
            }
            letterPerf.totalAttempts += 1;
            processedAnswers.add(answerKey);
        }
    });

    // Add recency info from latest attempts found in history
    Object.keys(latestAttempt).forEach(letter => {
        if (performance[letter]) {
            performance[letter].lastAttemptTimestamp = latestAttempt[letter].timestamp;
            performance[letter].lastAttemptCorrect = latestAttempt[letter].isCorrect;
        }
    });

    return performance;
};

/**
 * Calculates weights for each letter based on performance.
 * Higher weight means higher priority for selection.
 */
export const calculateLetterWeights = (
    history: SelectionRecord[],
    allAvailableLetters: string[]
): WeightedLetter[] => {

    const performance = getLetterPerformance(history, allAvailableLetters);
    const weightedLetters: WeightedLetter[] = [];

    allAvailableLetters.forEach(letter => {
        const perf = performance[letter];
        let weight = 1.0; // Base weight

        if (perf.totalAttempts > 0) {
            const successRate = perf.correct / perf.totalAttempts;
            // Lower success rate increases weight (max multiplier of 2 for 0% success)
            weight *= (1.0 + (1.0 - successRate));

            // Recent incorrect attempt significantly increases weight
            if (perf.lastAttemptCorrect === false) {
                weight *= INCORRECT_PENALTY_MULTIPLIER;
            }
        } else {
           // Slightly boost items never attempted
            weight *= LOW_CONFIDENCE_BOOST_MULTIPLIER;
        }

        // Boost items with few attempts (low confidence)
        if (perf.totalAttempts < LOW_CONFIDENCE_BOOST_THRESHOLD) {
             weight *= LOW_CONFIDENCE_BOOST_MULTIPLIER;
        }

        weightedLetters.push({
            letter,
            weight: Math.max(MIN_WEIGHT, weight) // Ensure minimum weight
        });
    });

    console.log("Calculated Weights:", weightedLetters);
    return weightedLetters;
};

// --- Selection Function ---

/**
 * Selects a random element based on weights.
 */
export const getWeightedRandomLetter = (weightedItems: WeightedLetter[]): string | undefined => {
    if (!weightedItems || weightedItems.length === 0) {
        return undefined;
    }

    const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
        // Fallback to uniform random if total weight is zero (shouldn't happen with MIN_WEIGHT)
        console.warn("Total weight is zero, falling back to uniform random.");
        const randomIndex = Math.floor(Math.random() * weightedItems.length);
        return weightedItems[randomIndex].letter;
    }

    let randomNum = Math.random() * totalWeight;

    for (const item of weightedItems) {
        if (randomNum < item.weight) {
            return item.letter;
        }
        randomNum -= item.weight;
    }

    // Fallback in case of floating point issues (should be rare)
    console.warn("Weighted random selection failed to pick an item, falling back to last item.");
    return weightedItems[weightedItems.length - 1].letter;
};


// --- (calculateDueItems function can be removed or kept for other purposes) --- 
/*
export const calculateDueItems = (...) => { ... };
*/ 