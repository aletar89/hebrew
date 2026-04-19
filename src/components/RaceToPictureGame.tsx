import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GermanLetterItem } from '../utils/imageUtils';
import { getRandomElement, shuffleArray } from '../utils/arrayUtils';
import './RaceToPictureGame.css';

interface RaceToPictureGameProps {
  targetLetter: string;
  correctItems: GermanLetterItem[];
  distractorItems: GermanLetterItem[];
  targetCount: number;
  disabled?: boolean;
  onAttempt: (item: GermanLetterItem, isCorrect: boolean) => void;
  onFinish: (isCorrect: boolean) => void;
}

interface RaceLaneItem {
  lane: number;
  item: GermanLetterItem;
  isCorrect: boolean;
}

interface WaveResult {
  lanes: RaceLaneItem[];
  correctItemWord: string;
  correctLane: number;
}

const LANE_COUNT = 3;
const START_Y = -220;
const COLLISION_Y = 346;
const BASE_SPEED = 2.6;
const SPEED_STEP = 0.35;
const TICK_MS = 24;
const MARKER_SPACING = 140;

const createWave = (
  correctItems: GermanLetterItem[],
  distractorItems: GermanLetterItem[],
  previousCorrectWord: string | null,
  previousCorrectLane: number | null,
  sameLaneStreak: number
): WaveResult | null => {
  const availableCorrectItems =
    correctItems.length > 1 && previousCorrectWord
      ? correctItems.filter(item => item.word !== previousCorrectWord)
      : correctItems;
  const correctItem = getRandomElement(availableCorrectItems);
  const shuffledDistractors = shuffleArray(distractorItems)
    .filter(item => item.word !== correctItem?.word)
    .slice(0, LANE_COUNT - 1);

  if (!correctItem || shuffledDistractors.length < LANE_COUNT - 1) {
    return null;
  }

  const laneOptions =
    previousCorrectLane !== null && sameLaneStreak >= 2
      ? [0, 1, 2].filter(lane => lane !== previousCorrectLane)
      : [0, 1, 2];
  const correctLane = getRandomElement(laneOptions) ?? 1;
  const lanes: RaceLaneItem[] = [];
  let distractorIndex = 0;

  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    if (lane === correctLane) {
      lanes.push({ lane, item: correctItem, isCorrect: true });
      continue;
    }

    lanes.push({
      lane,
      item: shuffledDistractors[distractorIndex],
      isCorrect: false,
    });
    distractorIndex += 1;
  }

  return {
    lanes,
    correctItemWord: correctItem.word,
    correctLane,
  };
};

