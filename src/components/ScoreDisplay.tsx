// src/components/ScoreDisplay.tsx
import React from 'react';

// Displays the score
export const ScoreDisplay: React.FC<{ score: number }> = ({ score }) => (
    <div className="score-display">
        <div className="score-number">Score: {score}</div>
    </div>
); 