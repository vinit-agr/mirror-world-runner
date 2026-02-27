# Mirror World Runner — Next Stage Design: Visual & Gameplay Upgrade

**Date**: 2026-02-28
**Approach**: Layer Cake (horizontal layers, each independently shippable)
**Theme**: Cyber Neon (retained from MVP)
**Asset Source**: Free GLTF/GLB models (Mixamo, Sketchfab, Kenney)

---

## Scope Summary

| Feature | Description |
|---------|-------------|
| Asset pipeline | Extend AssetRegistry to support GLTF models + preloading |
| Character model | Rigged humanoid with run/jump/slide/death animations |
| Environment | Cyberpunk city corridor with buildings, skybox, improved walls |
| Obstacle models | Themed obstacles replacing placeholder boxes |
| Duck/slide fix | Verify collision math, add slide animation, camera dip |
| Collectibles | Neon orbs with score bonus, spawn on both world surfaces |
| Particle effects | Player trail, flip burst, death shatter, collect sparkle |
| Sound & music | Synthwave BGM + SFX for all player actions |

---

## Layer 1: Asset Pipeline & Character Model

### Asset Pipeline Upgrade

The current `AssetRegistry.ts` defines primitives only. Extend it to support loaded models:

```typescript
// New type alongside existing AssetDef
export type ModelAssetDef = {
  type: 'model';
  url: string;
  scale: [number, number, number];
  animations?: string[]; // clip names expected in the GLTF
};

export type AnyAssetDef = AssetDef | ModelAssetDef;
```

- Create a `useGameAsset(key)` hook that returns a primitive mesh config or a loaded GLTF scene
- Use Drei's `useGLTF` for loading with caching + `useAnimations` for animation clips
- Add a loading/preload screen that loads all model assets before transitioning to the menu
- All GLTF files stored in `public/models/`

### Character Model

- Source: Mixamo rigged humanoid character (free download, FBX converted to GLB)
- Apply neon emissive materials to match the cyber theme (post-load material override)
- Required animations:
  - **Run**: idle loop while `phase === 'playing'`
  - **Jump**: triggered when `isJumping` becomes true
  - **Slide**: triggered when `isSliding` becomes true (character ducks low)
  - **Death**: played once on collision before showing game over
  - **Flip**: optional dedicated animation, or reuse existing 180-degree rotation
- Character replaces the cyan box in `Player.tsx` but keeps the same position/hitbox/collision logic
- Hitbox remains an invisible AABB — the visual model is independent of collision bounds

---

## Layer 2: Cyberpunk City Corridor Environment

### Scene Composition

The corridor wraps around the 3-lane track on both the floor and ceiling worlds:

**Buildings/Structures**
- Instanced box-based or GLTF buildings flanking both sides of the track (outside the lane area, X > 3 and X < -3)
- Neon emissive strips, panel textures, or simple colored faces to suggest windows/signs
- Scroll toward the player using the same distance-offset technique as ground tiles
- Mirrored on the ceiling side — when the player flips, the corridor is inverted

**Background**
- Dark city skyline skybox (Drei `<Environment>` or custom cube texture)
- Distant neon lights give depth beyond the fog cutoff

**Track Improvements**
- Lane dividers: upgrade from thin cyan boxes to neon light strips (slightly wider, brighter emissive)
- Side walls: replace transparent boxes with structured corridor walls — paneled surfaces with neon piping or edge lighting
- Optional: occasional holographic billboard meshes (flat planes with emissive textures) between buildings

**Implementation**
- New `Buildings.tsx` sub-component in `game/components/`
- Uses instanced meshes for performance (similar to existing `Ground` component)
- Skybox via Drei or a dark gradient sphere fallback
- `Environment.tsx` expanded to include buildings and improved walls

---

## Layer 3: Obstacles, Duck Fix & Collectibles

### Obstacle Model Variants

Replace the 3 placeholder box types with themed GLTF models:

| Variant | Current | New Visual | Behavior |
|---------|---------|-----------|----------|
| `barrier` | Pink box (1.0 x 1.2) | Neon energy barrier / holographic wall | Blocks lane, avoid by switching lanes or flipping |
| `tall` | Magenta box (0.8 x 2.0) | Vertical pillar / antenna tower | Must slide under (or flip to other surface) |
| `low` | Yellow box (1.2 x 0.5) | Ground pipe / hover-drone | Must jump over (or flip) |

Each loaded from `public/models/obstacles/` via the upgraded AssetRegistry.

### Duck/Slide Fix

The slide mechanic code exists but needs verification and polish:

1. **Collision verification**: The AABB check in `ObstacleSystem.ts:checkCollision` already accounts for `isSliding` by shrinking `pTop` to `playerY + hy * slideScale`. Verify that `tall` obstacles (ohy=1.0) clear the sliding player height at slideScale=0.4
2. **Slide animation**: Character model plays a slide/crouch animation during `isSliding`
3. **Camera dip**: Slight downward camera offset during slide for visual feedback
4. **Collision tune**: If math doesn't clear, adjust `slideScale` or `tall` obstacle height thresholds

### Collectibles System

New game entity type alongside obstacles:

**State** (Zustand additions):
```
coins: number
collectibles: Collectible[]   // { id, lane, z, world, active }
spawnCollectible(...)
collectItem(id)
```

