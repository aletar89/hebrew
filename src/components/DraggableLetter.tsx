import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import './DraggableLetter.css'; // Create this CSS file too

// Define a more specific type for the data prop
interface DraggableLetterData {
    letter: string;
    originalIndex?: number; // Index in bank or slot
    type: 'bank' | 'slot';
}

interface DraggableLetterProps {
    id: string | number;
    letter: string;
    // isDragging?: boolean; // Removed unused prop
    isCorrect?: boolean | null;
    data?: DraggableLetterData; // Use the specific type
}

export const DraggableLetter: React.FC<DraggableLetterProps> = ({ id, letter, /* isDragging, */ isCorrect, data }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging: dndIsDragging } = useDraggable({
        id: id,
        data: data, // Pass data through
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: dndIsDragging ? 100 : 'auto', // Bring to front when dragging
        opacity: dndIsDragging ? 0.5 : 1,    // Make semi-transparent when dragging
    } : {};

    const className = [
        'draggable-letter',
        dndIsDragging ? 'dragging' : '',
        isCorrect === true ? 'correct' : '',
        isCorrect === false ? 'incorrect' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners} // Attach pointer/touch listeners
            {...attributes} // Attach accessibility attributes
            className={className}
            aria-label={`Draggable letter ${letter}`}
        >
            {letter}
        </div>
    );
}; 