export function RaceToPictureGame({
  targetLetter,
  correctItems,
  distractorItems,
  targetCount,
  disabled = false,
  onAttempt,
  onFinish,
}: RaceToPictureGameProps) {
  const [carPosition, setCarPosition] = useState(1);
  const [wave, setWave] = useState<RaceLaneItem[]>([]);
  const [rowY, setRowY] = useState(START_Y);
  const [collected, setCollected] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Collect the matching picture.');
  const [collisionFlash, setCollisionFlash] = useState<{ lane: number; isCorrect: boolean } | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const waveResolvedRef = useRef(false);
  const carPositionRef = useRef(1);
  const rowYRef = useRef(START_Y);
  const collectedRef = useRef(0);
  const waveRef = useRef<RaceLaneItem[]>([]);
  const previousCorrectWordRef = useRef<string | null>(null);
  const previousCorrectLaneRef = useRef<number | null>(null);
  const sameLaneStreakRef = useRef(0);

  const hasPlayableWave = useMemo(
    () => correctItems.length > 0 && distractorItems.length >= LANE_COUNT - 1,
    [correctItems, distractorItems]
  );
  const currentSpeed = BASE_SPEED + collected * SPEED_STEP;

  const spawnWave = useCallback(() => {
    waveResolvedRef.current = false;
    setCollisionFlash(null);
    const nextWave = createWave(
      correctItems,
      distractorItems,
      previousCorrectWordRef.current,
      previousCorrectLaneRef.current,
      sameLaneStreakRef.current
    );
    if (!nextWave) {
      waveRef.current = [];
      setWave([]);
      return;
    }

    previousCorrectWordRef.current = nextWave.correctItemWord;
    sameLaneStreakRef.current =
      previousCorrectLaneRef.current === nextWave.correctLane
        ? sameLaneStreakRef.current + 1
        : 1;
    previousCorrectLaneRef.current = nextWave.correctLane;
    waveRef.current = nextWave.lanes;
    rowYRef.current = START_Y;
    setWave(nextWave.lanes);
    setRowY(START_Y);
  }, [correctItems, distractorItems]);

  const updateCarPositionFromClientX = useCallback((clientX: number) => {
    if (!trackRef.current) {
      return;
    }

    const rect = trackRef.current.getBoundingClientRect();
    const relativeX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const normalized = rect.width > 0 ? relativeX / rect.width : 0.5;
    const nextPosition = normalized * (LANE_COUNT - 1);
    carPositionRef.current = nextPosition;
    setCarPosition(nextPosition);
  }, []);

  useEffect(() => {
    carPositionRef.current = 1;
    rowYRef.current = START_Y;
    collectedRef.current = 0;
    setCarPosition(1);
    setRowY(START_Y);
    setCollected(0);
    waveResolvedRef.current = false;
    setCollisionFlash(null);
    setStatusMessage('Collect the matching picture.');
    previousCorrectWordRef.current = null;
    previousCorrectLaneRef.current = null;
    sameLaneStreakRef.current = 0;
    if (hasPlayableWave) {
      const nextWave = createWave(correctItems, distractorItems, null, null, 0);
      if (nextWave) {
        previousCorrectWordRef.current = nextWave.correctItemWord;
        previousCorrectLaneRef.current = nextWave.correctLane;
        sameLaneStreakRef.current = 1;
        waveRef.current = nextWave.lanes;
        setWave(nextWave.lanes);
      } else {
        waveRef.current = [];
        setWave([]);
      }
    } else {
      waveRef.current = [];
      setWave([]);
    }
  }, [correctItems, distractorItems, hasPlayableWave, targetLetter]);

  useEffect(() => {
    if (disabled || !hasPlayableWave) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setCarPosition(current => {
          const next = Math.max(0, current - 1);
          carPositionRef.current = next;
          return next;
        });
      } else if (event.key === 'ArrowRight') {
        setCarPosition(current => {
          const next = Math.min(LANE_COUNT - 1, current + 1);
          carPositionRef.current = next;
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, hasPlayableWave]);

  useEffect(() => {
    if (disabled || !hasPlayableWave || waveRef.current.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      const speed = BASE_SPEED + collectedRef.current * SPEED_STEP;
      const nextY = rowYRef.current + speed;
      rowYRef.current = nextY;
      setRowY(nextY);

      if (nextY >= COLLISION_Y && !waveResolvedRef.current) {
        waveResolvedRef.current = true;
        const activeLane = Math.round(carPositionRef.current);
        const chosen = waveRef.current.find(entry => entry.lane === activeLane);

        if (!chosen) {
          return;
        }

        setCollisionFlash({ lane: chosen.lane, isCorrect: chosen.isCorrect });
        onAttempt(chosen.item, chosen.isCorrect);

        if (!chosen.isCorrect) {
          setStatusMessage(`Oops! ${chosen.item.word} does not start with ${targetLetter}.`);
          window.setTimeout(() => onFinish(false), 0);
          return;
        }

        const nextCollected = collectedRef.current + 1;
        collectedRef.current = nextCollected;
        setCollected(nextCollected);

        if (nextCollected >= targetCount) {
          setStatusMessage('Great driving!');
          window.setTimeout(() => onFinish(true), 0);
          return;
        }

        setStatusMessage(`Nice! ${nextCollected}/${targetCount}`);
        window.setTimeout(() => {
          spawnWave();
        }, 140);
      }
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [disabled, hasPlayableWave, onAttempt, onFinish, spawnWave, targetCount, targetLetter]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    event.preventDefault();
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateCarPositionFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || disabled) {
      return;
    }

    event.preventDefault();
    updateCarPositionFromClientX(event.clientX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!hasPlayableWave) {
    return (
      <div className="race-game-empty">
        Add more pictures to try the race mode for this letter.
      </div>
    );
  }

  return (
    <div className="race-game">
      <div className="race-game-header">
        <div className="race-speedometer">
          <span className="race-speedometer-label">Speed</span>
          <strong className="race-speedometer-value">{currentSpeed.toFixed(2)}</strong>
        </div>
        <div className="race-target">
          Drive into the pictures for <strong>{targetLetter}</strong>
        </div>
        <div className="race-progress">
          {collected}/{targetCount}
        </div>
      </div>

      <div
        className="race-track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="race-road" />
        <div className="race-lane-markers" aria-hidden="true">
          {[0, 1].map(index => (
            <div
              key={index}
              className="race-lane-marker-column"
              style={{ left: `${((index + 1) / LANE_COUNT) * 100}%` }}
            >
              {Array.from({ length: 8 }, (_, markerIndex) => (
                <span
                  key={markerIndex}
                  className="race-lane-marker"
                  style={{
                    top: `${markerIndex * MARKER_SPACING - MARKER_SPACING + ((rowY - START_Y) % MARKER_SPACING + MARKER_SPACING) % MARKER_SPACING}px`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div
          className="race-wave"
          style={{ transform: `translateY(${rowY}px)` }}
        >
          {Array.from({ length: LANE_COUNT }, (_, lane) => {
            const laneItem = wave.find(entry => entry.lane === lane);
            if (!laneItem) {
              return <div key={lane} className="race-card-slot" />;
            }

            return (
              <div key={lane} className="race-card-slot">
                <div
                  className={`race-card${collisionFlash?.lane === lane ? (collisionFlash.isCorrect ? ' success' : ' error') : ''}`}
                >
                  <img
                    src={laneItem.item.imageUrl}
                    alt={laneItem.item.word}
                    className="race-card-image"
                    draggable={false}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="race-car-row"
          style={{ left: `${(carPosition / (LANE_COUNT - 1)) * 100}%` }}
        >
          <div className="race-car">
            <img
              src="/assets/car.png"
              alt=""
              className="race-car-image"
              draggable={false}
            />
            <div className="race-car-letter">{targetLetter}</div>
          </div>
        </div>
      </div>

      <div className="race-status" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  );
}
