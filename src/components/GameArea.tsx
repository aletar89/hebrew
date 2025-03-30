// src/components/GameArea.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GameState, ExerciseType, GameAction } from '../state/gameReducer';
import { HebrewLetterItem } from '../utils/imageUtils';
import { evaluateDrawing, DrawingEvaluationResult } from '../utils/drawingUtils';
import { DrawingCanvas } from './DrawingCanvas';
import { GuideCanvasDisplay } from './GuideCanvasDisplay';
import { SubmitDrawingButton } from './SubmitDrawingButton';
import { DrawingFeedbackCanvas } from './DrawingFeedbackCanvas';
import { ClearDrawingButton } from './ClearDrawingButton.tsx';
import './GameArea.css';

// Define canvas dimensions (adjust as needed, consider making responsive)
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 300;

// Props for GameArea component
interface GameAreaProps {
    gameState: GameState;
    onImageSelect: (item: HebrewLetterItem) => void;
    onLetterSelect: (letter: string) => void;
    dispatch: React.Dispatch<GameAction>; // Add dispatch prop
}

// Displays the core interactive area (prompt and options)
export const GameArea: React.FC<GameAreaProps> = ({ gameState, onImageSelect, onLetterSelect, dispatch }) => {
    const {
        exerciseType,
        currentLetter,
        correctImageItem,
        imageOptions,
        letterOptions,
        selectedOption,
        selectedLetter,
        isCorrect: isRoundCorrect
    } = gameState;

    // State for Drawing Exercise
    const [clearCanvasSignal, setClearCanvasSignal] = useState<number>(0);
    const userDrawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [showDrawingFeedback, setShowDrawingFeedback] = useState<boolean>(false);
    const [feedbackImageData, setFeedbackImageData] = useState<ImageData | null>(null);
    const [attemptSubmitted, setAttemptSubmitted] = useState<boolean>(false);

    // Clear canvas, feedback, and attempt state when the round changes
    useEffect(() => {
        if (exerciseType === ExerciseType.DRAWING) {
            setClearCanvasSignal(prev => prev + 1);
            userDrawingCanvasRef.current = null;
            setShowDrawingFeedback(false);
            setFeedbackImageData(null);
            setAttemptSubmitted(false);
        }
    }, [exerciseType, currentLetter]);

    // Fallback image function
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, letter: string) => {
        e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f0f0f0'/%3E%3Ctext x='75' y='75' font-family='Arial' font-size='60' text-anchor='middle' alignment-baseline='middle' fill='%234682b4'%3E${encodeURIComponent(letter)}%3C/text%3E%3C/svg%3E`;
    };

    // Handler for when user finishes drawing a stroke (MouseUp/TouchEnd)
    const handleDrawEnd = useCallback((canvas: HTMLCanvasElement | null) => {
        userDrawingCanvasRef.current = canvas;
    }, []);

    // Handler for the final submission - NOW performs evaluation
    const handleSubmitDrawing = useCallback(() => {
        if (!userDrawingCanvasRef.current || !currentLetter) {
            console.warn("Submit drawing called without canvas or letter.");
            return;
        }
        
        console.log("Evaluating final drawing...");
        const evaluationResult: DrawingEvaluationResult = evaluateDrawing(
           currentLetter,
           userDrawingCanvasRef.current
        );
        console.log("Final Evaluation Result:", evaluationResult);

        setAttemptSubmitted(true);

        // Show persistent feedback if the final result is incorrect
        if (!evaluationResult.isCorrect && evaluationResult.feedbackImageData) {
             setFeedbackImageData(evaluationResult.feedbackImageData);
             setShowDrawingFeedback(true);
        } else {
             // Clear feedback if correct or no feedback data
             setFeedbackImageData(null);
             setShowDrawingFeedback(false);
        }

        // Dispatch the final result to update GLOBAL score etc.
        dispatch({ 
            type: 'SUBMIT_DRAWING', 
            payload: { isCorrect: evaluationResult.isCorrect }
        });

    }, [dispatch, currentLetter]);

    // Handler for clearing the drawing to retry
    const handleClearDrawing = useCallback(() => {
        setClearCanvasSignal(prev => prev + 1); 
        userDrawingCanvasRef.current = null;
        setShowDrawingFeedback(false);       
        setFeedbackImageData(null);         
        setAttemptSubmitted(false);
    }, []);

    if (exerciseType === ExerciseType.DRAWING) {
        return (
            <div className="drawing-exercise-area">
                <div className="canvas-container" style={{ position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
                    <GuideCanvasDisplay 
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        letter={currentLetter} 
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
                        <DrawingCanvas
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            onDrawEnd={handleDrawEnd}
                            clearSignal={clearCanvasSignal}
                        />
                    </div>
                    <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
                        <DrawingFeedbackCanvas
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            isVisible={showDrawingFeedback}
                            feedbackImageData={feedbackImageData}
                        />
                    </div>
                </div>
                <div className="drawing-controls">
                    {!attemptSubmitted ? (
                        <SubmitDrawingButton
                            onClick={handleSubmitDrawing}
                            disabled={false}
                        />
                    ) : ( 
                        isRoundCorrect === false && (
                             <ClearDrawingButton onClick={handleClearDrawing} />
                        )
                    )}
                </div>
            </div>
        );
    }
    else if (exerciseType === ExerciseType.LETTER_TO_PICTURE) {
        return (
            <>
                <div className="current-letter">
                    <h2>{currentLetter}</h2>
                </div>
                <div className="options">
                    {imageOptions.map((option, index) => (
                        <div
                            key={`${option.word}-${index}`} // Use a more stable key if possible
                            className={`option${
                                isRoundCorrect === true && option.letter === correctImageItem?.letter ? ' correct-option' : ''
                                }${
                                isRoundCorrect === false && selectedOption && option.letter === selectedOption.letter ? ' incorrect-option' : ''
                                }`}
                            onClick={() => onImageSelect(option)}
                        >
                            <img
                                src={option.imageUrl}
                                alt={option.word}
                                className="option-image"
                                onError={(e) => handleImageError(e, option.letter)}
                            />
                        </div>
                    ))}
                </div>
            </>
        );
    } else { // PICTURE_TO_LETTER
        if (!correctImageItem) return null; // Should not happen if gameReady is true
        return (
            <>
                <div className="current-image">
                    <img
                        src={correctImageItem.imageUrl}
                        alt={correctImageItem.word}
                        className="target-image"
                        onError={(e) => handleImageError(e, correctImageItem.letter)}
                    />
                </div>
                <div className="letter-options">
                    {letterOptions.map((letter, index) => (
                        <div
                            key={`${letter}-${index}`}
                            className={`letter-option${
                                isRoundCorrect === true && letter === currentLetter ? ' correct-option' : ''
                                }${
                                isRoundCorrect === false && selectedLetter === letter ? ' incorrect-option' : ''
                                }`}
                            onClick={() => onLetterSelect(letter)}
                        >
                            <span className="letter-text">{letter}</span>
                        </div>
                    ))}
                </div>
            </>
        );
    }
}; 