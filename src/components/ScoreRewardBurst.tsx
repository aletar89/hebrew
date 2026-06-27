import React, { useEffect, useRef, useState } from 'react';

interface ScoreRewardBurstProps {
  score: number;
}

interface RewardStar {
  id: number;
  drift: number;
  lift: number;
  delay: number;
  size: number;
}

const STAR_COUNT = 4;
const ANIMATION_MS = 900;

export const ScoreRewardBurst: React.FC<ScoreRewardBurstProps> = ({ score }) => {
  const previousScoreRef = useRef(score);
  const [stars, setStars] = useState<RewardStar[]>([]);

  useEffect(() => {
    const previousScore = previousScoreRef.current;
    previousScoreRef.current = score;

    if (score <= previousScore) {
      return;
    }

    const now = Date.now();
    const nextStars = Array.from({ length: STAR_COUNT }, (_, index) => ({
      id: now + index,
      drift: [-38, -14, 18, 42][index],
      lift: [22, 4, 16, -2][index],
      delay: index * 55,
      size: [18, 13, 16, 12][index],
    }));

    setStars(nextStars);

    const timeoutId = window.setTimeout(() => {
      setStars(currentStars => currentStars.filter(star => star.id < now));
    }, ANIMATION_MS + STAR_COUNT * 55);

    return () => window.clearTimeout(timeoutId);
  }, [score]);

  if (stars.length === 0) {
    return null;
  }

  return (
    <div className="score-reward-burst" aria-hidden="true">
      {stars.map(star => (
        <span
          key={star.id}
          className="score-reward-star"
          style={{
            '--star-drift': `${star.drift}px`,
            '--star-lift': `${star.lift}px`,
            '--star-delay': `${star.delay}ms`,
            '--star-size': `${star.size}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
