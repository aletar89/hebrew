import React, { useRef, useEffect, useState } from 'react';
import './DrawingCanvas.css';

// Configuration constants 
const DRAWING_LINE_WIDTH = 40; 

interface DrawingCanvasProps {
    width: number;
    height: number;
    onDrawEnd: (canvas: HTMLCanvasElement | null) => void; 
    clearSignal: number; 
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ width, height, onDrawEnd, clearSignal }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

    // --- Canvas Setup & Clearing ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas when clearSignal changes
        ctx.clearRect(0, 0, width, height);
        
    }, [clearSignal, width, height]);

    // --- Drawing Logic ---
    const getCoordinates = (event: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (event.nativeEvent instanceof MouseEvent) {
            clientX = event.nativeEvent.clientX;
            clientY = event.nativeEvent.clientY;
        } else if (event.nativeEvent instanceof TouchEvent) {
            if (event.nativeEvent.touches.length === 0) return null; // No touch points
            clientX = event.nativeEvent.touches[0].clientX;
            clientY = event.nativeEvent.touches[0].clientY;
        } else {
            return null; // Should not happen
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        return { x, y };
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        const pos = getCoordinates(event);
        if (!pos) return;
        setIsDrawing(true);
        setLastPos(pos);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const currentPos = getCoordinates(event);
        if (!currentPos || !lastPos) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.strokeStyle = '#333'; // Drawing color
        ctx.lineWidth = DRAWING_LINE_WIDTH; // Use increased line width
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        setLastPos(currentPos);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            setLastPos(null);
            onDrawEnd(canvasRef.current); // Notify parent that drawing finished
        }
    };

    // Prevent page scroll on touch devices while drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const preventScroll = (e: TouchEvent) => {
            if (isDrawing) {
                e.preventDefault();
            }
        };

        canvas.addEventListener('touchmove', preventScroll, { passive: false });

        return () => {
            canvas.removeEventListener('touchmove', preventScroll);
        };
    }, [isDrawing]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="drawing-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
        />
    );
}; 