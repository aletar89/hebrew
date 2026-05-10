// src/components/GameArea.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
// --- dnd-kit imports ---
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    TouchSensor, // Important for mobile
    UniqueIdentifier,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
// Remove unused sortable imports for now
// import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'; // Keep coordinate getter if keyboard sensor used
// --- End dnd-kit imports ---

import { GameState, ExerciseType, GameAction } from '../state/gameReducer';
import { GermanLetterItem } from '../utils/imageUtils';
import { evaluateDrawing, DrawingEvaluationResult } from '../utils/drawingUtils';
import { DrawingCanvas } from './DrawingCanvas';
import { GuideCanvasDisplay } from './GuideCanvasDisplay';
import { DotTraceCanvas } from './DotTraceCanvas';
import { playWordAudio } from '../utils/audioUtils';
import { SubmitDrawingButton } from './SubmitDrawingButton';
import { DrawingFeedbackCanvas } from './DrawingFeedbackCanvas';
import { ClearDrawingButton } from './ClearDrawingButton.tsx';
import { LetterCaseMatch } from './LetterCaseMatch';
import { RaceToPictureGame } from './RaceToPictureGame';
import { letterDotPatterns } from '../utils/letterDotPatterns';

// --- Word Scramble specific components (simplified examples) ---
import { DraggableLetter } from './DraggableLetter'; // Assume we create this
import { DroppableSlot } from './DroppableSlot';   // Assume we create this
// --- End Word Scramble components ---

import './GameArea.css'; // Ensure styles for new elements are added here
import './WordScramble.css'; // Create this file for word scramble specific styles

// Define canvas dimensions (adjust as needed, consider making responsive)
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 300;
const WORD_LOCALE = 'de-DE';

// Props for GameArea component
interface GameAreaProps {
    gameState: GameState;
    onImageSelect: (item: GermanLetterItem) => void;
    onLetterSelect: (letter: string) => void;
    onWordSelect: (word: string) => void;
    onCaseMatchAttempt: (uppercase: string, lowercase: string, isCorrect: boolean) => void;
    onRaceAttempt: (item: GermanLetterItem, isCorrect: boolean) => void;
    onContinueRace: () => void;
    dispatch: React.Dispatch<GameAction>;
}

