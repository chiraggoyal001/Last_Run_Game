# LAST RUN — Agent Constitution

> Read by Antigravity at the start of every task.

## Project Identity
- **Name**: LAST RUN
- **Type**: Web Arcade Game (React + Canvas/Phaser + TypeScript + Vite)
- **Status**: Active Development

## Quality Standards
- Follow GSD loop: TASK → PLAN → EXECUTE → VERIFY → COMMIT → LEARN
- Physics must update with fixed delta-time step (60Hz) to ensure identical behavior across high refresh rate displays (60/90/120/144Hz) and mobile.
- Zero external audio assets: all sound effects and sirens must be procedurally synthesized using Web Audio API to prevent 404s and offline failures.
- Responsive mobile & desktop support: on-screen touch overlay and keyboard input.
- Fair procedural generation: guarantee at least one escape corridor through any spawned obstacle group.

## Learned Patterns ⚡
- Dynamic siren volume attenuation based on inverse distance from nearest police car.
- Multi-quadrant angular test for "BOXED IN!" trapping avoids false positives when police cluster on one flank.
- Fixed 60Hz physics accumulator decoupling physics from rendering frames.

## Known Traps ⚠️
- Web Audio AudioContext requires user interaction gesture before audio playback; ensure auto-resume on first tap or keypress.
- Mobile touch events need `touch-action: none` on game container to prevent scroll/zoom interruptions.
