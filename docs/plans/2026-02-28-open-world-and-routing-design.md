# Open World Scene + Multi-Page Routing Design

**Date:** 2026-02-28
**Status:** Approved
**Branch:** character-test

## Overview

Transform the single-page app into a multi-experiment platform with hash-based routing. Add a new "Open World" experiment where the Mixamo character can run freely through a procedurally generated infinite terrain. Support swappable world themes, starting with a low-poly stylized field.

## Routing

Hash-based routing (`/#/path`), no external library. Three routes:

| Route | Page | Description |
|---|---|---|
| `/#/` | Home | Cards linking to each experiment |
| `/#/character-test` | Character Test | Existing animation test scene |
| `/#/open-world` | Open World | New: character in infinite procedural terrain |
| `/#/mirror-world-runner` | Mirror World Runner | Original runner game from `src/game/` |

Implementation: a `useHashRoute()` hook that reads `window.location.hash` and returns the current route. App.tsx renders the matching page component.

## Open World Scene

### Character Controller
- Third-person follow camera (spring-based, orbits behind)
- WASD/arrow keys move character relative to camera facing direction
- Character mesh rotates smoothly to face movement direction
- Reuses the same FBX character + dynamic animation loading from character-test
- Animations: Idle (standing still), Run (moving), Jump (up/space), Slide (down/S)

### Terrain System (Chunk-Based)
- World divided into chunks, each 32x32 units
- Active radius: ~5 chunks around player (160x160 visible area)
- Chunks generated deterministically from position seed (same position = same terrain)
- Chunks outside active radius are disposed (geometry/materials freed)
- Ground: flat planes with subtle height variation via simplex noise

### World Theme Interface
Each world theme exports:
```typescript
type WorldTheme = {
  name: string;
  groundColor: string;
  skyColors: { top: string; bottom: string };
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  generateChunkObjects: (chunkX: number, chunkZ: number, chunkSize: number) => ChunkObject[];
};

type ChunkObject = {
  type: 'tree' | 'rock' | 'grass' | 'custom';
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
};
```

### Low-Poly Field (Starter Theme)
All procedural geometry, no external assets:
- **Ground:** Green planes, subtle noise-based height, light/dark patches
- **Trees:** Brown cylinder trunk + green cone canopy (randomized height/width)
- **Rocks:** Displaced icosahedron geometry, grey-brown tones
- **Grass:** Small green triangles or flat planes scattered densely
- **Mountains:** Distant static cone/pyramid shapes on horizon ring
- **Sky:** Gradient dome (light blue to white), soft directional sun

### Camera
- Third-person: offset behind and above character (~3 units back, ~2 units up)
- Spring follow (smooth tracking, slight lag)
- Mouse drag to orbit around character (horizontal only, clamped vertical)
- Scroll to adjust distance (min 2, max 12)

## Home Page

Simple card grid:
- "Character Test" — test animations in isolation
- "Open World" — run through procedural terrain
- "Mirror World Runner" — the original cyberpunk runner game

Minimal styling, dark background, each card shows name + one-line description. Click navigates to `/#/route`.

## File Structure

```
src/
  router.ts                    # useHashRoute() hook
  App.tsx                      # Route switch
  Home.tsx                     # Home page with cards

  character-test/              # (existing, unchanged)
  game/                        # (existing runner game, unchanged)

  open-world/
    OpenWorldPage.tsx           # Canvas + UI wrapper
    OpenWorldScene.tsx          # 3D scene setup (lights, sky, terrain, character)
    CharacterController.tsx     # Third-person character with movement
    TerrainManager.tsx          # Chunk generation/disposal system
    Chunk.tsx                   # Single chunk component
    worldStore.ts               # Zustand store (player position, active chunks)
    themes/
      types.ts                  # WorldTheme interface
      lowPolyField.ts           # Starter theme: procedural trees, rocks, grass
    procedural/
      noise.ts                  # Simplex noise utility
      trees.ts                  # Procedural tree geometry generator
      rocks.ts                  # Procedural rock geometry generator
```

## Non-Goals (for now)
- Physics/collision with terrain objects
- NPCs or enemies
- Inventory or game mechanics
- Terrain height that affects character Y position
- Realistic textures or external model assets
