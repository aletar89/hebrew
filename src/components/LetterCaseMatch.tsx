import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './LetterCaseMatch.css';

interface LetterCaseMatchProps {
  uppercaseLetters: string[];
  lowercaseLetters: string[];
  disabled?: boolean;
  onAttempt: (uppercase: string, lowercase: string, isCorrect: boolean) => void;
  onComplete: () => void;
}

interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const LOWERCASE_LOCALE = 'de-DE';

export function LetterCaseMatch({
  uppercaseLetters,
  lowercaseLetters,
  disabled = false,
  onAttempt,
  onComplete,
}: LetterCaseMatchProps) {
  const [selectedUppercase, setSelectedUppercase] = useState<string | null>(null);
  const [selectedLowercase, setSelectedLowercase] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<LineSegment[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setSelectedUppercase(null);
    setSelectedLowercase(null);
    setMatchedPairs({});
    setStatusMessage(null);
  }, [uppercaseLetters, lowercaseLetters]);

  const usedLowercaseLetters = useMemo(
    () => new Set(Object.values(matchedPairs)),
    [matchedPairs]
  );

  const updateLines = useCallback(() => {
    if (!containerRef.current) {
      setLines([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const nextLines = Object.entries(matchedPairs).flatMap(([uppercase, lowercase]) => {
      const leftNode = leftRefs.current[uppercase];
      const rightNode = rightRefs.current[lowercase];

      if (!leftNode || !rightNode) {
        return [];
      }

      const leftRect = leftNode.getBoundingClientRect();
      const rightRect = rightNode.getBoundingClientRect();

      return [{
        x1: leftRect.right - containerRect.left,
        y1: leftRect.top + leftRect.height / 2 - containerRect.top,
        x2: rightRect.left - containerRect.left,
        y2: rightRect.top + rightRect.height / 2 - containerRect.top,
      }];
    });

    setLines(nextLines);
  }, [matchedPairs]);

  useEffect(() => {
    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [updateLines]);

  const completeAttempt = useCallback((uppercase: string, lowercase: string) => {
    const isCorrect = uppercase.toLocaleLowerCase(LOWERCASE_LOCALE) === lowercase;
    onAttempt(uppercase, lowercase, isCorrect);

    if (!isCorrect) {
      setSelectedUppercase(null);
      setSelectedLowercase(null);
      setStatusMessage('Try again');
      return;
    }

    const nextPairs = {
      ...matchedPairs,
      [uppercase]: lowercase,
    };

    setMatchedPairs(nextPairs);
    setSelectedUppercase(null);
    setSelectedLowercase(null);
    setStatusMessage(null);

    if (Object.keys(nextPairs).length === uppercaseLetters.length) {
      onComplete();
    }
  }, [matchedPairs, onAttempt, onComplete, uppercaseLetters.length]);

  const handleUppercaseSelect = (uppercase: string) => {
    if (disabled || matchedPairs[uppercase]) {
      return;
    }

    if (selectedLowercase) {
      completeAttempt(uppercase, selectedLowercase);
      return;
    }

    setStatusMessage(null);
    setSelectedLowercase(null);
    setSelectedUppercase(current => current === uppercase ? null : uppercase);
  };

  const handleLowercaseSelect = (lowercase: string) => {
    if (disabled || usedLowercaseLetters.has(lowercase)) {
      return;
    }

    if (selectedUppercase) {
      completeAttempt(selectedUppercase, lowercase);
      return;
    }

    setStatusMessage(null);
    setSelectedUppercase(null);
    setSelectedLowercase(current => current === lowercase ? null : lowercase);
  };

  return (
    <div className="letter-case-match">
      <div className="letter-case-match-board" ref={containerRef}>
        <svg className="letter-case-match-lines" aria-hidden="true">
          {lines.map((line, index) => (
            <line
              key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}-${index}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
            />
          ))}
        </svg>

        <div className="letter-case-column" aria-label="Capital letters">
          <div className="letter-case-list">
            {uppercaseLetters.map(letter => {
              const isMatched = Boolean(matchedPairs[letter]);
              return (
                <button
                  key={letter}
                  ref={node => {
                    leftRefs.current[letter] = node;
                  }}
                  type="button"
                  className={`letter-case-card${selectedUppercase === letter ? ' selected' : ''}${isMatched ? ' matched' : ''}`}
                  onClick={() => handleUppercaseSelect(letter)}
                  disabled={disabled || isMatched}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        <div className="letter-case-column" aria-label="Lowercase letters">
          <div className="letter-case-list">
            {lowercaseLetters.map(letter => {
              const isMatched = usedLowercaseLetters.has(letter);
              return (
                <button
                  key={letter}
                  ref={node => {
                    rightRefs.current[letter] = node;
                  }}
                  type="button"
                  className={`letter-case-card${selectedLowercase === letter ? ' selected' : ''}${isMatched ? ' matched' : ''}`}
                  onClick={() => handleLowercaseSelect(letter)}
                  disabled={disabled || isMatched}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="letter-case-status" aria-live="polite" aria-label={statusMessage ?? undefined} />
    </div>
  );
}
