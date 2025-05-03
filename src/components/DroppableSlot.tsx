import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import './DroppableSlot.css'; // Create this CSS file too

interface DroppableSlotProps {
    id: string | number;
    children: React.ReactNode;
    disabled?: boolean;
}

export const DroppableSlot: React.FC<DroppableSlotProps> = ({ id, children, disabled }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
        disabled: disabled,
    });

    const style = {
        // Add visual feedback when a draggable item is over this slot
        border: isOver ? '2px dashed #4CAF50' : '2px solid #ccc',
        backgroundColor: isOver ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
        transition: 'border-color 0.2s ease, background-color 0.2s ease', // Smooth transition
    };

    return (
        <div ref={setNodeRef} style={style} className="droppable-slot">
            {children}
        </div>
    );
}; 