import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { DotPoint } from '../utils/letterDotPatterns';
import './DotTraceCanvas.css';

interface DotTraceCanvasProps {
  letter: string;
  points: DotPoint[];
  width?: number;
  height?: number;
  onComplete: () => void;
}

const DEFAULT_SIZE = 300;
const HIT_RADIUS = 20; // px radius to advance the path

export const DotTraceCanvas: React.FC<DotTraceCanvasProps> = ({
  letter,
  points,
  width = DEFAULT_SIZE,
  height = DEFAULT_SIZE,
  onComplete,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visited, setVisited] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [rollbackIndex, setRollbackIndex] = useState<number | null>(null);
  const [pendingNextIndex, setPendingNextIndex] = useState<number | null>(null);
  const [awaitingLift, setAwaitingLift] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const visitedSnapshotRef = useRef<number[]>([]);

  useEffect(() => {
    setActiveIndex(0);
    setVisited([]);
    setIsDragging(false);
    setTransitioning(false);
    setRollbackIndex(null);
    setPendingNextIndex(null);
    setAwaitingLift(false);
    visitedSnapshotRef.current = [];
  }, [letter, points]);

  const scaledPoints = useMemo(
    () => points.map((p) => ({ x: p.x * width, y: p.y * height, lift: p.lift })),
    [points, width, height],
  );

  const buildPathSegments = useCallback(
    (indices: number[]) => {
      const segments: string[] = [];
      let current = '';
      indices.forEach((idx) => {
        const pt = scaledPoints[idx];
        if (!pt) return;
        const startNew = current === '' || pt.lift;
        if (startNew) {
          if (current) segments.push(current);
          current = `M ${pt.x} ${pt.y}`;
        } else {
          current += ` L ${pt.x} ${pt.y}`;
        }
      });
      if (current) segments.push(current);
      return segments;
    },
    [scaledPoints],
  );

  const ghostSegments = useMemo(
    () => buildPathSegments(scaledPoints.map((_, idx) => idx)),
    [buildPathSegments, scaledPoints],
  );

  const drawnSegments = useMemo(() => buildPathSegments(visited), [buildPathSegments, visited]);

  const handlePointSelect = (index: number, deferNext = false) => {
    if (index !== activeIndex) return;
    const nextActive = index + 1;
    setVisited((prev) => (prev.includes(index) ? prev : [...prev, index]));
    if (deferNext) {
      setPendingNextIndex(nextActive);
      setAwaitingLift(true);
      return nextActive;
    }
    const hasNext = nextActive < scaledPoints.length;
    if (hasNext) {
      const nextHasLift = scaledPoints[nextActive]?.lift === true;
      if (nextHasLift) {
        setPendingNextIndex(nextActive);
        setAwaitingLift(true);
        setTransitioning(false);
        setRollbackIndex(null);
      } else {
        setRollbackIndex(index);
        setTransitioning(true);
        setActiveIndex(nextActive);
      }
    } else {
      setActiveIndex(nextActive);
      setIsDragging(false);
      onComplete();
    }
    return nextActive;
  };

  const isFinished = activeIndex >= scaledPoints.length && scaledPoints.length > 0;

  const handleVisitIfClose = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg || isFinished) return { touched: false, nextIndexOnRelease: null };

      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * width;
      const y = ((clientY - rect.top) / rect.height) * height;

      const nextPoint = scaledPoints[activeIndex];
      if (!nextPoint) return { touched: false, nextIndexOnRelease: null };

      const dx = x - nextPoint.x;
      const dy = y - nextPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= HIT_RADIUS) {
        // If we are moving toward a new active target, finalize it and start the next transition if needed.
        if (transitioning) {
          const nextIndex = activeIndex + 1;
          const nextHasLift = scaledPoints[nextIndex]?.lift === true;
          const committedVisited = visited.includes(activeIndex) ? visited : [...visited, activeIndex];
          setVisited(committedVisited);
          visitedSnapshotRef.current = committedVisited;
          setTransitioning(false);
          setRollbackIndex(null);

          if (nextIndex >= scaledPoints.length) {
            setActiveIndex(nextIndex);
            onComplete();
            return { touched: true, nextIndexOnRelease: null };
          }

          if (nextHasLift) {
            setPendingNextIndex(nextIndex);
            setAwaitingLift(true);
            return { touched: true, nextIndexOnRelease: null };
          }

          setRollbackIndex(activeIndex);
          setTransitioning(true);
          setActiveIndex(nextIndex);
          return { touched: true, nextIndexOnRelease: null };
        }

        // Starting a new advance from the current active point
        const nextHasLift = scaledPoints[activeIndex + 1]?.lift === true;
        visitedSnapshotRef.current = [...visited];
        handlePointSelect(activeIndex, nextHasLift);
        return { touched: true, nextIndexOnRelease: null };
      }
      return { touched: false, nextIndexOnRelease: null };
    },
    [activeIndex, height, isFinished, onComplete, scaledPoints, transitioning, visited, width],
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'touch') {
      e.preventDefault();
    }
    const { touched } = handleVisitIfClose(e.clientX, e.clientY);
    if (touched) setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'touch') {
      e.preventDefault();
    }
    if (!isDragging) return;
    handleVisitIfClose(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (transitioning && rollbackIndex !== null) {
      // Revert progress if the next dot wasn't reached
      setActiveIndex(rollbackIndex);
      setVisited(visitedSnapshotRef.current);
      setTransitioning(false);
      setRollbackIndex(null);
      setPendingNextIndex(null);
      setAwaitingLift(false);
      return;
    }

    if (pendingNextIndex !== null) {
      setActiveIndex(pendingNextIndex);
      setAwaitingLift(false);
      setPendingNextIndex(null);
    }
  };

  const handlePointerLeave = () => {
    setIsDragging(false);
  };

  const handleCirclePointerDown = (idx: number) => (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      e.preventDefault();
    }
    if (idx === activeIndex) {
      setIsDragging(true);
      const nextHasLift = scaledPoints[activeIndex + 1]?.lift === true;
      visitedSnapshotRef.current = [...visited];
      handlePointSelect(idx, nextHasLift);
    }
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const preventTouchScroll = (event: TouchEvent) => {
      event.preventDefault();
    };

    svg.addEventListener('touchstart', preventTouchScroll, { passive: false });
    svg.addEventListener('touchmove', preventTouchScroll, { passive: false });

    return () => {
      svg.removeEventListener('touchstart', preventTouchScroll);
      svg.removeEventListener('touchmove', preventTouchScroll);
    };
  }, []);

  return (
    <div className="dot-trace-container" style={{ width, maxWidth: '100%' }}>
      <div className="dot-trace-header">
        <div className="dot-trace-letter">{letter}</div>
        <div className="dot-trace-progress">
          {Math.min(activeIndex + 1, scaledPoints.length)} / {scaledPoints.length}
        </div>
      </div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="dot-trace-svg"
        ref={svgRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {scaledPoints.map((pt, idx) => {
          const isActive = idx === activeIndex && !isFinished && !awaitingLift;
          if (isActive) return null;
          const isVisited = visited.includes(idx);
          const className = isVisited ? 'dot-trace-circle visited' : 'dot-trace-circle waiting';
          return (
            <circle
              key={`${letter}-dot-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={10}
              className={className}
              onPointerDown={handleCirclePointerDown(idx)}
            />
          );
        })}
        {!isFinished && !awaitingLift && scaledPoints[activeIndex] && (
          <circle
            key={`${letter}-dot-active`}
            cx={scaledPoints[activeIndex].x}
            cy={scaledPoints[activeIndex].y}
            r={12}
            className="dot-trace-circle active"
            onPointerDown={handleCirclePointerDown(activeIndex)}
          />
        )}
        {ghostSegments.map((d, idx) => (
          <path key={`ghost-${idx}`} d={d} className="dot-trace-ghost" />
        ))}
        {drawnSegments.map((d, idx) => (
          <path key={`drawn-${idx}`} d={d} className="dot-trace-path" />
        ))}
      </svg>
      <div
        className="dot-trace-hint"
        aria-label="Trace from dot to dot. Lift your finger when the next dot starts a new stroke."
      />
    </div>
  );
};
