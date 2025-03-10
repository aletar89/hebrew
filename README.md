# Hebrew Reading App for Children

A React-based application designed to help 4-year-old children learn to read Hebrew through interactive matching exercises.

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
cd hebrew-reading-app
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

1. A Hebrew letter is displayed
2. The child must match the letter to a picture of an object that starts with that letter
3. Immediate feedback is provided

## Image Requirements

The app requires images for each Hebrew letter. Place them in the `/public/images/` directory with the following naming convention:

- `abba.png` - for א (Alef) - picture of a father
- `bayit.png` - for ב (Bet) - picture of a house 
- `gamal.png` - for ג (Gimel) - picture of a camel
- `dag.png` - for ד (Dalet) - picture of a fish

## Development Roadmap

- Add more Hebrew letters and corresponding images
- Implement audio pronunciation
- Add different types of exercises (word recognition, letter tracing, etc.)
- Add progress tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