**Spawning**:
- Spawn in patterns alongside obstacles (but never overlapping)
- Appear on both bottom and top surfaces — incentivizes gravity flips
- Some placed at jump height — incentivizes jumping even without obstacles

**Collection**:
- Proximity AABB check (more forgiving radius than obstacle collision)
- +50 score per orb (vs base 10/sec time score)
- Visual: neon orb (small glowing sphere, rotating, pulsing emissive)
- Sound: chime on collect

**Rendering**:
- New `Collectibles.tsx` component (similar structure to `Obstacles.tsx`)
- Instanced or individual meshes depending on count

---

## Layer 4: Particle Effects & Sound

### Particle Effects

Using Three.js point systems or Drei particle helpers:

| Effect | Trigger | Visual | Duration |
|--------|---------|--------|----------|
| Player trail | Continuous while running | Cyan particles streaming behind player | Persistent, fades over ~0.5s |
| Flip burst | On gravity flip | Magenta + cyan dual-color particle explosion at flip origin | 0.3s burst |
| Death shatter | On collision/death | Player fragments into neon shards scattering outward | 1s then fade |
| Collect sparkle | On orb pickup | Gold/yellow sparkle burst at collection point | 0.2s burst |
| Orb idle glow | Continuous on uncollected orbs | Subtle rotating sparkle/pulse around each orb | Persistent |

Implementation:
- New `Particles.tsx` component or per-component particle children
- Trail: ring buffer of point positions, updated per frame
- Bursts: pooled particle emitters, triggered by game events
- Subscribe to Zustand state changes for triggers

### Sound System

**Architecture**:
- Audio manager class (not React component) wrapping Web Audio API or Howler.js
- Singleton loaded at app start, exposes `play(sfxName)` and `setMusic(on/off)`
- Zustand additions: `musicEnabled: boolean`, `sfxEnabled: boolean`, `volume: number`
- Pause/mute toggle in menu UI

**Assets** (stored in `public/audio/`):

| Sound | Trigger | Style |
|-------|---------|-------|
| BGM | Game start, loops | Synthwave/retrowave loop |
| lane-switch | Lane change | Subtle whoosh |
| jump | Jump action | Rising synth tone |
| slide | Slide/duck action | Low swoosh |
| flip | Gravity flip | Deep bass drop with reverb |
| collect | Orb pickup | Bright chime/ding |
| death | Collision | Glitch/distortion crash |
| speed-up | Speed milestone | Subtle intensity cue |

Source: Free audio from Pixabay, Freesound, or OpenGameArt (CC0 licensed).

**Stretch goal**: BGM tempo subtly increases with game speed.

---

## Implementation Order (Layer Cake)

```
Layer 1: Asset Pipeline + Character
  ├── Extend AssetRegistry for GLTF
  ├── Add useGameAsset hook
  ├── Add preload/loading screen
  ├── Source + import character model (Mixamo)
  ├── Wire character into Player.tsx
  └── Animate: run, jump, slide, death

Layer 2: Environment + Obstacles
  ├── Buildings component (instanced, scrolling)
  ├── Skybox / background
  ├── Improved lane markers + walls
  ├── Source + import 3 obstacle models
  └── Wire into Obstacles.tsx

Layer 3: Gameplay: Duck + Collectibles
  ├── Verify slide collision math
  ├── Camera dip on slide
  ├── Collectible state + spawning logic
  ├── Collectible rendering
  └── Collection detection + score

Layer 4: Juice: Particles + Sound
  ├── Player trail particles
  ├── Flip burst effect
  ├── Death shatter effect
  ├── Collect sparkle
  ├── Audio manager
  ├── SFX for all actions
  ├── BGM loop
  └── Menu mute/volume controls
```

Each layer is independently shippable and testable. A playable, improved game exists after each layer.

---

## Files to Create/Modify

**New files**:
- `src/game/components/Buildings.tsx` — Corridor building meshes
- `src/game/components/Collectibles.tsx` — Collectible orbs
- `src/game/components/Particles.tsx` — Particle effect system
- `src/game/components/LoadingScreen.tsx` — Asset preloading UI
- `src/game/systems/CollectibleSystem.ts` — Collectible spawn/collect logic
- `src/game/systems/AudioManager.ts` — Sound playback singleton
- `src/game/hooks/useGameAsset.ts` — Asset loading hook
- `public/models/` — GLTF model files
- `public/audio/` — Sound files

**Modified files**:
- `src/game/config/AssetRegistry.ts` — Add model type + model definitions
- `src/game/core/GameState.ts` — Add coins, collectibles, audio state
- `src/game/components/Player.tsx` — Replace box with GLTF model + animations
- `src/game/components/Obstacles.tsx` — Replace boxes with GLTF models
- `src/game/components/Environment.tsx` — Add buildings, skybox, improved walls/markers
- `src/game/components/GameLoop.tsx` — Wire in new components
- `src/game/components/GameCamera.tsx` — Add slide camera dip
- `src/game/ui/HUD.tsx` — Add coin counter display
- `src/game/ui/MenuOverlay.tsx` — Add audio controls
- `src/App.tsx` — Add loading screen wrapper
