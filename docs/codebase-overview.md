# Mirror World Runner — Codebase Overview

## What Is This?

A 3D endless runner (Subway Surfer-style) with a gravity-flip twist. The player runs forward endlessly, dodging obstacles by switching between 3 lanes, jumping, sliding (ducking), or flipping gravity to run on the ceiling. Everything currently uses placeholder box primitives — no character models or scene assets yet.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| 3D Engine | Three.js via React Three Fiber (r3f) + Drei helpers |
| Post-processing | @react-three/postprocessing (Bloom) |
| State | Zustand (single store) |
| Animation | Framer Motion (available, not heavily used yet) |
| Build | Vite 7 |
| Package manager | pnpm |

## Project Structure

```
src/
├── main.tsx                          # Entry point, global styles
├── App.tsx                           # Canvas + HUD + TouchControls + MenuOverlay
└── game/
    ├── components/
    │   ├── GameLoop.tsx              # Top-level scene: wires Player, Obstacles, Environment, Camera, PostFX
    │   ├── Player.tsx                # Player mesh + per-frame movement, jump, slide, collision
    │   ├── Obstacles.tsx             # Renders active obstacles from store
    │   ├── Environment.tsx           # Ground tiles (instanced), lane markers, side walls, lights, fog
    │   ├── GameCamera.tsx            # Camera follows player, smoothly transitions on world flip
    │   └── PostFX.tsx                # Bloom effect via EffectComposer
    ├── config/
    │   ├── GameConfig.ts             # All tuning knobs (speeds, sizes, intervals, physics)
    │   ├── ThemeConfig.ts            # Cyber Neon color palette, bloom/fog settings
    │   └── AssetRegistry.ts          # Asset definitions (currently all box primitives)
    ├── core/
    │   └── GameState.ts              # Zustand store: phase, score, player state, obstacle pool
    ├── systems/
    │   ├── PlayerController.ts       # Keyboard + touch/swipe input handling
    │   ├── ObstacleSystem.ts         # Spawn, move, recycle obstacles + collision detection
    │   └── WorldFlipSystem.ts        # Gravity inversion: smooth Y + rotation interpolation
    └── ui/
        ├── HUD.tsx                   # Score display during gameplay
        ├── MenuOverlay.tsx           # Start/retry screen with game over scores
        └── TouchControls.tsx         # On-screen L/R + FLIP buttons for mobile
```

## Architecture Patterns

### ECS-like Separation
The code separates **components** (rendering), **systems** (logic hooks), **config** (data), and **core** (state). Systems are React hooks consumed inside components via `useFrame`.

### State Management
A single Zustand store (`useGameStore`) holds all game state:
- **Phase**: `menu` → `playing` → `dead` → (restart)
- **Player**: `lane` (0/1/2), `worldSide` (bottom/top), `isFlipping`, `isJumping`, `isSliding`
- **Obstacles**: array of `{ id, lane, z, world, variant, active }`
- **Progression**: `score`, `highScore`, `speed`, `distance`

### Game Loop
The r3f `useFrame` hook drives everything. There is no manual `requestAnimationFrame` — Three.js handles the render loop and each system reads/writes the Zustand store per frame.

## Core Mechanics (Implemented)

### 1. Lane Switching
3 lanes at X positions `[-2, 0, 2]`. Smooth lerp transition over 0.15s. Keyboard: left/right arrows or A/D. Touch: horizontal swipe.

### 2. Jumping
Sine-arc jump lasting 0.5s, reaching 1.5 units height. Cannot jump while sliding. Keyboard: up arrow or W. Touch: swipe up.

### 3. Sliding (Ducking)
Scales player Y to 40% for 0.5s. Cannot slide while jumping. Keyboard: down arrow or S. Touch: swipe down.

### 4. Gravity Flip (Mirror World)
The signature mechanic. Pressing Space (or FLIP button) inverts the player between the bottom surface (Y=0) and top surface (Y=6, the `mirrorGap`). The player rotates 180 degrees (upside-down on ceiling). Camera smoothly follows. Obstacles spawn on both surfaces.

### 5. Obstacle System
Three obstacle variants:
- **barrier**: standard blocker (1.0 x 1.2 x 0.4)
- **tall**: must slide under (0.8 x 2.0 x 0.4)
- **low**: must jump over (1.2 x 0.5 x 0.5)

Obstacles spawn at Z=-80, move toward the player, despawn at Z=10. Spawn interval decreases as distance increases (difficulty ramp). Obstacles spawn randomly on either world surface (bottom/top).

### 6. Collision Detection
AABB overlap check per frame between player hitbox and all active obstacles. Accounts for sliding (reduced height). On collision → `die()` → game over screen.

### 7. Speed Ramp & Scoring
Speed starts at 8, ramps by 0.08/sec to max 24. Score accrues at 10/sec scaled by current speed ratio.

## Visual Style

**Cyber Neon** theme:
- Dark background (#000011)
- Neon cyan player (#00f5ff) with emissive glow
- Neon pink/magenta obstacles (#ff2d95, #ff00ff)
- Neon yellow low obstacles (#f0ff00)
- Bloom post-processing (intensity 0.8)
- Fog from 20-80 units for depth fade
- Instanced ground tiles with grid-line emissive pattern
- Semi-transparent side walls with magenta glow
- Lane divider stripes (cyan, 50% opacity)

## What's NOT Implemented Yet

- **No 3D character model** — player is a glowing cyan box
- **No scene/environment assets** — ground is flat tiled boxes, no buildings/decorations
- **No animations** — no run cycle, jump animation, or slide animation
- **No particle effects** — no trail, no death explosion, no collectible sparkles
- **No collectibles/coins** — score is purely time-based
- **No sound/music**
- **No difficulty modes or level progression**
- **No persistent storage** — high score resets on page reload

## Asset System (Ready for Upgrade)

`AssetRegistry.ts` is explicitly designed to be swapped:
- Current: `type: 'primitive'` with box geometries
- Future: commented-out `type: 'model'` for GLTF/GLB loading
- Each game entity (player, 3 obstacle variants, ground tile) has a registry entry
- The rendering components read from `ASSETS.*` — swap the registry, visuals change everywhere

## Input System

| Input | Action |
|-------|--------|
| Left/Right Arrow, A/D | Switch lane |
| Up Arrow, W | Jump |
| Down Arrow, S | Slide/Duck |
| Space | Flip gravity |
| Swipe horizontal | Switch lane |
| Swipe up | Jump |
| Swipe down | Slide |
| On-screen L/R buttons | Switch lane |
| On-screen FLIP button | Flip gravity |

## Key Configuration Values (GameConfig.ts)

| Setting | Value | Notes |
|---------|-------|-------|
| Lane count | 3 | Positions: -2, 0, +2 |
| Initial speed | 8 | Units/sec |
| Max speed | 24 | Units/sec |
| Jump height | 1.5 | Units |
| Jump duration | 0.5s | |
| Slide scale | 0.4 | 40% height |
| Slide duration | 0.5s | |
| Mirror gap | 6 | Distance between floor and ceiling |
| Flip duration | 0.35s | |
| Obstacle spawn Z | -80 | Far ahead |
| Obstacle despawn Z | 10 | Behind player |
| Base spawn interval | 0.8s | Decreases with distance |
| Min spawn interval | 0.35s | |
| Player hitbox half-extents | [0.25, 0.35, 0.25] | |
