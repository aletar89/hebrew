// src/components/FeedbackDisplay.tsx
import React from 'react';

// Displays feedback message
export const FeedbackDisplay: React.FC<{ isCorrect: boolean | null }> = ({ isCorrect }) => {
    if (isCorrect === null) return null; // No feedback yet
    return (
        <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect
                ? '🎉 !נכון! כל הכבוד'
                : '🤗 !נסה שוב! אתה יכול'
            }
        </div>
    );
}; 