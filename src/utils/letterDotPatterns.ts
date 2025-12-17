export interface DotPoint {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  lift?: boolean; // start a new stroke here (pen up before this point)
}

// Simple, stroke-ordered dot guides for core capital letters.
// Coordinates are normalized; scale using the target canvas width/height.
export const letterDotPatterns: Record<string, DotPoint[]> = {
  A: [
    { x: 0.5, y: 0.1 },
    { x: 0.25, y: 0.9 },
    { x: 0.5, y: 0.1, lift: true },
    { x: 0.75, y: 0.9 },
    { x: 0.35, y: 0.55, lift: true },
    { x: 0.65, y: 0.55 },
  ],
  B: [
    { x: 0.25, y: 0.1 },
    { x: 0.25, y: 0.9 },
    { x: 0.25, y: 0.1, lift: true },
    { x: 0.65, y: 0.25 },
    { x: 0.25, y: 0.5 },
    { x: 0.65, y: 0.5 },
    { x: 0.65, y: 0.75 },
    { x: 0.25, y: 0.9 },
  ],
  C: [
    { x: 0.8, y: 0.2 },
    { x: 0.4, y: 0.1 },
    { x: 0.2, y: 0.35 },
    { x: 0.2, y: 0.7 },
    { x: 0.45, y: 0.9 },
    { x: 0.8, y: 0.75 },
  ],
  D: [
    { x: 0.25, y: 0.1 },
    { x: 0.25, y: 0.9 },
    { x: 0.25, y: 0.1, lift: true },
    { x: 0.6, y: 0.25 },
    { x: 0.7, y: 0.5 },
    { x: 0.6, y: 0.75 },
    { x: 0.25, y: 0.9 },
  ],
  E: [
    { x: 0.25, y: 0.1 },
    { x: 0.25, y: 0.9 },
    { x: 0.25, y: 0.1, lift: true },
    { x: 0.75, y: 0.1 },
    { x: 0.25, y: 0.5, lift: true },
    { x: 0.55, y: 0.5 },
    { x: 0.25, y: 0.9, lift: true },
    { x: 0.65, y: 0.9 },
  ],
  F: [
    { x: 0.25, y: 0.1 },
    { x: 0.25, y: 0.9 },
    { x: 0.25, y: 0.1, lift: true },
    { x: 0.65, y: 0.1 },
    { x: 0.25, y: 0.5, lift: true },
    { x: 0.55, y: 0.5 },
  ],
  G: [
    { x: 0.8, y: 0.25 },
    { x: 0.45, y: 0.1 },
    { x: 0.2, y: 0.35 },
    { x: 0.2, y: 0.7 },
    { x: 0.45, y: 0.9 },
    { x: 0.75, y: 0.75 },
    { x: 0.55, y: 0.55 },
    { x: 0.75, y: 0.55 },
  ],
  H: [
    { x: 0.25, y: 0.1 },
    { x: 0.25, y: 0.9 },
    { x: 0.25, y: 0.5, lift: true },
    { x: 0.75, y: 0.5 },
    { x: 0.75, y: 0.1, lift: true },
    { x: 0.75, y: 0.9 },
  ],
  K: [
    { x: 0.25, y: 0.1 },
    { x: 0.25, y: 0.9 },
    { x: 0.25, y: 0.5, lift: true },
    { x: 0.75, y: 0.1 },
    { x: 0.25, y: 0.5, lift: true },
    { x: 0.75, y: 0.9 },
  ],
  L: [
    { x: 0.25, y: 0.1 },
    { x: 0.25, y: 0.9 },
    { x: 0.75, y: 0.9, lift: true },
  ],
};
