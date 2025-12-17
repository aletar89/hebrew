# Repository Guidelines

## Project Structure & Module Organization
- `src/main.tsx` mounts the React 19/Vite app and pulls global styles from `src/index.css` and `src/App.css`.
- `src/components/` holds UI pieces for the reading games (drag-and-drop letters, canvases, stats, feedback); each component keeps a matching `.css` file for scoped styles.
- `src/utils/` contains shared logic (image detection, drawing helpers, spaced repetition, storage) with tests like `src/utils/imageUtils.test.ts`.
- `src/state/gameReducer.ts` keeps reducer/state helpers.
- `public/images/` is the content directory for German letter images (e.g., `Apfel.png`, `Banane.jpg`); other static files live in `public/`. Build artifacts output to `dist/`.

## Build, Test, and Development Commands
```bash
npm install            # Install dependencies
npm run dev            # Start Vite dev server at :5173
npm run build          # Type-check (tsc -b) then Vite production build
npm run preview        # Preview the production build locally
npm run lint           # ESLint across TS/TSX
npm run test           # Vitest test suite
```

## Coding Style & Naming Conventions
- Use TypeScript (`.ts/.tsx`) with React function components; prefer hooks over classes.
- Component files and exported components use `PascalCase`; utilities and hooks use `camelCase`. Keep CSS filenames aligned with component names.
- Indent with two spaces, keep imports sorted by scope (external, internal), and avoid unused exports; ESLint (`eslint.config.js`) enforces React hooks and refresh safety rules.
- Place user-provided images in `public/images/` using German nouns that start with the target letter; multiple images per letter are fine.

## Testing Guidelines
- Use Vitest; place unit tests next to the code as `*.test.ts`. Focus on deterministic logic in `src/utils/` and interaction-heavy components.
- Prefer small, behavior-driven cases over broad snapshots; mock DOM APIs sparingly since components run under Vite’s jsdom defaults.
- Run `npm run test -- --watch` during development; ensure new utilities include coverage before merging.

## Commit & Pull Request Guidelines
- Follow the existing Git history style: short, imperative messages (`Add images and enable F, G`).
- For PRs, include: purpose and scope, screenshots/GIFs for UI changes, test commands and results, and notes on new assets added to `public/images/`.
- Link related issues when available, and keep diffs focused (one feature/fix per PR). Avoid committing `dist/` or `node_modules/`; ensure `npm run lint` and `npm run test` pass.
