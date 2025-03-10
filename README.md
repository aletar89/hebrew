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

The app requires images for each Hebrew letter. Place them in the `/public/images/` directory using the following naming convention:

- `aleph1.png`, `aleph2.jpg`, etc. - for the letter א (Aleph)
- `beth1.webp`, `beth2.gif`, etc. - for the letter ב (Beth)
- `gimel1.svg`, `gimel2.png`, etc. - for the letter ג (Gimel)
- `daleth1.jpeg`, `daleth2.jpg`, etc. - for the letter ד (Dalet)

### Supported Image Formats:
- png, jpg, jpeg, gif, svg, webp, and other standard web image formats

### Supported Hebrew Letter Names:
- aleph (א)
- beth (ב)
- gimel (ג)
- daleth (ד)
- he (ה)
- vav (ו)
- zayin (ז)
- heth (ח)
- teth (ט)
- yod (י)
- kaph (כ)
- lamed (ל)
- mem (מ)
- nun (נ)
- samekh (ס)
- ayin (ע)
- pe (פ)
- tsadi (צ)
- qoph (ק)
- resh (ר)
- shin (ש)
- tav (ת)

### Features:
- The app automatically detects available images and only uses letters that have images
- You can add multiple images for each letter (using different numbers), and the app will randomly select them during gameplay
- Multiple image formats are supported (png, jpg, jpeg, gif, svg, webp)
- Images should be clear, child-friendly illustrations that a 4-year-old can easily recognize

## Development Roadmap

- Add more Hebrew letters and corresponding images
- Implement audio pronunciation
- Add different types of exercises (word recognition, letter tracing, etc.)
- Add progress tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
