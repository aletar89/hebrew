// src/components/InstructionDisplay.tsx
import React from 'react';
import { ExerciseType } from '../state/gameReducer'; // Import the enum

// Displays instructions based on exercise type
export const InstructionDisplay: React.FC<{ exerciseType: ExerciseType }> = ({ exerciseType }) => (
    <div className="instruction">
        {exerciseType === ExerciseType.LETTER_TO_PICTURE ? (
            <>
                <p>Ordne den Buchstaben dem passenden Bild zu</p>
                <p>Match the letter to the correct picture</p>
            </>
        ) : exerciseType === ExerciseType.WORD_TO_PICTURE ? (
            <>
                <p>Ordne das Wort dem passenden Bild zu</p>
                <p>Match the word to the correct picture</p>
            </>
        ) : exerciseType === ExerciseType.PICTURE_TO_WORD ? (
            <>
                <p>Ordne das Bild dem passenden Wort zu</p>
                <p>Match the picture to the correct word</p>
            </>
        ) : (
            <>
                <p>Ordne das Bild dem passenden Buchstaben zu</p>
                <p>Match the picture to the correct letter</p>
            </>
        )}
    </div>
); 