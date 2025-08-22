# German Reading App for Children

A React-based application designed to help 4-year-old children learn to read German through interactive matching exercises.

## Features

- Letter-to-picture matching exercises
- Audio pronunciation (planned)
- Interactive feedback
- Child-friendly interface

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```
git clone <repository-url>
cd german-reading-app
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## How to Use

The app currently includes a letter-to-picture matching exercise where:

1. A German letter is displayed
2. The child must match the letter to a picture of an object that starts with that letter
3. Immediate feedback is provided

## Image Requirements

The app requires images for each German letter. Place them in the `/public/images/` directory using German words as filenames:

- Words starting with A: `Apfel.png`, `Auto.jpg`, `Auge.png`
- Words starting with B: `Banane.png`, `Brot.jpg`, `Berg.png`
- Words starting with C: `Clown.png`, `Computer.jpg`, `Café.png`
- Words starting with D: `Drache.png`, `Dino.jpg`, `Dose.png`

### Supported Image Formats:
- png, jpg, jpeg, gif, svg, webp, and other standard web image formats

### Supported German Letters:
- A
- B
- C
- D
- E
- F
- G
- H
- I
- J
- K
- L
- M
- N
- O
- P
- Q
- R
- S
- T
- U
- V
- W
- X
- Y
- Z

### Features:
- The app automatically detects available images and only uses letters that have images
- Images are named with German words, making it intuitive to manage content
- Multiple images per letter are supported (just add more words starting with that letter)
- Multiple image formats are supported (png, jpg, jpeg, gif, svg, webp)
- Images should be clear, child-friendly illustrations that a 4-year-old can easily recognize

## Development Roadmap

- Add more German letters and corresponding images
- Implement audio pronunciation
- Add different types of exercises (word recognition, letter tracing, etc.)
- Add progress tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

Examples:
- a1.png - An image starting with the letter A, e.g., a picture of Apfel
- b1.jpg - An image starting with the letter B, e.g., a picture of Brot
