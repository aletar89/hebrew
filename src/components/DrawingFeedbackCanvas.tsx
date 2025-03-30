import React, { useRef, useEffect } from 'react';
import './DrawingFeedbackCanvas.css';

interface DrawingFeedbackCanvasProps {
    width: number;
    height: number;
    // Props to pass drawing data and feedback instructions will be added later
    isVisible: boolean; // Control visibility
    feedbackImageData: ImageData | null; // Pixel data for feedback
}

export const DrawingFeedbackCanvas: React.FC<DrawingFeedbackCanvasProps> = ({ width, height, isVisible, feedbackImageData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isVisible) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear previous feedback
        ctx.clearRect(0, 0, width, height);

        // Draw the feedback image data if available
        if (feedbackImageData) {
            try {
                 // Ensure the received data matches canvas dimensions
                 if (feedbackImageData.width === width && feedbackImageData.height === height) {
                    ctx.putImageData(feedbackImageData, 0, 0);
                 } else {
                    console.warn('Feedback ImageData dimensions do not match canvas dimensions.');
                    // Optionally try to scale or just skip drawing
                 }
            } catch (error) {
                console.error("Error drawing feedback ImageData:", error);
                // Fallback placeholder if drawing fails
                ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                ctx.fillRect(0, 0, width, height);
                ctx.fillStyle = '#888';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '14px Arial';
                ctx.fillText('(Error displaying feedback)', width / 2, height / 2);
            }
        } else {
             // Optional: Could draw a different placeholder if feedback is expected but null
             // For now, just leave it clear if no feedback data
        }

    }, [isVisible, width, height, feedbackImageData]); // Rerun when feedback data changes

    if (!isVisible) {
        return null;
    }

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="drawing-feedback-canvas"
        />
    );
}; 