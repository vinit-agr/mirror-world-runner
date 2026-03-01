# Runner World Design

## Goal

Add a "Runner World" page — a Subway Surfer-style endless runner with 3 lanes, FBX character integration, urban-themed procedural world, obstacle spawning with AABB collision detection, and debug hitbox visualization. No gameplay (death/scoring) yet.

## Decisions

| Question | Decision |
|----------|----------|
| Camera | Third-person behind, slightly above |
| Character | Reuse existing FBX character system (dropdown picker, Run/Jump/Slide anims) |
| Visual style | Urban/subway — concrete ground, rail tracks, side buildings |
| Obstacles | 3 types (barrier, low rail, tall gate) + wireframe debug hitboxes |
| Code organization | Separate `src/runner-world/` module, independent from `src/game/` |
| Theme system | `RunnerWorldTheme` type for swappable environments |

## Architecture

### Module Structure

```
src/runner-world/
  config/
    RunnerConfig.ts          # Lane widths, speeds, obstacle sizing
    RunnerTheme.ts           # Theme type + urban theme
  core/
    RunnerState.ts           # Zustand store
  components/
    RunnerWorldPage.tsx      # Top-level page (HTML wrapper + Canvas)
    RunnerScene.tsx          # R3F scene composition
    RunnerPlayer.tsx         # FBX character with animation state machine
    RunnerEnvironment.tsx    # Ground, buildings, rails, lane markers
    RunnerObstacles.tsx      # Obstacle rendering + debug wireframes
    RunnerCamera.tsx         # Third-person follow camera
  systems/
    RunnerInput.ts           # Keyboard + touch input
    RunnerObstacleSystem.ts  # Spawn, move, despawn, collision detection
```

### State (Zustand)

```typescript
type RunnerState = {
  // Movement
  lane: number;              // 0, 1, 2
  isJumping: boolean;
  isSliding: boolean;
  speed: number;             // constant for now (no difficulty ramp)
  distance: number;          // accumulated scroll distance

  // Obstacles
  obstacles: RunnerObstacle[];
  nextObstacleId: number;

  // Character
  selectedCharacter: string;

  // Debug
  showHitboxes: boolean;

  // Actions
  setLane: (lane: number) => void;
  setJumping: (v: boolean) => void;
  setSliding: (v: boolean) => void;
  setSpeed: (s: number) => void;
  setDistance: (d: number) => void;
  setSelectedCharacter: (file: string) => void;
  toggleHitboxes: () => void;
  spawnObstacle: (obs: Omit<RunnerObstacle, 'id'>) => void;
  updateObstacle: (id: number, update: Partial<RunnerObstacle>) => void;
  deactivateObstacle: (id: number) => void;
};

type RunnerObstacle = {
  id: number;
  lane: number;
  z: number;
  variant: 'barrier' | 'low' | 'tall';
  active: boolean;
};
```

### Character Integration

Reuses the FBX loading pattern from `CharacterController.tsx`:

1. Fetch character manifest + animation manifest via existing Vite plugin
2. Render `<select>` dropdown for character picking
3. Load selected FBX + all animation clips
4. Compute per-animation ground offsets (multi-frame sampling via `getSkinnedMinY`)
5. Animation state machine:
   - **Run** — default loop
   - **Jump** — one-shot on jump input, returns to Run
   - **Slide** — one-shot on slide input, returns to Run
6. Character stays at fixed Z (z = 0). Only X position changes (lane switching via lerp)

### Camera

Third-person behind the character:
- Position: `(0, 3, 6)` relative to character
- LookAt: `(0, 1, -10)` — looking ahead down the track
- Slight smooth follow on X-axis when switching lanes
- Fixed — no rotation or zoom controls

### World Generation

Infinite scrolling via distance accumulation. All elements use instanced meshes.

**Ground:** Concrete-colored repeating tiles (instanced). Tile repositioned to front when it scrolls past camera.

**Track rails:** Two thin rail lines at lane boundaries. Instanced, scroll with distance.

**Lane dividers:** Subtle dashed lines between lanes. Low opacity.

**Side buildings:** Box geometries on left and right sides, randomized heights (2–6 units). Varying colors from theme palette. Scroll with distance. Repositioned when they pass behind camera. Start as simple boxes — swap for GLTF models later.

### Obstacles

Three types matching player evasion moves:

| Type | Size (w×h×d) | Evasion | Description |
|------|-------------|---------|-------------|
| Barrier | 1.0 × 1.2 × 0.4 | Switch lane | Mid-height block |
| Low rail | 1.2 × 0.5 × 0.5 | Slide | Low obstacle, slide under |
| Tall gate | 0.8 × 2.0 × 0.4 | Jump | Tall obstacle, jump over |

Spawning:
- Spawn at z = -80, despawn at z > 10
- Random lane and variant selection
- Fixed spawn interval (no difficulty ramping yet)
- Object pool with cleanup threshold

Debug visualization:
- Wireframe boxes (`<lineSegments>`) showing exact AABB hitboxes
- Player also gets a wireframe hitbox
- Toggle with keyboard shortcut or UI button
- Console log on collision detection

### Collision Detection

AABB overlap test (same pattern as Mirror World Runner):
- Player hitbox: centered at lane X position, adjusted height for slide
- Obstacle hitbox: based on variant dimensions
- Runs every frame during distance accumulation
- On collision: `console.log` with obstacle details (no death/score)

### Theme System

```typescript
type RunnerWorldTheme = {
  ground: { color: string; emissive: string };
  buildings: { colors: string[]; emissive: string };
  rails: { color: string };
  lanes: { color: string; opacity: number };
  obstacles: Record<'barrier' | 'low' | 'tall', { color: string; emissive: string }>;
  sky: { color: string };
  fog: { color: string; near: number; far: number };
  lighting: {
    ambient: number;
    directional: { color: string; intensity: number };
  };
};
```

Initial "Urban" theme: concrete grays, steel-colored rails, warm brownish/beige building tones, muted earth-tone obstacles.

### Input

Same pattern as Mirror World Runner's `PlayerController.ts`:
- **Arrow Left / 'a':** Move left lane
- **Arrow Right / 'd':** Move right lane
- **Arrow Up / 'w':** Jump
- **Arrow Down / 's':** Slide
- Touch swipes: horizontal for lanes, vertical for jump/slide
- **'h':** Toggle hitbox debug visualization

### Routing

Add `'runner-world'` to the `Route` type in `src/router.ts`. Add card to Home page. Lazy-load `RunnerWorldPage` in `App.tsx`.

## Not In Scope (Future)

- Gameplay (death, scoring, high scores, game-over screen)
- Difficulty ramping (speed increase over time)
- Coins/collectibles
- Sound effects
- GLTF obstacle/building models
- Multiple themes (only urban for now)
- Particle effects
- Power-ups
