// src/components/FeedbackDisplay.tsx
import React from 'react';

// Displays feedback message
export const FeedbackDisplay: React.FC<{ isCorrect: boolean | null }> = ({ isCorrect }) => {
    if (isCorrect === null) return null; // No feedback yet
    return (
        <div dir={isCorrect === false ? "rtl" : undefined} className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect
                ? '🎉 !נכון! כל הכבוד'
                : 'לא נכון... 🤔'
            }
        </div>
    );
}; 