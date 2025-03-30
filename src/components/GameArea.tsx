// src/components/GameArea.tsx
import React from 'react';
import { GameState, ExerciseType } from '../state/gameReducer';
import { HebrewLetterItem } from '../utils/imageUtils';

// Props for GameArea component
interface GameAreaProps {
    gameState: GameState;
    onImageSelect: (item: HebrewLetterItem) => void;
    onLetterSelect: (letter: string) => void;
}

// Displays the core interactive area (prompt and options)
export const GameArea: React.FC<GameAreaProps> = ({ gameState, onImageSelect, onLetterSelect }) => {
    const {
        exerciseType,
        currentLetter,
        correctImageItem,
        imageOptions,
        letterOptions,
        selectedOption,
        selectedLetter,
        isCorrect
    } = gameState;

    // Fallback image function
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, letter: string) => {
        e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f0f0f0'/%3E%3Ctext x='75' y='75' font-family='Arial' font-size='60' text-anchor='middle' alignment-baseline='middle' fill='%234682b4'%3E${encodeURIComponent(letter)}%3C/text%3E%3C/svg%3E`;
    };

    if (exerciseType === ExerciseType.LETTER_TO_PICTURE) {
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
                                isCorrect === true && option.letter === correctImageItem?.letter ? ' correct-option' : ''
                                }${
                                isCorrect === false && selectedOption && option.letter === selectedOption.letter ? ' incorrect-option' : ''
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
                                isCorrect === true && letter === currentLetter ? ' correct-option' : ''
                                }${
                                isCorrect === false && selectedLetter === letter ? ' incorrect-option' : ''
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