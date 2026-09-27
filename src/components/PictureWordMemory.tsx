import { useEffect, useState } from 'react';
import type { GermanLetterItem } from '../utils/imageUtils';
import { shuffleArray } from '../utils/arrayUtils';
import './PictureWordMemory.css';

interface MemoryCard {
  pairId: number;
  kind: 'picture' | 'word';
  item: GermanLetterItem;
}

interface PictureWordMemoryProps {
  items: GermanLetterItem[];
  onComplete: () => void;
}

export function PictureWordMemory({ items, onComplete }: PictureWordMemoryProps) {
  const [cards] = useState<MemoryCard[]>(() => shuffleArray(items.flatMap((item, pairId) => [
    { pairId, kind: 'picture' as const, item },
    { pairId, kind: 'word' as const, item },
  ])));
  const [firstIndex, setFirstIndex] = useState<number | null>(null);
  const [secondIndex, setSecondIndex] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);

  useEffect(() => {
    if (secondIndex === null) return;
    const timeoutId = window.setTimeout(() => {
      setFirstIndex(null);
      setSecondIndex(null);
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [secondIndex]);

  const revealCard = (index: number) => {
    if (firstIndex === index || secondIndex !== null || matchedPairs.includes(cards[index].pairId)) return;

    if (firstIndex === null) {
      setFirstIndex(index);
      return;
    }

    const first = cards[firstIndex];
    const second = cards[index];
    if (first.pairId === second.pairId && first.kind !== second.kind) {
      const nextMatchedPairs = [...matchedPairs, first.pairId];
      setMatchedPairs(nextMatchedPairs);
      setFirstIndex(null);
      if (nextMatchedPairs.length === items.length) onComplete();
    } else {
      setSecondIndex(index);
    }
  };

  return (
    <section className="picture-word-memory" aria-label="Picture and word memory game">
      <p className="memory-instruction">Find the picture and its word.</p>
      <p className="memory-progress" aria-live="polite">{matchedPairs.length} of {items.length} pairs found</p>
      <div className="memory-grid">
        {cards.map((card, index) => {
          const isMatched = matchedPairs.includes(card.pairId);
          const isRevealed = isMatched || index === firstIndex || index === secondIndex;
          return (
            <button
              key={`${card.pairId}-${card.kind}`}
              type="button"
              className={`memory-card${isRevealed ? ' memory-card--revealed' : ''}${isMatched ? ' memory-card--matched' : ''}`}
              aria-label={isRevealed
                ? `${card.kind === 'picture' ? 'Picture' : 'Word'}: ${card.item.word}`
                : `Hidden card ${index + 1}`}
              aria-pressed={isRevealed}
              disabled={isMatched || secondIndex !== null}
              onClick={() => revealCard(index)}
            >
              {isRevealed ? (
                card.kind === 'picture'
                  ? <img src={card.item.imageUrl} alt="" />
                  : <span className="memory-word">{card.item.word}</span>
              ) : <span className="memory-card-back" aria-hidden="true">?</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
