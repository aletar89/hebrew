import { SelectionRecord } from "./storageUtils";

// --- Configuration ---
// Export constants so they can be used in StatsDisplay for calculation mirroring
export const MIN_WEIGHT = 0.1;
export const INCORRECT_PENALTY_MULTIPLIER = 2.5;
export const LOW_CONFIDENCE_BOOST_THRESHOLD = 5;
export const LOW_CONFIDENCE_BOOST_MULTIPLIER = 2.2;
export const LOW_SUCCESS_LINEAR_MULTIPLIER = 4.0;
export const LOW_SUCCESS_CURVE_MULTIPLIER = 8.0;
export const LOW_SUCCESS_FLOOR_MULTIPLIER = 1.4;
export const MASTERED_ITEM_SUPPRESSION = 0.35;
export const SUCCESS_RATE_PRIOR_CORRECT = 1;
export const SUCCESS_RATE_PRIOR_INCORRECT = 1;

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

export interface WeightedItem {
    id: string;
    weight: number;
}

export const calculateLetterWeight = (perf: LetterPerformance): number => {
    if (perf.totalAttempts === 0) {
        return LOW_CONFIDENCE_BOOST_MULTIPLIER * LOW_CONFIDENCE_BOOST_MULTIPLIER;
    }

    // Smooth small samples toward uncertainty so 2/2 or 3/3 does not get treated
    // as confidently mastered after only a handful of attempts.
    const adjustedAttempts =
        perf.totalAttempts + SUCCESS_RATE_PRIOR_CORRECT + SUCCESS_RATE_PRIOR_INCORRECT;
    const successRate =
        (perf.correct + SUCCESS_RATE_PRIOR_CORRECT) / adjustedAttempts;
    const failureRate = 1 - successRate;
    const rawSuccessRate = perf.correct / perf.totalAttempts;

    let weight = 1.0;

    // Push low-success items forward much more aggressively as the pool grows.
    weight *= LOW_SUCCESS_FLOOR_MULTIPLIER;
    weight *= 1 + failureRate * LOW_SUCCESS_LINEAR_MULTIPLIER;
    weight *= 1 + failureRate * failureRate * LOW_SUCCESS_CURVE_MULTIPLIER;

    if (perf.lastAttemptCorrect === false) {
        weight *= INCORRECT_PENALTY_MULTIPLIER;
    }

    if (perf.totalAttempts < LOW_CONFIDENCE_BOOST_THRESHOLD) {
        const confidenceGap = LOW_CONFIDENCE_BOOST_THRESHOLD - perf.totalAttempts;
        weight *= 1 + confidenceGap * 0.25;
    }

    if (rawSuccessRate >= 0.85 && perf.totalAttempts >= LOW_CONFIDENCE_BOOST_THRESHOLD) {
        weight *= MASTERED_ITEM_SUPPRESSION;
    }

    return Math.max(MIN_WEIGHT, weight);
};

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
        weightedLetters.push({
            letter,
            weight: calculateLetterWeight(perf)
        });
    });

    console.log("Calculated Weights:", weightedLetters);
    return weightedLetters;
};

export const getItemPerformance = (
    history: SelectionRecord[],
    candidateIds: string[],
    getTargetId: (record: SelectionRecord) => string | undefined
): Record<string, LetterPerformance> => {
    const performance: Record<string, LetterPerformance> = {};
    const processedAnswers = new Set<string>();
    const latestAttempt: Record<string, SelectionRecord> = {};

    candidateIds.forEach(id => {
        performance[id] = {
            correct: 0,
            incorrect: 0,
            totalAttempts: 0,
            lastAttemptTimestamp: 0,
            lastAttemptCorrect: null
        };
    });

    history.forEach(record => {
        const targetId = getTargetId(record);
        if (!targetId || !performance[targetId]) return;

        if (!latestAttempt[targetId] || record.timestamp > latestAttempt[targetId].timestamp) {
            latestAttempt[targetId] = record;
        }

        const answerKey = `${record.questionId}|${record.selectedAnswer}`;
        if (!processedAnswers.has(answerKey)) {
            if (record.isCorrect) {
                performance[targetId].correct += 1;
            } else {
                performance[targetId].incorrect += 1;
            }
            performance[targetId].totalAttempts += 1;
            processedAnswers.add(answerKey);
        }
    });

    Object.keys(latestAttempt).forEach(id => {
        performance[id].lastAttemptTimestamp = latestAttempt[id].timestamp;
        performance[id].lastAttemptCorrect = latestAttempt[id].isCorrect;
    });

    return performance;
};

export const calculateItemWeights = (
    history: SelectionRecord[],
    candidateIds: string[],
    getTargetId: (record: SelectionRecord) => string | undefined
): WeightedItem[] => {
    const performance = getItemPerformance(history, candidateIds, getTargetId);

    return candidateIds.map(id => ({
        id,
        weight: calculateLetterWeight(performance[id])
    }));
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

export const getWeightedRandomItem = (weightedItems: WeightedItem[]): string | undefined => {
    if (!weightedItems || weightedItems.length === 0) {
        return undefined;
    }

    const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
        console.warn("Total item weight is zero, falling back to uniform random.");
        const randomIndex = Math.floor(Math.random() * weightedItems.length);
        return weightedItems[randomIndex].id;
    }

    let randomNum = Math.random() * totalWeight;

    for (const item of weightedItems) {
        if (randomNum < item.weight) {
            return item.id;
        }
        randomNum -= item.weight;
    }

    console.warn("Weighted random item selection failed to pick an item, falling back to last item.");
    return weightedItems[weightedItems.length - 1].id;
};


// --- (calculateDueItems function can be removed or kept for other purposes) --- 
/*
export const calculateDueItems = (...) => { ... };
*/ 
