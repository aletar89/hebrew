# Review Suggestions

## Goal

Shift the app from a worksheet-like experience toward a game that works for pre-reading children. The game should rely on visual rhythm, sound, reward anticipation, and repetition rather than written instruction.

## High-Priority Suggestions

### 1. Remove child-facing copy as a primary instruction layer

- Reduce or remove the text-heavy instructions in the main game flow.
- Let the task explain itself through layout:
  - large prompt object
  - oversized answer targets
  - obvious start points for tracing
  - animated empty slots for scramble
- Keep any text-based explanation for adults in the stats or settings area only.

### 2. Use audio as the main guidance system

- Automatically play the target audio for listening-based rounds more often.
- Keep the replay control large and prominent.
- Add short success and retry sounds so feedback is immediate even without reading.

### 3. Make progress visible through rewards

- Keep the top progress bar tied to the existing confetti milestones.
- Show exactly which confetti color is coming next.
- Build anticipation near milestones with stronger glow or pulse states.
- Treat the rainbow end-of-session reward as the climax of the run.

### 4. Add a streak system

- Show streak as a visual row of stars, dots, beads, or flames.
- Increase celebration intensity when the streak grows.
- Keep failure handling soft so the child stays engaged rather than feeling punished.

### 5. Increase game variety

- Re-enable more exercise types over time.
- Consider unlocking harder modes after a few successful rounds rather than showing everything immediately.
- Keep the exercise mix dynamic enough that the session does not feel repetitive.

## Selection and Difficulty Tuning

### 6. Bias letter selection harder toward weak items

- Low-success letters should appear much more often than mastered ones.
- Recent mistakes should get a strong immediate boost.
- High-confidence letters should be actively suppressed once they are consistently correct.
- The weighting model should be reflected in the stats UI so the displayed probabilities match actual behavior.

### 7. Separate learner-facing progress from adult-facing analytics

- Keep the detailed stats table for adults.
- Use a simpler learner-facing layer for the child:
  - progress bar
  - streak
  - score
  - reward anticipation

## Interaction Improvements

### 8. Improve success pacing

- Avoid making every success feel identical.
- Use a short sequence:
  - answer confirmed
  - quick visual celebration
  - progress marker advances
  - next round begins

### 9. Make wrong-answer feedback more useful without text

- Highlight the correct answer more clearly.
- Use subtle motion or sound to indicate “try again.”
- In tracing and drawing, show visual correction cues instead of explanatory copy.

### 10. Make tracing and drawing feel more game-like

- Show progress rings or completion meters.
- Emphasize the starting point and direction.
- Let children see improvement across attempts through cleaner visual feedback.

## UI and Accessibility

### 11. Replace clickable `div` answer targets with real buttons

- This improves keyboard support and general interaction quality.
- It also makes the UI easier to reason about for focus and accessibility behavior.

### 12. Add `aria-live` for feedback and keep reduced-motion support

- Success and retry states should be announced accessibly.
- Motion-heavy reward effects should respect `prefers-reduced-motion`.

### 13. Clean up the global styling foundation

- Remove or neutralize the leftover Vite default theme in `src/index.css`.
- Keep a single consistent visual system so the app does not inherit conflicting styles.

## Suggested Implementation Order

1. Progress bar tied to confetti milestones
2. Streak indicator
3. Remove child-facing instruction copy from the main flow
4. Improve audio guidance and feedback sounds
5. Re-enable more exercise types
6. Continue tuning weighted review selection
