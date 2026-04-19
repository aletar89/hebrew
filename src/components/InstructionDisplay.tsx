// src/components/InstructionDisplay.tsx
import React from 'react';
import { ExerciseType } from '../state/gameReducer'; // Import the enum

// Displays instructions based on exercise type
export const InstructionDisplay: React.FC<{ exerciseType: ExerciseType }> = ({ exerciseType }) => (
    <div className="instruction">
        {exerciseType === ExerciseType.LETTER_TO_PICTURE && (
            <>
                <p>Ordne den Buchstaben dem passenden Bild zu</p>
                <p>Match the letter to the correct picture</p>
            </>
        )}
        {exerciseType === ExerciseType.RACE_TO_PICTURE && (
            <>
                <p>Steuere ins passende Bild fuer den Buchstaben</p>
                <p>Drive into the matching picture for the letter</p>
            </>
        )}
        {exerciseType === ExerciseType.WORD_TO_PICTURE && (
            <>
                <p>Ordne das Wort dem passenden Bild zu</p>
                <p>Match the word to the correct picture</p>
            </>
        )}
        {exerciseType === ExerciseType.PICTURE_TO_WORD && (
            <>
                <p>Ordne das Bild dem passenden Wort zu</p>
                <p>Match the picture to the correct word</p>
            </>
        )}
        {exerciseType === ExerciseType.PICTURE_TO_LETTER && (
            <>
                <p>Ordne das Bild dem passenden Buchstaben zu</p>
                <p>Match the picture to the correct letter</p>
            </>
        )}
        {exerciseType === ExerciseType.DRAWING && (
            <>
                <p>Zeichne den Buchstaben im grauen Rahmen nach</p>
                <p>Trace the letter shape inside the box</p>
            </>
        )}
        {exerciseType === ExerciseType.DOT_TRACING && (
            <>
                <p>Ziehe von Punkt zu Punkt in der richtigen Reihenfolge, starte beim gruenen Punkt</p>
                <p>Drag from the green dot to connect each point in order</p>
            </>
        )}
        {exerciseType === ExerciseType.CASE_MATCH && (
            <>
                <p>Verbinde die grossen Buchstaben mit den passenden kleinen Buchstaben</p>
                <p>Match each capital letter to its lowercase form</p>
            </>
        )}
    </div>
);
