import { useState, useEffect } from 'react'
import './App.css'

// Define types for our Hebrew letter items
interface HebrewLetterItem {
  letter: string;
  word: string;
  meaning: string;
  imageUrl: string;
}

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>לומדים לקרוא עברית</h1>
        <h2>Learning to Read Hebrew</h2>
      </header>
      <main>
        <LetterPictureMatch />
      </main>
      <footer>
        <p>Created with ❤️ for learning Hebrew</p>
      </footer>
    </div>
  )
}

// Component for the letter-picture matching exercise
function LetterPictureMatch() {
  // Hebrew alphabet letters and corresponding words
  // We'll start with a few basic letters and their corresponding words
  const [hebrewLetters] = useState<HebrewLetterItem[]>([
    { letter: 'א', word: 'אבא', meaning: 'father', imageUrl: '/images/abba.png' },
    { letter: 'ב', word: 'בית', meaning: 'house', imageUrl: '/images/bayit.png' },
    { letter: 'ג', word: 'גמל', meaning: 'camel', imageUrl: '/images/gamal.png' },
    { letter: 'ד', word: 'דג', meaning: 'fish', imageUrl: '/images/dag.png' },
  ]);

  const [currentLetter, setCurrentLetter] = useState<HebrewLetterItem | null>(null);
  const [options, setOptions] = useState<HebrewLetterItem[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  
  // Initialize the game when component mounts
  useEffect(() => {
    startNewRound();
    // Preload images and set loaded state
    hebrewLetters.forEach(item => {
      const img = new Image();
      img.src = item.imageUrl;
      img.onload = () => {
        setImagesLoaded(prev => ({ ...prev, [item.imageUrl]: true }));
      };
      img.onerror = () => {
        setImagesLoaded(prev => ({ ...prev, [item.imageUrl]: false }));
      };
    });
  }, []);

  // Start a new round of the game
  const startNewRound = () => {
    // Select a random letter
    const randomIndex = Math.floor(Math.random() * hebrewLetters.length);
    const selectedLetter = hebrewLetters[randomIndex];
    setCurrentLetter(selectedLetter);
    
    // Create options (including the correct one)
    const optionLetters = [...hebrewLetters];
    // Shuffle the options
    for (let i = optionLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionLetters[i], optionLetters[j]] = [optionLetters[j], optionLetters[i]];
    }
    // Take first 3 options (or fewer if we don't have enough letters)
    setOptions(optionLetters.slice(0, Math.min(3, optionLetters.length)));
    
    // Reset correct answer state
    setIsCorrect(null);
  };

  // Handle when an option is selected
  const handleOptionClick = (option: HebrewLetterItem) => {
    setAttempts(attempts + 1);
    
    if (currentLetter && option.letter === currentLetter.letter) {
      setIsCorrect(true);
      setScore(score + 1);
      
      // Play success sound (can be implemented later)
      // playSound('success');
      
      // Wait for a moment and then start a new round
      setTimeout(startNewRound, 2000);
    } else {
      setIsCorrect(false);
      // Play error sound (can be implemented later)
      // playSound('error');
    }
  };

  // Render image or placeholder based on image loading state
  const renderOptionContent = (option: HebrewLetterItem) => {
    const isLoaded = imagesLoaded[option.imageUrl];
    
    if (isLoaded) {
      return (
        <img 
          src={option.imageUrl} 
          alt={option.word} 
          className="option-image"
        />
      );
    } else {
      return (
        <div className="option-placeholder">
          <div className="placeholder-word">{option.word}</div>
          <div className="placeholder-meaning">{option.meaning}</div>
        </div>
      );
    }
  };

  return (
    <div className="letter-match-container">
      <div className="instruction">
        <p>התאם את האות לתמונה המתאימה</p>
        <p>Match the letter to the correct picture</p>
      </div>
      
      <div className="score-display">
        <div className="stars">
          {[...Array(score)].map((_, i) => (
            <span key={i} className="star">⭐</span>
          ))}
        </div>
      </div>
      
      {currentLetter && (
        <div className="game-content">
          <div className="current-letter">
            <h2>{currentLetter.letter}</h2>
          </div>
          
          <div className="options">
            {options.map((option, index) => (
              <div 
                key={index} 
                className={`option ${isCorrect !== null && option.letter === currentLetter.letter ? (isCorrect ? 'correct-option' : '') : ''}`}
                onClick={() => isCorrect === null && handleOptionClick(option)}
              >
                {renderOptionContent(option)}
                <p className="option-word">{option.word}</p>
              </div>
            ))}
          </div>
          
          {isCorrect !== null && (
            <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? 'נכון! 🎉' : 'נסה שוב! 🤔'}
            </div>
          )}
          
          <button 
            className="new-letter-button"
            onClick={startNewRound}
          >
            אות חדשה (New Letter)
          </button>
        </div>
      )}
    </div>
  );
}

export default App
