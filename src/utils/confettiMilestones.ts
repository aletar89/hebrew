export interface ConfettiLevelConfig {
  particleCount: number;
  shapeSize: number;
  launchSpeed: number;
  spreadDeg: number;
  colors: string[];
}

export const MILESTONE_INTERVAL = 5;
export const SESSION_TARGET_SCORE = 40;

export const CONFETTI_LEVELS: ConfettiLevelConfig[] = [
  { particleCount: 80, shapeSize: 12, launchSpeed: 1.1, spreadDeg: 45, colors: ['#FFFF00', '#FFEE00', '#FFD700'] },
  { particleCount: 120, shapeSize: 15, launchSpeed: 1.2, spreadDeg: 50, colors: ['#FFA500', '#FF8C00', '#FF7F50'] },
  { particleCount: 160, shapeSize: 18, launchSpeed: 1.3, spreadDeg: 55, colors: ['#008000', '#228B22', '#32CD32'] },
  { particleCount: 200, shapeSize: 21, launchSpeed: 1.4, spreadDeg: 60, colors: ['#0000FF', '#1E90FF', '#4169E1'] },
  { particleCount: 240, shapeSize: 24, launchSpeed: 1.5, spreadDeg: 65, colors: ['#800080', '#9932CC', '#BA55D3'] },
  { particleCount: 280, shapeSize: 28, launchSpeed: 1.6, spreadDeg: 70, colors: ['#A52A2A', '#8B4513', '#D2691E'] },
  { particleCount: 350, shapeSize: 32, launchSpeed: 1.8, spreadDeg: 80, colors: ['#000000', '#2F4F4F', '#696969', '#FFFFFF'] },
  {
    particleCount: 320,
    shapeSize: 30,
    launchSpeed: 1.7,
    spreadDeg: 75,
    colors: ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#800080', '#FF00FF'],
  },
];

export const getConfettiLevelIndexForScore = (score: number): number => {
  if (score <= 0) {
    return 0;
  }

  const levelIndex = score === 1 ? 0 : Math.floor((score - 1) / MILESTONE_INTERVAL);
  return Math.min(levelIndex, CONFETTI_LEVELS.length - 1);
};

export const getConfettiConfigForScore = (score: number): ConfettiLevelConfig => {
  return CONFETTI_LEVELS[getConfettiLevelIndexForScore(score)];
};

export const getMilestoneScores = (targetScore = SESSION_TARGET_SCORE): number[] => {
  const milestones = [1];

  for (let score = MILESTONE_INTERVAL; score <= targetScore; score += MILESTONE_INTERVAL) {
    milestones.push(score);
  }

  return milestones;
};
