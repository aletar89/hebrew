// src/components/ScoreDisplay.tsx
import React from 'react';

// Displays the score, now forwarding a ref to the outer div
export const ScoreDisplay = React.forwardRef<
    HTMLDivElement, // Type of the element the ref points to
    { score: number } // Type of the component's props
>(({ score }, ref) => (
    <div className="score-display" ref={ref}>
        <div className="score-number">Score: {score}</div>
    </div>
));

// Add display name for better debugging
ScoreDisplay.displayName = 'ScoreDisplay'; 