import React, { useState, useEffect, useRef } from 'react';
import ConfettiBoom from 'react-confetti-boom';

// --- Confetti Configuration ---
const MILESTONE_INTERVAL = 1; // Trigger level up every 1 point (as per user edit)
const CONFETTI_DURATION_MS = 1800; // Slightly shorter than round transition

const confettiLevels = [
  // Level 0 (Score 1)
  { particleCount: 80, shapeSize: 12, launchSpeed: 1.1, spreadDeg: 45, colors: ['#FFFF00', '#FFEE00', '#FFD700'] },
  // Level 1 (Score 2)
  { particleCount: 120, shapeSize: 15, launchSpeed: 1.2, spreadDeg: 50, colors: ['#FFA500', '#FF8C00', '#FF7F50'] },
  // Level 2 (Score 3)
  { particleCount: 160, shapeSize: 18, launchSpeed: 1.3, spreadDeg: 55, colors: ['#008000', '#228B22', '#32CD32'] },
  // Level 3 (Score 4)
  { particleCount: 200, shapeSize: 21, launchSpeed: 1.4, spreadDeg: 60, colors: ['#0000FF', '#1E90FF', '#4169E1'] },
  // Level 4 (Score 5)
  { particleCount: 240, shapeSize: 24, launchSpeed: 1.5, spreadDeg: 65, colors: ['#800080', '#9932CC', '#BA55D3'] },
  // Level 5 (Score 6)
  { particleCount: 280, shapeSize: 28, launchSpeed: 1.6, spreadDeg: 70, colors: ['#A52A2A', '#8B4513', '#D2691E'] },
  // Level 6 (Score 7) - Black Belt (moved due to user edit)
  { particleCount: 350, shapeSize: 32, launchSpeed: 1.8, spreadDeg: 80, colors: ['#000000', '#2F4F4F', '#696969', '#FFFFFF'] },
  // Level 7+ (Score 8+) - Rainbow Level! (moved due to user edit)
  {
    particleCount: 320, shapeSize: 30, launchSpeed: 1.7, spreadDeg: 75,
    colors: [
      '#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#800080', '#FF00FF',
    ]
  },
];

// --- Confetti Manager Component ---

interface ConfettiManagerProps {
  score: number;
}

export const ConfettiManager: React.FC<ConfettiManagerProps> = ({ score }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiProps, setConfettiProps] = useState(confettiLevels[0]);
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
      const levelIndex = score === 1 ? 0 : Math.floor((score - 1) / MILESTONE_INTERVAL);
      const currentLevelIndex = Math.min(levelIndex, confettiLevels.length - 1);
      const currentConfettiConfig = confettiLevels[currentLevelIndex];

      console.log(`ConfettiManager: Score milestone ${score}. Level ${currentLevelIndex}. Triggering boom.`);
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