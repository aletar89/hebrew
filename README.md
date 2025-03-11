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

The app requires images for each Hebrew letter. Place them in the `/public/images/` directory using Hebrew words as filenames:

- Words starting with א (Aleph): `אדם.png`, `ארנב.jpg`, `אריה.png`
- Words starting with ב (Beth): `בית.png`, `בננה.jpg`, `בקבוק.png`
- Words starting with ג (Gimel): `גמל.png`, `גלידה.jpg`, `גן.png`
- Words starting with ד (Dalet): `דג.png`, `דלת.jpg`, `דוב.png`

### Supported Image Formats:
- png, jpg, jpeg, gif, svg, webp, and other standard web image formats

### Supported Hebrew Letters:
- א (Aleph)
- ב (Beth)
- ג (Gimel)
- ד (Dalet)
- ה (He)
- ו (Vav)
- ז (Zayin)
- ח (Heth)
- ט (Teth)
- י (Yod)
- כ (Kaph)
- ל (Lamed)
- מ (Mem)
- נ (Nun)
- ס (Samekh)
- ע (Ayin)
- פ (Pe)
- צ (Tsadi)
- ק (Qoph)
- ר (Resh)
- ש (Shin)
- ת (Tav)

### Features:
- The app automatically detects available images and only uses letters that have images
- Images are named with Hebrew words, making it intuitive to manage content
- Multiple images per letter are supported (just add more words starting with that letter)
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

Examples:
- aleph1.png - An image starting with the letter א (Aleph), e.g., a picture of אבא
- aleph2.jpg - Another image starting with א, e.g., a picture of אריה
- beth1.webp - An image starting with the letter ב (Beth), e.g., a picture of בית
