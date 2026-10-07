# LAST RUN — Project Coding Standards

> Extends Global GEMINI.md. Rules specific to LAST RUN.

## Project Overview
- **Name**: LAST RUN
- **Tagline**: How long can you stay ahead?
- **Genre**: Fast top-down 2D arcade endless survival car chase
- **Target Platforms**: Web (Desktop Keyboard + Mobile Touch), static hosting on Netlify.
- **Status**: Active Implementation

## Architectural Rules
- **Game Engine**: Modular top-down vehicle physics engine running at fixed 60Hz delta updates with smooth interpolation, coupled with HTML5 Canvas / WebGL rendering.
- **Audio**: 100% procedural Web Audio API synthesis in `SoundManager`. No external audio files or broken network assets. Dynamic siren system reacts to distance and swarm intensity.
- **Controls**: Zero-gas automatic forward movement. Steer left/right, brake to slow down, hold brake to reverse (capped at 45% forward speed).
- **Steering**: Dynamically modulated by speed — sharper at low speeds, wider turning radius at top speed.
- **Damage & Cooldown**: Obstacles deal 10 HP. Police vehicles deal archetype damage. 0.5s invulnerability cooldown prevents multi-frame health melting.
- **Procedural World**: Chunk-based endless terrain generation ahead, disposal behind. Guarantees fair escape routes.
- **Boxed-In System**: Trapped meter fills when surrounded across multiple angular sectors at low speed (<25% max speed) for 1.8 seconds.
- **UI & HUD**: React overlay for cleanly styled menus, HUD, game over modals, and mobile touch pads.
- **Deployment**: Static build output in `dist/`, configured for Netlify deployment via `netlify.toml`.
