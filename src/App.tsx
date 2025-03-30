import { useState } from 'react'
import './App.css'
import { processImageModules } from './utils/imageUtils';
import { LetterPictureMatch } from './components/LetterPictureMatchGame';

// --- Build-time Data Processing ---

// Update import.meta.glob syntax for Vite
const imageModules = import.meta.glob(
    '/public/images/*.{png,jpg,jpeg,gif,svg,webp}',
    { 
        // eager: true, as: 'url' // Deprecated syntax
        eager: true, 
        query: '?url',         // New syntax: request the URL
        import: 'default'       // New syntax: import the default export (the URL string)
    }
) as Record<string, string>; // Assert the type since Vite's type might be broader

const initialLetterGroups = processImageModules(imageModules);
const initialAvailableLetters = Object.keys(initialLetterGroups).filter(letter =>
  initialLetterGroups[letter] && initialLetterGroups[letter].length > 0
);

console.log('Initial Letter Groups:', initialLetterGroups);
console.log('Initial Available Letters:', initialAvailableLetters);

// --- Main App Component (Container for the game) ---

function App() {
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [selectionCounter, setSelectionCounter] = useState(0);

  const handleTogglePause = () => setIsRecordingPaused(prev => !prev);
  const triggerStatsUpdate = () => setSelectionCounter(count => count + 1);

  return (
    <div className="app-container">
      <LetterPictureMatch
        letterGroups={initialLetterGroups}
        availableLetters={initialAvailableLetters}
        isRecordingPaused={isRecordingPaused}
        onSelectionSave={triggerStatsUpdate}
        onTogglePause={handleTogglePause}
        updateTrigger={selectionCounter}
      />
    </div>
  );
}

export default App
