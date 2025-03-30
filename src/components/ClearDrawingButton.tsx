import React from 'react';
import './ClearDrawingButton.css';

interface ClearDrawingButtonProps {
    onClick: () => void;
}

export const ClearDrawingButton: React.FC<ClearDrawingButtonProps> = ({ onClick }) => {
    return (
        <button
            className="clear-drawing-button"
            onClick={onClick}
        >
            Clear & Try Again
        </button>
    );
}; 