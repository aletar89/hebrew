import React from 'react';

const comboImageModules = import.meta.glob(
  '/public/assets/w*.png',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
) as Record<string, string>;

const comboImages = Object.entries(comboImageModules)
  .sort(([leftPath], [rightPath]) => {
    const leftMatch = leftPath.match(/w(\d+)\.png$/i);
    const rightMatch = rightPath.match(/w(\d+)\.png$/i);
    const leftIndex = Number(leftMatch?.[1] ?? 0);
    const rightIndex = Number(rightMatch?.[1] ?? 0);
    return leftIndex - rightIndex;
  })
  .map(([, imageUrl]) => imageUrl);

interface ComboIndicatorProps {
  comboCount: number;
  unlocked: boolean;
  onActivateRace: () => void;
}

export const ComboIndicator: React.FC<ComboIndicatorProps> = ({
  comboCount,
  unlocked,
  onActivateRace,
}) => {
  const imageIndex = Math.max(0, Math.min(comboCount, comboImages.length - 1));
  const imageUrl = comboImages[imageIndex];

  if (!imageUrl) {
    return null;
  }

  return (
    <button
      type="button"
      className={`combo-indicator${unlocked ? ' combo-indicator-unlocked' : ''}`}
      aria-label={unlocked ? `Current combo ${comboCount}. Start the race challenge.` : `Current combo ${comboCount}.`}
      disabled={!unlocked}
      onClick={onActivateRace}
    >
      <img
        className="combo-indicator-image"
        src={imageUrl}
        alt={`Combo level ${imageIndex + 1}`}
      />
    </button>
  );
};
