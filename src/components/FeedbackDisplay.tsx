// src/components/FeedbackDisplay.tsx
import React, { useEffect, useMemo, useState } from 'react';

const successImageModules = import.meta.glob(
    '/public/feedback/success/*.{png,jpg,jpeg,gif,svg,webp}',
    {
        eager: true,
        query: '?url',
        import: 'default',
    }
) as Record<string, string>;

const failureImageModules = import.meta.glob(
    '/public/feedback/failure/*.{png,jpg,jpeg,gif,svg,webp}',
    {
        eager: true,
        query: '?url',
        import: 'default',
    }
) as Record<string, string>;

const successImages = Object.values(successImageModules);
const failureImages = Object.values(failureImageModules);

const getRandomImage = (images: string[]) => {
    if (images.length === 0) {
        return null;
    }

    return images[Math.floor(Math.random() * images.length)];
};

// Displays feedback message
export const FeedbackDisplay: React.FC<{ isCorrect: boolean | null }> = ({ isCorrect }) => {
    const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);
    const feedbackImages = useMemo(
        () => isCorrect ? successImages : failureImages,
        [isCorrect]
    );

    useEffect(() => {
        if (isCorrect === null) {
            setCharacterImageUrl(null);
            return;
        }

        setCharacterImageUrl(getRandomImage(feedbackImages));
    }, [feedbackImages, isCorrect]);

    if (isCorrect === null) return null; // No feedback yet

    return (
        <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            {characterImageUrl && (
                <img
                    src={characterImageUrl}
                    alt=""
                    className="feedback-character"
                    aria-hidden="true"
                />
            )}
            <span className="feedback-message">
                {isCorrect ? 'Richtig! Gut gemacht' : 'Nicht richtig... Versuch es nochmal'}
            </span>
        </div>
    );
};