// Displays the core interactive area (prompt and options)
export const GameArea: React.FC<GameAreaProps> = ({ gameState, onImageSelect, onLetterSelect, onWordSelect, onCaseMatchAttempt, onRaceAttempt, onContinueRace, dispatch }) => {
    const {
        exerciseType,
        currentLetter,
        letterDisplayCase,
        currentWord,
        correctImageItem,
        imageOptions,
        raceCorrectItems,
        raceDistractorItems,
        raceTargetCount,
        letterOptions,
        wordOptions,
        uppercaseLetters,
        lowercaseLetters,
        targetWord,          // <- New state
        shuffledLetters,     // <- New state
        currentArrangement,  // <- New state
        selectedOption,
        selectedLetter,
        selectedWord,
        isCorrect: isRoundCorrect
    } = gameState;

    // State for Drawing Exercise
    const [clearCanvasSignal, setClearCanvasSignal] = useState<number>(0);
    const userDrawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [showDrawingFeedback, setShowDrawingFeedback] = useState<boolean>(false);
    const [feedbackImageData, setFeedbackImageData] = useState<ImageData | null>(null);
    const [drawingEvaluation, setDrawingEvaluation] = useState<DrawingEvaluationResult | null>(null);
    const [attemptSubmitted, setAttemptSubmitted] = useState<boolean>(false);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    const toDisplayWord = useCallback((word: string) => word.toLocaleUpperCase(WORD_LOCALE), []);
    const toDisplayLetter = useCallback((letter: string) => (
        letterDisplayCase === 'lower'
            ? letter.toLocaleLowerCase(WORD_LOCALE)
            : letter.toLocaleUpperCase(WORD_LOCALE)
    ), [letterDisplayCase]);

    // Setup sensors for dnd-kit (important for touch)
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor), // Enable touch sensor
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Clear canvas, feedback, and attempt state only when the drawing prompt changes.
    useEffect(() => {
        if (exerciseType === ExerciseType.DRAWING) {
            setClearCanvasSignal(prev => prev + 1);
            userDrawingCanvasRef.current = null;
            setShowDrawingFeedback(false);
            setFeedbackImageData(null);
            setDrawingEvaluation(null);
            setAttemptSubmitted(false);
        }
    }, [exerciseType, currentLetter, targetWord]);

    useEffect(() => {
        if (isRoundCorrect !== null || exerciseType !== ExerciseType.WORD_SCRAMBLE) {
            setActiveId(null);
        }
    }, [exerciseType, isRoundCorrect]);

    // --- Effect for Auto-Submitting Word Scramble ---
    useEffect(() => {
        if (
            exerciseType === ExerciseType.WORD_SCRAMBLE &&
            isRoundCorrect === null &&
            currentArrangement &&
            currentArrangement.length > 0 &&
            !currentArrangement.some(slot => slot === null)
        ) {
            console.log("All slots filled, dispatching SUBMIT_WORD...");
            // Dispatch SUBMIT_WORD directly, reducer determines correctness
            dispatch({ type: 'SUBMIT_WORD', payload: { isCorrect: false } }); // Payload ignored by reducer now
        }
    }, [currentArrangement, exerciseType, isRoundCorrect, dispatch]);

    // --- Effect to Handle Incorrect Word Attempt ---
    useEffect(() => {
        if (isRoundCorrect === false && exerciseType === ExerciseType.WORD_SCRAMBLE) {
            console.log("Word incorrect, dispatching reset...");
            // Just dispatch the reset action. Reducer sets isCorrect back to null.
            dispatch({ type: 'RESET_INCORRECT_WORD_ATTEMPT' });
        }
        // Removed flash state management
    }, [isRoundCorrect, exerciseType, dispatch]);

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
        setDrawingEvaluation(evaluationResult);

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
        setDrawingEvaluation(null);
        setAttemptSubmitted(false);
    }, []);

    // --- Handlers for Drag and Drop (Word Scramble) ---
    const handleDragStart = (event: DragStartEvent) => {
        // Allow starting drag even if incorrect, to allow correction
        if (isRoundCorrect === true) return; // Don't allow drag start if already correct
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (isRoundCorrect === true) return; // Prevent updates if already correct

        if (!over) return;
        if (active.id === over.id) return;

        const activeIdStr = active.id.toString();
        const overIdStr = over.id.toString();
        const isActiveFromBank = activeIdStr.startsWith('bank-');
        const isActiveFromSlot = activeIdStr.startsWith('slot-');
        const isOverBank = overIdStr === 'bank';
        const isOverSlot = overIdStr.startsWith('slot-');
        const activeLetter = active.data.current?.letter as string;

        if (!activeLetter) {
             console.error("Dragged item missing letter data:", active.data.current);
             return;
        }

        // Scenario 1: Bank to Slot
        if (isActiveFromBank && isOverSlot) {
            const slotIndex = parseInt(overIdStr.replace('slot-', ''), 10);
            const originalBankIndex = active.data.current?.originalIndex as number;
            if (currentArrangement[slotIndex] === null) {
                dispatch({ type: 'PLACE_LETTER', payload: { letterIndex: originalBankIndex, slotIndex: slotIndex } });
            } else { /* Slot filled */ }
        }
        // Scenario 2: Slot to Bank
        else if (isActiveFromSlot && isOverBank) {
            const slotIndex = parseInt(activeIdStr.replace('slot-', ''), 10);
            dispatch({ type: 'REMOVE_LETTER', payload: { slotIndex: slotIndex } });
        }
        // Scenario 3: Slot to Slot
        else if (isActiveFromSlot && isOverSlot) {
            const originSlotIndex = parseInt(activeIdStr.replace('slot-', ''), 10);
            const destinationSlotIndex = parseInt(overIdStr.replace('slot-', ''), 10);
             if (currentArrangement[destinationSlotIndex] === null) {
                 // Moving to an empty slot
                 console.log("Moving between slots (basic remove/place)");
                 // Dispatch remove first, then place (using placeholder index - IMPROVE LATER)
                 dispatch({ type: 'REMOVE_LETTER', payload: { slotIndex: originSlotIndex } });
                 // Hacky index assumption - needs a better solution (MOVE action)
                 const tempBankIndex = gameState.shuffledLetters.length;
                 dispatch({ type: 'PLACE_LETTER', payload: { letterIndex: tempBankIndex, slotIndex: destinationSlotIndex } });
             } else {
                 // Moving to an occupied slot - SWAP?
                 console.log("Swap attempt - not fully implemented");
                 // Basic swap: dispatch REMOVE for both, then PLACE for both (complex index tracking)
                 // Example (needs careful index handling!):
                 // const destLetterData = { ... }; // Find data for destination letter
                 // dispatch({ type: 'REMOVE_LETTER', payload: { slotIndex: originSlotIndex } });
                 // dispatch({ type: 'REMOVE_LETTER', payload: { slotIndex: destinationSlotIndex } });
                 // dispatch({ type: 'PLACE_LETTER', payload: { letterIndex: /* find original dest letter index in bank */, slotIndex: originSlotIndex } });
                 // dispatch({ type: 'PLACE_LETTER', payload: { letterIndex: /* find original origin letter index in bank */, slotIndex: destinationSlotIndex } });
             }
        }
        // Scenario 4: Bank to Bank (No-op)
        else if (isActiveFromBank && isOverBank) { /* No action needed */ }
        else { /* Unhandled */ }
    };

    if (exerciseType === ExerciseType.DOT_TRACING) {
        const pattern = currentLetter ? letterDotPatterns[currentLetter] : null;
        if (!pattern || pattern.length === 0) {
            return <div className="loading">Keine Punkt-Vorlage fuer {currentLetter ?? 'diesen Buchstaben'}.</div>;
        }

        return (
            <div className="dot-tracing-area">
                <DotTraceCanvas
                    letter={currentLetter ?? '?'}
                    points={pattern}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onComplete={() => dispatch({ type: 'COMPLETE_TRACE' })}
                />
                {isRoundCorrect && (
                    <div className="dot-tracing-success">
                        Super gemacht! Du hast den Buchstaben in der richtigen Reihenfolge verbunden.
                    </div>
                )}
            </div>
        );
    }

    if (exerciseType === ExerciseType.RACE_TO_PICTURE) {
        if (!currentLetter) {
            return <div className="loading">Loading race challenge...</div>;
        }

        return (
            <RaceToPictureGame
                targetLetter={currentLetter}
                correctItems={raceCorrectItems}
                distractorItems={raceDistractorItems}
                targetCount={raceTargetCount}
                disabled={isRoundCorrect !== null}
                onAttempt={onRaceAttempt}
                onFinish={(isCorrect) => dispatch({ type: 'FINISH_RACE', payload: { isCorrect } })}
                onContinue={onContinueRace}
            />
        );
    }

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
                    {attemptSubmitted && drawingEvaluation && !drawingEvaluation.isCorrect && (
                        <div className="score-details drawing-feedback-summary">
                            <p>Rot zeigt fehlende Teile des Buchstabens. Blau zeigt Striche ausserhalb der Form.</p>
                            <p>
                                Abdeckung: {Math.round(drawingEvaluation.coverageScore * 100)}%,
                                Praezision: {Math.round(drawingEvaluation.accuracyScore * 100)}%
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    else if (exerciseType === ExerciseType.CASE_MATCH) {
        return (
            <LetterCaseMatch
                uppercaseLetters={uppercaseLetters}
                lowercaseLetters={lowercaseLetters}
                disabled={isRoundCorrect === true}
                onAttempt={onCaseMatchAttempt}
                onComplete={() => dispatch({ type: 'COMPLETE_CASE_MATCH' })}
            />
        );
    }
    else if (exerciseType === ExerciseType.WORD_SCRAMBLE) {
        if (!correctImageItem || !targetWord) {
            return <div className="loading">Loading Word Scramble...</div>; // Or an error state
        }

        // Prepare unique IDs for draggable/droppable items
        // Bank letters need stable IDs even when letters are removed/added
        const bankLetterItems = shuffledLetters.map((letter, index) => ({
            id: `bank-${letter}-${index}`, // More robust ID needed if letters repeat
            letter: letter,
            originalIndex: index // Store original index before filtering/moving
        }));
        const slotItems = currentArrangement.map((letter, index) => ({
            id: `slot-${index}`,
            letter: letter, // null if empty
            index: index
        }));

        // Get the letter corresponding to the active dragged ID
        const activeLetterData = activeId ? (
            bankLetterItems.find(item => item.id === activeId)?.letter ||
            slotItems.find(item => item.id === activeId)?.letter
         ) : null;

        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="word-scramble-area">
                    {/* Image Prompt */}
                    <div className="word-scramble-image-prompt">
                        <div className="current-image">
                            <img
                                src={correctImageItem.imageUrl}
                                alt={correctImageItem.word} // Or provide better alt text
                                className="target-image" // Reuse existing style or create new
                                onError={(e) => handleImageError(e, correctImageItem.letter)}
                            />
                            <button
                                type="button"
                                className="audio-button"
                                aria-label={`Wort anhören: ${correctImageItem.word}`}
                                onClick={() => playWordAudio(correctImageItem.word)}
                            >
                                <svg
                                    aria-hidden="true"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M4 9v6h4l5 4V5L8 9H4Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M15 9.5c1 .75 1.5 1.75 1.5 2.5s-.5 1.75-1.5 2.5"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M17.5 7.5c1.5 1.25 2.25 2.75 2.25 4.5s-.75 3.25-2.25 4.5"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        </div>
                        <p>Welches Wort passt zum Bild?</p>
                         {/* <p>Drag the letters to form the word for the picture.</p> */}
                    </div>

                    {/* Letter Slots (Droppable Area) */}
                    <div className="word-scramble-slots">
                        {slotItems.map(item => (
                            <DroppableSlot
                                key={item.id}
                                id={item.id}
                                disabled={isRoundCorrect === true}
                            >
                                {item.letter ? (
                                     <DraggableLetter
                                        key={item.id}
                                        id={item.id}
                                        letter={item.letter}
                                        data={{ letter: item.letter, originalIndex: item.index, type: 'slot' }}
                                        // Only pass true for correct, otherwise null (no incorrect styling)
                                        isCorrect={isRoundCorrect === true ? true : null}
                                     />
                                ) : (
                                    <div className="empty-slot-placeholder"></div>
                                )}
                            </DroppableSlot>
                        ))}
                    </div>

                     {/* Letter Bank - Show unless round is correctly finished */}
                     {isRoundCorrect !== true && (
                         <DroppableSlot id="bank">
                            <div className="word-scramble-bank">
                                <div className="letter-bank-items">
                                    {bankLetterItems.map(item => (
                                        <DraggableLetter
                                            key={item.id}
                                            id={item.id}
                                            letter={item.letter}
                                            data={{ letter: item.letter, originalIndex: item.originalIndex, type: 'bank' }}
                                            isCorrect={null}
                                        />
                                    ))}
                                    {bankLetterItems.length === 0 && isRoundCorrect === null && <p>(Alle Buchstaben platziert)</p>}
                                </div>
                            </div>
                         </DroppableSlot>
                     )}

                </div>

                 {/* Drag Overlay: Renders the item being dragged */}
                <DragOverlay>
                    {activeId ? (
                        <DraggableLetter
                            id={activeId} // Needs ID
                            letter={activeLetterData || '?'} // Show letter being dragged
                             isCorrect={null}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        );
    }
    else if (exerciseType === ExerciseType.LETTER_TO_PICTURE) {
        return (
            <>
                <div className="current-letter">
                    <h2>{currentLetter ? toDisplayLetter(currentLetter) : currentLetter}</h2>
                </div>
                <div className="options">
                    {imageOptions.map((option, index) => (
                        <div
                            key={`${option.word}-${index}`} // Use a more stable key if possible
                            className={`option${
                                isRoundCorrect === true && option.letter === selectedOption?.letter ? ' correct-option' : ''
                                }${
                                isRoundCorrect === false && option.letter === selectedOption?.letter ? ' incorrect-option' : ''
                                }${
                                isRoundCorrect === false && option.letter === correctImageItem?.letter ? ' highlight-correct' : ''
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
    } else if (exerciseType === ExerciseType.WORD_TO_PICTURE) {
        return (
            <>
                <div className="current-word current-word--responsive">
                    <h2>{currentWord ? toDisplayWord(currentWord) : currentWord}</h2>
                </div>
                <div className="options">
                    {imageOptions.map((option, index) => (
                        <div
                            key={`${option.word}-${index}`}
                            className={`option${
                                isRoundCorrect === true && option.word === selectedOption?.word ? ' correct-option' : ''
                                }${
                                isRoundCorrect === false && option.word === selectedOption?.word ? ' incorrect-option' : ''
                                }${
                                isRoundCorrect === false && option.word === correctImageItem?.word ? ' highlight-correct' : ''
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
    } else if (exerciseType === ExerciseType.PICTURE_TO_LETTER) {
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
                    <button
                        type="button"
                        className="audio-button"
                        aria-label={`Wort anhören: ${correctImageItem.word}`}
                        onClick={() => playWordAudio(correctImageItem.word)}
                    >
                        <svg
                            aria-hidden="true"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M4 9v6h4l5 4V5L8 9H4Z"
                                fill="currentColor"
                            />
                            <path
                                d="M15 9.5c1 .75 1.5 1.75 1.5 2.5s-.5 1.75-1.5 2.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M17.5 7.5c1.5 1.25 2.25 2.75 2.25 4.5s-.75 3.25-2.25 4.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>
                <div className="letter-options">
                    {letterOptions.map((letter, index) => (
                        <div
                            key={`${letter}-${index}`}
                            className={`letter-option${
                                isRoundCorrect === true && letter === selectedLetter ? ' correct-option' : ''
                                }${
                                isRoundCorrect === false && letter === selectedLetter ? ' incorrect-option' : ''
                                }${
                                isRoundCorrect === false && letter === currentLetter ? ' highlight-correct' : ''
                                }`}
                            onClick={() => onLetterSelect(letter)}
                        >
                            <span className="letter-text">{toDisplayLetter(letter)}</span>
                        </div>
                    ))}
                </div>
            </>
        );
    } else if (exerciseType === ExerciseType.PICTURE_TO_WORD) {
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
                    <button
                        type="button"
                        className="audio-button"
                        aria-label={`Wort anhören: ${correctImageItem.word}`}
                        onClick={() => playWordAudio(correctImageItem.word)}
                    >
                        <svg
                            aria-hidden="true"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M4 9v6h4l5 4V5L8 9H4Z"
                                fill="currentColor"
                            />
                            <path
                                d="M15 9.5c1 .75 1.5 1.75 1.5 2.5s-.5 1.75-1.5 2.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M17.5 7.5c1.5 1.25 2.25 2.75 2.25 4.5s-.75 3.25-2.25 4.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>
                <div className="word-options">
                    {wordOptions.map((word, index) => (
                        <div
                            key={`${word}-${index}`}
                            className={`word-option${
                                isRoundCorrect === true && word === selectedWord ? ' correct-option' : ''
                                }${
                                isRoundCorrect === false && word === selectedWord ? ' incorrect-option' : ''
                                }${
                                isRoundCorrect === false && word === correctImageItem?.word ? ' highlight-correct' : ''
                            }`}
                            onClick={() => onWordSelect(word)}
                        >
                            <span className="word-text">{toDisplayWord(word)}</span>
                        </div>
                    ))}
                </div>
            </>
        );
    } else {
        return null; // Placeholder for unknown exercise type
    }
};
