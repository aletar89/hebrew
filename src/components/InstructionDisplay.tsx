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
        ) : (
            <>
                <p>התאם את התמונה לאות המתאימה</p>
                <p>Match the picture to the correct letter</p>
            </>
        )}
    </div>
); 