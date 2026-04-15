/**
 * Configuration for drawing evaluation
 */
const EVAL_CANVAS_WIDTH = 300; // Should match GameArea CANVAS_WIDTH
const EVAL_CANVAS_HEIGHT = 300; // Updated height to match GameArea
const TARGET_FONT = 'bold 280px Arial'; // Increased font size again
const TARGET_COLOR = 'rgb(0, 0, 0)'; // Use black for target rendering
const FEEDBACK_MISS_COLOR = 'rgba(255, 0, 0, 0.7)'; // Red for missed areas
const FEEDBACK_EXTRA_COLOR = 'rgba(37, 99, 235, 0.65)'; // Blue for extra strokes outside the target
const SIMILARITY_THRESHOLD = 0.6; // 60% overlap required to pass
export const GUIDE_COLOR = '#e0e0e0'; // Export guide color

/**
 * Represents the result of the drawing comparison.
 */
export interface DrawingEvaluationResult {
    isCorrect: boolean;
    similarityScore: number; // Combined score considering coverage and accuracy
    coverageScore: number; // How much of the target was covered
    accuracyScore: number; // How much of the user's drawing was inside the target
    missedPixelCount: number;
    extraneousPixelCount: number;
    feedbackImageData: ImageData | null; // Pixel data to show missing parts
}

function parseRgbaColor(rgba: string) {
    const match = rgba.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/i);
    if (!match) {
        return { r: 255, g: 0, b: 0, a: 180 };
    }

    const [, r, g, b, alpha] = match;
    return {
        r: Number(r),
        g: Number(g),
        b: Number(b),
        a: Math.round(Number(alpha) * 255),
    };
}

/**
 * Renders the target letter onto a hidden canvas.
 * @param letter The German letter character.
 * @param color The color to draw the letter in.
 * @returns A canvas element with the letter drawn, or null if canvas is not supported.
 */
export function renderTargetLetter(letter: string, color: string): HTMLCanvasElement | null {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = EVAL_CANVAS_WIDTH;
        canvas.height = EVAL_CANVAS_HEIGHT;
        // Set willReadFrequently true only if we actually plan to read from this specific canvas instance
        const ctx = canvas.getContext('2d', { willReadFrequently: color === TARGET_COLOR }); 
        if (!ctx) return null;

        // Draw the letter centered using alphabetic baseline + offset
        ctx.fillStyle = color; // Use the provided color
        ctx.font = TARGET_FONT; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        const fontSize = parseInt(TARGET_FONT.match(/(\d+)px/)?.[1] || '280');
        const approxCenterY = EVAL_CANVAS_HEIGHT / 2 + fontSize * 0.325; 
        ctx.fillText(letter, EVAL_CANVAS_WIDTH / 2, approxCenterY);

        return canvas;
    } catch (e) {
        console.error("Canvas creation or rendering failed:", e);
        return null;
    }
}

/**
 * Compares the user's drawing canvas with the target letter shape.
 *
 * @param targetLetter The correct German letter.
 * @param userCanvas The canvas element where the user drew.
 * @returns A DrawingEvaluationResult object.
 */
