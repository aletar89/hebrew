import { useEffect } from 'react';
import { ReadingChunk } from '../data/readingChunks';
import { playChunkAudio } from '../utils/audioUtils';
import './ChunkSoundChoice.css';

interface ChunkSoundChoiceProps {
  mode: 'sound-to-text' | 'text-to-sound';
  targetChunk: ReadingChunk;
  options: ReadingChunk[];
  selectedChunkId: string | null;
  disabled?: boolean;
  onSelect: (chunk: ReadingChunk) => void;
}

const SpeakerIcon = () => (
  <svg
    aria-hidden="true"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
    <path
      d="M15 9.5c1 .75 1.5 1.75 1.5 2.5s-.5 1.75-1.5 2.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M17.5 7.5c1.5 1.25 2.25 2.75 2.25 4.5s-.75 3.25-2.25 4.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 6 9 17l-5-5"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function ChunkSoundChoice({
  mode,
  targetChunk,
  options,
  selectedChunkId,
  disabled = false,
  onSelect,
}: ChunkSoundChoiceProps) {
  useEffect(() => {
    if (mode === 'sound-to-text') {
      void playChunkAudio(targetChunk.audioKey);
    }
  }, [mode, targetChunk.audioKey]);

  const isTextToSound = mode === 'text-to-sound';

  return (
    <div className="chunk-sound-choice">
      <div className="chunk-prompt">
        {isTextToSound ? (
          <div className="chunk-written-prompt">{targetChunk.text}</div>
        ) : (
          <button
            type="button"
            className="chunk-main-audio-button"
            onClick={() => void playChunkAudio(targetChunk.audioKey)}
            aria-label="Chunk anhoeren"
          >
            <SpeakerIcon />
          </button>
        )}
      </div>

      <div className={isTextToSound ? 'chunk-sound-options' : 'chunk-text-options'}>
        {options.map(option => {
          const isSelected = selectedChunkId === option.id;
          const isCorrect = option.id === targetChunk.id;
          const resultClass = selectedChunkId
            ? isCorrect
              ? ' correct-option'
              : isSelected
                ? ' incorrect-option'
                : ''
            : '';

          if (isTextToSound) {
            return (
              <div
                key={option.id}
                className={`chunk-sound-answer${resultClass}`}
              >
                <button
                  type="button"
                  className="chunk-sound-option"
                  onClick={() => void playChunkAudio(option.audioKey)}
                  aria-label={`Ton ${option.text} anhoeren`}
                >
                  <SpeakerIcon />
                </button>
                <button
                  type="button"
                  className="chunk-select-option"
                  disabled={disabled}
                  onClick={() => onSelect(option)}
                  aria-label={`Ton ${option.text} auswaehlen`}
                >
                  <CheckIcon />
                </button>
              </div>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              className={`chunk-text-option${resultClass}`}
              disabled={disabled}
              onClick={() => onSelect(option)}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
