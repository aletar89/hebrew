import React, { useEffect, useRef, useState } from 'react';
import { getMilestoneScores, SESSION_TARGET_SCORE } from '../utils/confettiMilestones';

interface ScoreProgressBarProps {
  score: number;
}

const clampScore = (score: number): number => {
  return Math.max(0, Math.min(score, SESSION_TARGET_SCORE));
};

export const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({ score }) => {
  const previousScoreRef = useRef(score);
  const [didGainScore, setDidGainScore] = useState(false);
  const currentScore = clampScore(score);
  const milestones = getMilestoneScores();
  const nextMilestone = milestones.find(milestone => milestone > currentScore) ?? SESSION_TARGET_SCORE;
  const fillPercent = (currentScore / SESSION_TARGET_SCORE) * 100;

  useEffect(() => {
    const previousScore = previousScoreRef.current;
    previousScoreRef.current = score;

    if (score <= previousScore) {
      return;
    }

    setDidGainScore(true);
    const timeoutId = window.setTimeout(() => setDidGainScore(false), 650);

    return () => window.clearTimeout(timeoutId);
  }, [score]);

  return (
    <div
      className={`score-progress${didGainScore ? ' score-progress-gained' : ''}`}
      aria-label={`Progress toward the next confetti reward. Score ${currentScore} out of ${SESSION_TARGET_SCORE}. Next reward at ${nextMilestone}.`}
    >
      <div className="score-progress-track-shell">
        <div className="score-progress-track">
          <div
            className="score-progress-fill"
            style={{
              transform: `scaleX(${fillPercent / 100})`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
