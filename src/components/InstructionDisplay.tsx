// src/components/InstructionDisplay.tsx
import React from 'react';
import { ExerciseType } from '../state/gameReducer'; // Import the enum

// Displays instructions based on exercise type
export const InstructionDisplay: React.FC<{ exerciseType: ExerciseType }> = ({ exerciseType }) => (
    <div className="instruction">
        {exerciseType === ExerciseType.LETTER_TO_PICTURE ? (
            <>
                <p>התאם את האות לתמונה המתאימה</p>
                <p>Match the letter to the correct picture</p>
            </>
        ) : exerciseType === ExerciseType.WORD_TO_PICTURE ? (
            <>
                <p>התאם את המילה לתמונה המתאימה</p>
                <p>Match the word to the correct picture</p>
            </>
        ) : exerciseType === ExerciseType.PICTURE_TO_WORD ? (
            <>
                <p>התאם את התמונה למילה המתאימה</p>
                <p>Match the picture to the correct word</p>
            </>
        ) : (
            <>
                <p>התאם את התמונה לאות המתאימה</p>
                <p>Match the picture to the correct letter</p>
            </>
        )}
    </div>
); 