// src/utils/arrayUtils.ts

// Get a random element from an array
export const getRandomElement = <T,>(arr: T[]): T | undefined => {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
};

// Shuffle an array in place (Fisher-Yates algorithm) and return it
export const shuffleArray = <T,>(array: T[]): T[] => {
    // Create a copy to avoid modifying the original array directly if it's passed by reference elsewhere
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
    }
    return shuffledArray;
}; 