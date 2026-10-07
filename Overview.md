# LAST RUN — Endless Police Chase

#game #arcade #web #typescript #react #vite #netlify

## 🎯 Game Vision
**LAST RUN** is a fast arcade survival game played on an endless procedural landscape. The player's car drives automatically (no accelerator button). The player controls steering, braking, and holding brake to reverse. Police vehicles of 4 distinct archetypes pursue, intercept, flank, and attempt to box in the player.

## 🕹️ Controls
- **Desktop**: `A` / `D` or `←` / `→` (Steer), `Space` (Brake / Reverse), `P` / `Esc` (Pause), `R` (Restart).
- **Mobile**: Ergonomic on-screen touch steering pads (Left/Right) and Brake/Reverse pedal.

## 🏗️ Architecture
- **Language**: TypeScript
- **Framework**: React + Vite
- **Engine**: Top-down Vehicle Kinematics with 60Hz fixed accumulator, HTML5 Canvas / WebGL rendering
- **Audio**: Web Audio API Procedural Synthesizer (Zero asset dependencies)
- **Deployment**: Netlify Static Hosting (`netlify.toml`)
- **Persistence**: `localStorage` (Best Score, Longest Survival Time, Stats)
