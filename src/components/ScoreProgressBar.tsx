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
  const nextConfetti = getConfettiConfigForScore(nextMilestone);
  const fillPercent = (currentScore / SESSION_TARGET_SCORE) * 100;
  const markerPercent = fillPercent;

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
              background: `linear-gradient(90deg, ${nextConfetti.colors[0]}, ${nextConfetti.colors[nextConfetti.colors.length - 1]})`,
            }}
          />

          {milestones.map(milestone => {
            const palette = getConfettiConfigForScore(milestone).colors;
            const position = (milestone / SESSION_TARGET_SCORE) * 100;
            const isReached = currentScore >= milestone;
            const isNext = milestone === nextMilestone;

            return (
              <div
                key={milestone}
                className={`score-progress-milestone${isReached ? ' reached' : ''}${isNext ? ' next' : ''}`}
                style={{
                  left: `${position}%`,
                  background: palette.length > 3
                    ? `linear-gradient(135deg, ${palette.join(', ')})`
                    : `linear-gradient(135deg, ${palette[0]}, ${palette[palette.length - 1]})`,
                }}
                aria-hidden="true"
              />
            );
          })}

          <div
            className="score-progress-marker"
            style={{
              left: `${markerPercent}%`,
              boxShadow: `0 0 0 6px ${nextConfetti.colors[0]}22`,
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="score-progress-preview" aria-hidden="true">
        {nextConfetti.colors.map(color => (
          <span
            key={`${nextMilestone}-${color}`}
            className="score-progress-swatch"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};