export function evaluateDrawing(targetLetter: string, userCanvas: HTMLCanvasElement): DrawingEvaluationResult {
    // Generate the target canvas for evaluation using the TARGET_COLOR (black)
    const targetCanvas = renderTargetLetter(targetLetter, TARGET_COLOR); 
    if (!targetCanvas || !userCanvas) {
        console.error("Evaluation failed: Missing target or user canvas.");
        return {
            isCorrect: false,
            similarityScore: 0,
            coverageScore: 0,
            accuracyScore: 0,
            missedPixelCount: 0,
            extraneousPixelCount: 0,
            feedbackImageData: null
        };
    }

    // Get context for the black target canvas
    const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true }); // Ensure reading is allowed
    const userCtx = userCanvas.getContext('2d', { willReadFrequently: true });

    if (!targetCtx || !userCtx) {
        console.error("Evaluation failed: Could not get canvas contexts.");
        return {
            isCorrect: false,
            similarityScore: 0,
            coverageScore: 0,
            accuracyScore: 0,
            missedPixelCount: 0,
            extraneousPixelCount: 0,
            feedbackImageData: null
        };
    }

    // Get pixel data
    const targetData = targetCtx.getImageData(0, 0, EVAL_CANVAS_WIDTH, EVAL_CANVAS_HEIGHT);
    const userData = userCtx.getImageData(0, 0, EVAL_CANVAS_WIDTH, EVAL_CANVAS_HEIGHT);
    const feedbackImageData = targetCtx.createImageData(EVAL_CANVAS_WIDTH, EVAL_CANVAS_HEIGHT); 

    let targetPixelCount = 0;
    let userPixelCount = 0;
    let overlapPixelCount = 0;
    let missedPixelCount = 0;
    let extraneousPixelCount = 0; 
    let maxTargetAlpha = 0; 
    const missColor = parseRgbaColor(FEEDBACK_MISS_COLOR);
    const extraColor = parseRgbaColor(FEEDBACK_EXTRA_COLOR);

    // --- Refactored Pixel Loop --- 
    for (let i = 0; i < targetData.data.length; i += 4) {
        const targetAlpha = targetData.data[i + 3];
        const userAlpha = userData.data[i + 3];

        // Track max target alpha
        if (targetAlpha > maxTargetAlpha) {
            maxTargetAlpha = targetAlpha;
        }

        // Determine if pixels are considered part of the shapes
        const isTargetPixel = targetAlpha > 180; // Using the black target canvas data
        const isUserPixel = userAlpha > 10;     

        // Increment counts based on the combination
        if (isTargetPixel && isUserPixel) {
            // Case 1: Overlap
            targetPixelCount++;
            userPixelCount++;
            overlapPixelCount++;
        } else if (isTargetPixel && !isUserPixel) {
            // Case 2: Missed Target Pixel
            targetPixelCount++;
            missedPixelCount++;
            // Mark missing target pixels in red.
            feedbackImageData.data[i] = missColor.r;
            feedbackImageData.data[i + 1] = missColor.g;
            feedbackImageData.data[i + 2] = missColor.b;
            feedbackImageData.data[i + 3] = missColor.a;
        } else if (!isTargetPixel && isUserPixel) {
            // Case 3: Extraneous User Pixel (outside target)
            userPixelCount++;
            extraneousPixelCount++;
            // Mark extra strokes in blue so the child can see where they overshot.
            feedbackImageData.data[i] = extraColor.r;
            feedbackImageData.data[i + 1] = extraColor.g;
            feedbackImageData.data[i + 2] = extraColor.b;
            feedbackImageData.data[i + 3] = extraColor.a;
        } 
        // Case 4: !isTargetPixel && !isUserPixel (Empty space) - do nothing
    }
    // --- End Refactored Loop ---

    // Log the maximum detected alpha after the loop
    console.log(`Max Target Alpha Detected: ${maxTargetAlpha}`);

    // --- Calculate Scores --- 
    const coverageScore = targetPixelCount > 0 ? overlapPixelCount / targetPixelCount : 0;
    const accuracyScore = userPixelCount > 0 ? overlapPixelCount / userPixelCount : 0; 
    const similarityScore = coverageScore * accuracyScore;

    console.log(`Target Pixels: ${targetPixelCount}, User Pixels: ${userPixelCount}, Overlap: ${overlapPixelCount}, Missed: ${missedPixelCount}, Extraneous: ${extraneousPixelCount}`);
    console.log(`Coverage: ${coverageScore.toFixed(2)}, Accuracy: ${accuracyScore.toFixed(2)}, Combined Score: ${similarityScore.toFixed(2)}`);

    const isCorrect = similarityScore >= SIMILARITY_THRESHOLD;

    return {
        isCorrect,
        similarityScore, 
        coverageScore,
        accuracyScore,
        missedPixelCount,
        extraneousPixelCount,
        feedbackImageData: isCorrect || (missedPixelCount === 0 && extraneousPixelCount === 0) ? null : feedbackImageData, 
    };
} 
