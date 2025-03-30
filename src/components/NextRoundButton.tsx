// src/components/NextRoundButton.tsx
import React from 'react';
import { ExerciseType } from '../state/gameReducer'; // Import the enum

// Button to proceed to the next round
export const NextRoundButton: React.FC<{ onClick: () => void; exerciseType: ExerciseType }> = ({ onClick, exerciseType }) => (
    <button
        className="new-letter-button"
        onClick={onClick}
    >
        {exerciseType === ExerciseType.LETTER_TO_PICTURE ? 'אות חדשה (New Letter)' : 'תמונה חדשה (New Picture)'}
    </button>
); 