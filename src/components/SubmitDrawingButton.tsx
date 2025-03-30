import React from 'react';
import './SubmitDrawingButton.css';

interface SubmitDrawingButtonProps {
    onClick: () => void;
    disabled: boolean;
}

export const SubmitDrawingButton: React.FC<SubmitDrawingButtonProps> = ({ onClick, disabled }) => {
    return (
        <button
            className="submit-drawing-button"
            onClick={onClick}
            disabled={disabled}
        >
            Check My Drawing
        </button>
    );
}; 