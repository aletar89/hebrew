import React, { useRef, useEffect } from 'react';
// Import necessary functions and types from drawingUtils
// NOTE: We need to export renderTargetLetter and GUIDE_COLOR from drawingUtils
import { renderTargetLetter, GUIDE_COLOR } from '../utils/drawingUtils';
import './GuideCanvasDisplay.css';

interface GuideCanvasDisplayProps {
    width: number;
    height: number;
    letter: string | null;
}

export const GuideCanvasDisplay: React.FC<GuideCanvasDisplayProps> = ({ width, height, letter }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const displayCanvas = canvasRef.current;
        if (!displayCanvas || !letter) {
             // Clear canvas if no letter
             const ctx = displayCanvas?.getContext('2d');
             ctx?.clearRect(0, 0, width, height);
            return;
        }

        const displayCtx = displayCanvas.getContext('2d');
        if (!displayCtx) return;

        // Generate the guide letter canvas (light gray)
        const guideCanvas = renderTargetLetter(letter, GUIDE_COLOR);

        // Draw the generated guide canvas onto the visible display canvas
        displayCtx.clearRect(0, 0, width, height);
        if (guideCanvas) {
            displayCtx.drawImage(guideCanvas, 0, 0);
        }

    }, [letter, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="guide-canvas-display"
        />
    );
}; 