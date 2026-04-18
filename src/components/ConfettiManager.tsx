import React, { useState, useEffect, useRef } from 'react';
import ConfettiBoom from 'react-confetti-boom';
import {
  CONFETTI_LEVELS,
  getConfettiConfigForScore,
  MILESTONE_INTERVAL,
} from '../utils/confettiMilestones';

const CONFETTI_DURATION_MS = 1800; // Slightly shorter than round transition

// --- Confetti Manager Component ---

interface ConfettiManagerProps {
  score: number;
}

export const ConfettiManager: React.FC<ConfettiManagerProps> = ({ score }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiProps, setConfettiProps] = useState(CONFETTI_LEVELS[0]);
  // Store the calculated origin relative to the viewport
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 0.5, y: 0.5 });
  const confettiTimeoutRef = useRef<number | null>(null);
  const previousScoreRef = useRef<number>(score);

  // Effect to find the app container and calculate the confetti origin
  useEffect(() => {
    const calculateOrigin = () => {
      const appContainer = document.querySelector('.app-container') as HTMLElement;
      if (appContainer) {
        const rect = appContainer.getBoundingClientRect();
        // Calculate center of the container relative to viewport
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // Convert center coordinates to ratios of viewport dimensions
        const originX = centerX / window.innerWidth;
        const originY = centerY / window.innerHeight;

        setConfettiOrigin({ x: originX, y: originY });
        // console.log(`Confetti Origin updated: x=${originX.toFixed(2)}, y=${originY.toFixed(2)}`);
      } else {
        console.warn("ConfettiManager: Could not find .app-container element. Using default origin (0.5, 0.5).");
        setConfettiOrigin({ x: 0.5, y: 0.5 }); // Fallback to center screen
      }
    };

    calculateOrigin(); // Initial calculation
    window.addEventListener('resize', calculateOrigin); // Update on resize

    return () => window.removeEventListener('resize', calculateOrigin); // Cleanup listener
  }, []);

  // Effect to trigger confetti based on score
  useEffect(() => {
    const scoreIncreased = score > previousScoreRef.current;
    const isMilestone = score > 0 && (score % MILESTONE_INTERVAL === 0 || score === 1);

    if (scoreIncreased && isMilestone) {
      const currentConfettiConfig = getConfettiConfigForScore(score);

      console.log(`ConfettiManager: Score milestone ${score}. Triggering boom.`);
      setConfettiProps(currentConfettiConfig);
      setShowConfetti(true);

      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }

      confettiTimeoutRef.current = window.setTimeout(() => {
        console.log("ConfettiManager: Hiding confetti.");
        setShowConfetti(false);
        confettiTimeoutRef.current = null;
      }, CONFETTI_DURATION_MS);
    }

    previousScoreRef.current = score;

    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, [score]);

  if (!showConfetti) {
    return null;
  }

  // Style the container to cover the full viewport
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: `0px`,
    left: `0px`,
    width: `100%`,
    height: `100%`,
    zIndex: 9999,
    pointerEvents: 'none',
    // No overflow hidden needed anymore
  };

  return (
    <div style={containerStyle}>
      <ConfettiBoom
        mode="boom"
        x={confettiOrigin.x} // Use calculated viewport-relative origin X
        y={confettiOrigin.y} // Use calculated viewport-relative origin Y
        effectCount={1}
        {...confettiProps}
      />
    </div>
  );
}; 
