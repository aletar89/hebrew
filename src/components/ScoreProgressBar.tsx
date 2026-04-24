import React from 'react';
import { getConfettiConfigForScore, getMilestoneScores, SESSION_TARGET_SCORE } from '../utils/confettiMilestones';

interface ScoreProgressBarProps {
  score: number;
}

const clampScore = (score: number): number => {
  return Math.max(0, Math.min(score, SESSION_TARGET_SCORE));
};

export const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({ score }) => {
  const currentScore = clampScore(score);
  const milestones = getMilestoneScores();
  const nextMilestone = milestones.find(milestone => milestone > currentScore) ?? SESSION_TARGET_SCORE;
  const reachedMilestone = [...milestones].reverse().find(milestone => milestone <= currentScore);
  const fillGradient = reachedMilestone
    ? (() => {
        const reachedConfetti = getConfettiConfigForScore(reachedMilestone);
        return `linear-gradient(90deg, ${reachedConfetti.colors[0]}, ${reachedConfetti.colors[reachedConfetti.colors.length - 1]})`;
      })()
    : 'linear-gradient(90deg, #ffff00, #ffd700)';
  const fillPercent = (currentScore / SESSION_TARGET_SCORE) * 100;

  return (
    <div
      className="score-progress"
      aria-label={`Progress toward the next confetti reward. Score ${currentScore} out of ${SESSION_TARGET_SCORE}. Next reward at ${nextMilestone}.`}
    >
      <div className="score-progress-track-shell">
        <div className="score-progress-track">
          <div
            className="score-progress-fill"
            style={{
              width: `${fillPercent}%`,
              background: fillGradient,
            }}
          />
        </div>
      </div>
    </div>
  );
};
