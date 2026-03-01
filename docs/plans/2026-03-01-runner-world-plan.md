# Runner World Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Subway Surfer-style endless runner page with 3 lanes, FBX character integration, urban-themed procedural world, obstacle spawning with AABB collision detection, and debug hitbox wireframes — no gameplay (death/scoring) yet.

**Architecture:** Separate `src/runner-world/` module with its own config, state, components, and systems. Reuses the FBX character loading + animation grounding pattern from Open World. Follows the same R3F + Zustand patterns established in Mirror World Runner.

**Tech Stack:** React, React Three Fiber (R3F), Three.js, Zustand, FBXLoader, Vite

---

### Task 1: Routing + Page Shell

Add the `runner-world` route and create a minimal page that renders a Canvas with a placeholder.

**Files:**
- Modify: `src/router.ts`
- Modify: `src/App.tsx`
- Modify: `src/Home.tsx`
- Create: `src/runner-world/RunnerWorldPage.tsx`

**Step 1: Add route type**

In `src/router.ts`, add `'runner-world'` to the `Route` type union and the `valid` array:

```typescript
// src/router.ts
export type Route = '' | 'character-test' | 'open-world' | 'mirror-world-runner' | 'runner-world';

function parseHash(): Route {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const valid: Route[] = ['character-test', 'open-world', 'mirror-world-runner', 'runner-world'];
  return valid.includes(hash as Route) ? (hash as Route) : '';
}
```

**Step 2: Create minimal page component**

Create `src/runner-world/RunnerWorldPage.tsx`:

```tsx
import { Canvas } from '@react-three/fiber';
import { BackButton } from '../BackButton';

export default function RunnerWorldPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#1a1a2e', touchAction: 'none' }}>
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </Canvas>
      <BackButton />
    </div>
  );
}
```

**Step 3: Register lazy route in App.tsx**

In `src/App.tsx`, add the lazy import and route rendering:

```tsx
// Add with other lazy imports at top:
const RunnerWorldPage = lazy(() => import('./runner-world/RunnerWorldPage'));

// Add inside the <Suspense> block, after the open-world line:
{route === 'runner-world' && <RunnerWorldPage />}
```

**Step 4: Add Home card**

In `src/Home.tsx`, add a card entry to the `experiments` array:

```typescript
{
  title: 'Runner World',
  description: 'Subway Surfer-style endless runner with FBX characters',
  route: 'runner-world',
  color: '#604020',
},
```

**Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

Open browser, navigate to Home. You should see a "Runner World" card. Click it → see an orange box in a Canvas.

**Step 6: Commit**

```bash
git add src/router.ts src/App.tsx src/Home.tsx src/runner-world/RunnerWorldPage.tsx
git commit -m "feat(runner-world): add route, page shell, and home card"
```

---

### Task 2: Config + Theme + State Store

Create the configuration, theme, and Zustand state store for Runner World.

**Files:**
- Create: `src/runner-world/config/RunnerConfig.ts`
- Create: `src/runner-world/config/RunnerTheme.ts`
- Create: `src/runner-world/core/RunnerState.ts`

**Step 1: Create RunnerConfig.ts**

Create `src/runner-world/config/RunnerConfig.ts`:

```typescript
export const RUNNER = {
  // Lanes
  laneCount: 3,
  laneWidth: 2.0,
  lanePositions: [-2.0, 0, 2.0],

  // Speed (constant for now — no difficulty ramp)
  speed: 12,

  // Player movement
  laneSwitchDuration: 0.15,   // seconds to lerp between lanes
  jumpDuration: 0.6,          // seconds in air
  slideDuration: 0.6,         // seconds sliding

  // Player hitbox (half-extents)
  playerHitboxHalf: [0.3, 0.5, 0.3] as [number, number, number],
  playerSlideHitboxHalfY: 0.25,   // shorter Y when sliding

  // Obstacles
  obstacleSpawnInterval: 1.2,     // seconds between spawns
  obstacleStartZ: -100,           // spawn distance ahead
  obstacleDespawnZ: 10,           // remove after passing
  obstaclePoolSize: 30,

  // Obstacle dimensions [width, height, depth]
  obstacleBarrier: [1.0, 1.2, 0.4] as [number, number, number],
  obstacleLow:     [1.2, 0.5, 0.5] as [number, number, number],
  obstacleTall:    [0.8, 2.0, 0.4] as [number, number, number],

  // World tiles
  tileLength: 4,
  tileCount: 28,

  // Buildings
  buildingCount: 16,         // per side
  buildingMinHeight: 3,
  buildingMaxHeight: 8,
  buildingWidth: 2.5,
  buildingDepth: 3,
  buildingOffsetX: 5.5,      // distance from center

  // Camera
  cameraOffset: [0, 3.5, 7] as [number, number, number],
  cameraLookAt: [0, 1, -15] as [number, number, number],
} as const;
```

**Step 2: Create RunnerTheme.ts**

Create `src/runner-world/config/RunnerTheme.ts`:

```typescript
export type RunnerWorldTheme = {
  name: string;
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

export const URBAN_THEME: RunnerWorldTheme = {
  name: 'Urban',
  ground: { color: '#3a3a3a', emissive: '#1a1a1a' },
  buildings: {
    colors: ['#8b7355', '#a0522d', '#696969', '#556b2f', '#4a4a6a', '#705040'],
    emissive: '#0a0a0a',
  },
  rails: { color: '#888888' },
  lanes: { color: '#ffffff', opacity: 0.15 },
  obstacles: {
    barrier: { color: '#cc4444', emissive: '#661111' },
    low:     { color: '#ccaa22', emissive: '#665511' },
    tall:    { color: '#4444cc', emissive: '#111166' },
  },
  sky: { color: '#87ceeb' },
  fog: { color: '#c8d8e8', near: 30, far: 100 },
  lighting: {
    ambient: 0.4,
    directional: { color: '#ffffff', intensity: 0.8 },
  },
};
```

**Step 3: Create RunnerState.ts**

Create `src/runner-world/core/RunnerState.ts`:

```typescript
import { create } from 'zustand';
import { RUNNER } from '../config/RunnerConfig';

export type ObstacleVariant = 'barrier' | 'low' | 'tall';

export type RunnerObstacle = {
  id: number;
  lane: number;
  z: number;
  variant: ObstacleVariant;
  active: boolean;
};

type RunnerState = {
  // Movement
  lane: number;
  isJumping: boolean;
  isSliding: boolean;
  speed: number;
  distance: number;

  // Obstacles
  obstacles: RunnerObstacle[];
  nextObstacleId: number;

  // Character
  selectedCharacter: string;
  characterError: string | null;

  // Debug
  showHitboxes: boolean;

  // Collisions detected this frame (for debug display)
  collisionCount: number;

  // Actions
  setLane: (lane: number) => void;
  setJumping: (v: boolean) => void;
  setSliding: (v: boolean) => void;
  setSpeed: (s: number) => void;
  setDistance: (d: number) => void;
  setSelectedCharacter: (file: string) => void;
  setCharacterError: (err: string | null) => void;
  toggleHitboxes: () => void;
  setCollisionCount: (n: number) => void;
  spawnObstacle: (obs: Omit<RunnerObstacle, 'id'>) => void;
  updateObstacle: (id: number, patch: Partial<RunnerObstacle>) => void;
  deactivateObstacle: (id: number) => void;
};

export const useRunnerStore = create<RunnerState>((set, get) => ({
  lane: 1,
  isJumping: false,
  isSliding: false,
  speed: RUNNER.speed,
  distance: 0,

  obstacles: [],
  nextObstacleId: 0,

  selectedCharacter: 'default.fbx',
  characterError: null,

  showHitboxes: true,  // on by default for debug
  collisionCount: 0,

  setLane: (lane) => set({ lane: Math.max(0, Math.min(2, lane)) }),
  setJumping: (v) => set({ isJumping: v }),
  setSliding: (v) => set({ isSliding: v }),
  setSpeed: (s) => set({ speed: s }),
  setDistance: (d) => set({ distance: d }),
  setSelectedCharacter: (file) => set({ selectedCharacter: file, characterError: null }),
  setCharacterError: (err) => set({ characterError: err }),
  toggleHitboxes: () => set((s) => ({ showHitboxes: !s.showHitboxes })),
  setCollisionCount: (n) => set({ collisionCount: n }),

  spawnObstacle: (obs) => {
    const id = get().nextObstacleId;
    set((s) => ({
      obstacles: [...s.obstacles, { ...obs, id }],
      nextObstacleId: id + 1,
    }));
  },

  updateObstacle: (id, patch) =>
    set((s) => ({
      obstacles: s.obstacles.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),

  deactivateObstacle: (id) =>
    set((s) => ({
      obstacles: s.obstacles.map((o) => (o.id === id ? { ...o, active: false } : o)),
    })),
}));
```

**Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 5: Commit**

```bash
git add src/runner-world/config/RunnerConfig.ts src/runner-world/config/RunnerTheme.ts src/runner-world/core/RunnerState.ts
git commit -m "feat(runner-world): add config, urban theme, and zustand state store"
```

---

### Task 3: Input System

Create the keyboard + touch input system for lane switching, jump, and slide.

**Files:**
- Create: `src/runner-world/systems/RunnerInput.ts`

**Step 1: Create RunnerInput.ts**

Create `src/runner-world/systems/RunnerInput.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useRunnerStore } from '../core/RunnerState';
import { RUNNER } from '../config/RunnerConfig';

type SwipeState = { startX: number; startY: number; startTime: number };

const SWIPE_THRESHOLD = 30;
const SWIPE_TIME = 300;

export function useRunnerInput() {
  const swipeRef = useRef<SwipeState | null>(null);

  const moveLeft = useCallback(() => {
    const { lane, setLane } = useRunnerStore.getState();
    setLane(lane - 1);
  }, []);

  const moveRight = useCallback(() => {
    const { lane, setLane } = useRunnerStore.getState();
    setLane(lane + 1);
  }, []);

  const jump = useCallback(() => {
    const { isJumping, isSliding, setJumping } = useRunnerStore.getState();
    if (isJumping || isSliding) return;
    setJumping(true);
    setTimeout(() => useRunnerStore.getState().setJumping(false), RUNNER.jumpDuration * 1000);
  }, []);

  const slide = useCallback(() => {
    const { isSliding, isJumping, setSliding } = useRunnerStore.getState();
    if (isSliding || isJumping) return;
    setSliding(true);
    setTimeout(() => useRunnerStore.getState().setSliding(false), RUNNER.slideDuration * 1000);
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
          moveRight();
          break;
        case 'ArrowUp':
        case 'w':
          e.preventDefault();
          jump();
          break;
        case 'ArrowDown':
        case 's':
          e.preventDefault();
          slide();
          break;
        case 'h':
          useRunnerStore.getState().toggleHitboxes();
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveLeft, moveRight, jump, slide]);

  // Touch / swipe
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      swipeRef.current = { startX: t.clientX, startY: t.clientY, startTime: Date.now() };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!swipeRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - swipeRef.current.startX;
      const dy = t.clientY - swipeRef.current.startY;
      const dt = Date.now() - swipeRef.current.startTime;
      swipeRef.current = null;

      if (dt > SWIPE_TIME) return;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return;

      if (absDx > absDy) {
        if (dx < 0) moveLeft();
        else moveRight();
      } else {
        if (dy < 0) jump();
        else slide();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [moveLeft, moveRight, jump, slide]);

  return { moveLeft, moveRight, jump, slide };
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/runner-world/systems/RunnerInput.ts
git commit -m "feat(runner-world): add keyboard and touch input system"
```

---

### Task 4: Camera

Create the third-person follow camera.

**Files:**
- Create: `src/runner-world/components/RunnerCamera.tsx`

**Step 1: Create RunnerCamera.tsx**

Create `src/runner-world/components/RunnerCamera.tsx`:

```tsx
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useRunnerStore } from '../core/RunnerState';
import { RUNNER } from '../config/RunnerConfig';

export function RunnerCamera() {
  const { camera } = useThree();
  const currentX = useRef(0);

  useFrame(() => {
    const { lane } = useRunnerStore.getState();
    const targetX = RUNNER.lanePositions[lane] ?? 0;

    // Smooth follow on X axis when switching lanes
    currentX.current = MathUtils.lerp(currentX.current, targetX * 0.3, 0.05);

    const [ox, oy, oz] = RUNNER.cameraOffset;
    const [lx, ly, lz] = RUNNER.cameraLookAt;

    camera.position.set(currentX.current + ox, oy, oz);
    camera.lookAt(currentX.current + lx, ly, lz);
  });

  return null;
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/runner-world/components/RunnerCamera.tsx
git commit -m "feat(runner-world): add third-person follow camera"
```

---

### Task 5: Environment (Ground + Rails + Buildings)

Create the scrolling urban environment with instanced ground tiles, rail lines, lane markers, and side buildings.

**Files:**
- Create: `src/runner-world/components/RunnerEnvironment.tsx`

**Step 1: Create RunnerEnvironment.tsx**

Create `src/runner-world/components/RunnerEnvironment.tsx`:

```tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, Color } from 'three';
import type { InstancedMesh } from 'three';
import { useRunnerStore } from '../core/RunnerState';
import { RUNNER } from '../config/RunnerConfig';
import { URBAN_THEME } from '../config/RunnerTheme';

export function RunnerEnvironment() {
  const theme = URBAN_THEME;

  return (
    <>
      <Ground theme={theme} />
      <LaneMarkers theme={theme} />
      <Rails theme={theme} />
      <Buildings theme={theme} />
      <ambientLight intensity={theme.lighting.ambient} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={theme.lighting.directional.intensity}
        color={theme.lighting.directional.color}
        castShadow
      />
      <fog attach="fog" args={[theme.fog.color, theme.fog.near, theme.fog.far]} />
    </>
  );
}

function Ground({ theme }: { theme: typeof URBAN_THEME }) {
  const ref = useRef<InstancedMesh>(null!);
  const count = RUNNER.tileCount;
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(theme.ground.color), [theme]);

  useFrame(() => {
    const { distance } = useRunnerStore.getState();
    const offset = distance % RUNNER.tileLength;

    for (let i = 0; i < count; i++) {
      const z = -i * RUNNER.tileLength + offset;
      dummy.position.set(0, -0.05, z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[12, 0.1, RUNNER.tileLength - 0.05]} />
      <meshStandardMaterial
        color={color}
        emissive={theme.ground.emissive}
        emissiveIntensity={0.15}
        metalness={0.1}
        roughness={0.9}
      />
    </instancedMesh>
  );
}

function LaneMarkers({ theme }: { theme: typeof URBAN_THEME }) {
  const ref = useRef<InstancedMesh>(null!);
  const markerPositionsX = [-1, 1];
  const stripeCount = 20;
  const totalCount = markerPositionsX.length * stripeCount;
  const dummy = useMemo(() => new Object3D(), []);

  useFrame(() => {
    const { distance } = useRunnerStore.getState();
    const offset = distance % 4;
    let idx = 0;

    for (const mx of markerPositionsX) {
      for (let i = 0; i < stripeCount; i++) {
        const z = -i * 4 + offset;
        dummy.position.set(mx, 0.01, z);
        dummy.updateMatrix();
        ref.current.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, totalCount]}>
      <boxGeometry args={[0.08, 0.02, 1.5]} />
      <meshStandardMaterial
        color={theme.lanes.color}
        transparent
        opacity={theme.lanes.opacity}
      />
    </instancedMesh>
  );
}

function Rails({ theme }: { theme: typeof URBAN_THEME }) {
  const ref = useRef<InstancedMesh>(null!);
  // Rails at outer lane edges: x = -3 and x = 3
  const railPositionsX = [-3, 3];
  const segmentCount = 24;
  const totalCount = railPositionsX.length * segmentCount;
  const dummy = useMemo(() => new Object3D(), []);

  useFrame(() => {
    const { distance } = useRunnerStore.getState();
    const offset = distance % RUNNER.tileLength;
    let idx = 0;

    for (const rx of railPositionsX) {
      for (let i = 0; i < segmentCount; i++) {
        const z = -i * RUNNER.tileLength + offset;
        dummy.position.set(rx, 0.05, z);
        dummy.updateMatrix();
        ref.current.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, totalCount]}>
      <boxGeometry args={[0.06, 0.08, RUNNER.tileLength - 0.1]} />
      <meshStandardMaterial color={theme.rails.color} metalness={0.8} roughness={0.2} />
    </instancedMesh>
  );
}

function Buildings({ theme }: { theme: typeof URBAN_THEME }) {
  const leftRef = useRef<InstancedMesh>(null!);
  const rightRef = useRef<InstancedMesh>(null!);
  const count = RUNNER.buildingCount;
  const dummy = useMemo(() => new Object3D(), []);

  // Generate stable random heights and color indices
  const buildingData = useMemo(() => {
    const data: { height: number; colorIndex: number }[] = [];
    for (let i = 0; i < count; i++) {
      // Use deterministic pseudo-random based on index
      const seed = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const rand = seed - Math.floor(seed);
      const height = RUNNER.buildingMinHeight + rand * (RUNNER.buildingMaxHeight - RUNNER.buildingMinHeight);
      const colorIndex = Math.floor(rand * theme.buildings.colors.length) % theme.buildings.colors.length;
      data.push({ height, colorIndex });
    }
    return data;
  }, [count, theme]);

  // Pre-set colors per instance
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const c = new Color(theme.buildings.colors[buildingData[i].colorIndex]);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [count, buildingData, theme]);

  useFrame(() => {
    const { distance } = useRunnerStore.getState();
    const spacing = RUNNER.buildingDepth + 1.0;
    const totalLen = count * spacing;
    const offset = distance % totalLen;

    for (let i = 0; i < count; i++) {
      const { height } = buildingData[i];
      const z = -i * spacing + offset;

      // Left side
      dummy.position.set(-RUNNER.buildingOffsetX, height / 2, z);
      dummy.scale.set(RUNNER.buildingWidth, height, RUNNER.buildingDepth);
      dummy.updateMatrix();
      leftRef.current.setMatrixAt(i, dummy.matrix);

      // Right side
      dummy.position.set(RUNNER.buildingOffsetX, height / 2, z);
      dummy.updateMatrix();
      rightRef.current.setMatrixAt(i, dummy.matrix);
    }

    leftRef.current.instanceMatrix.needsUpdate = true;
    rightRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={leftRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial vertexColors={false} color={theme.buildings.colors[0]} emissive={theme.buildings.emissive} emissiveIntensity={0.1} />
      </instancedMesh>
      <instancedMesh ref={rightRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial vertexColors={false} color={theme.buildings.colors[1]} emissive={theme.buildings.emissive} emissiveIntensity={0.1} />
      </instancedMesh>
    </>
  );
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/runner-world/components/RunnerEnvironment.tsx
git commit -m "feat(runner-world): add scrolling urban environment with ground, rails, lanes, and buildings"
```

---

### Task 6: Obstacle System + Rendering + Debug Wireframes

Create the obstacle spawning/movement system, rendering component, and AABB collision detection with debug wireframe visualization.

**Files:**
- Create: `src/runner-world/systems/RunnerObstacleSystem.ts`
- Create: `src/runner-world/components/RunnerObstacles.tsx`

**Step 1: Create RunnerObstacleSystem.ts**

Create `src/runner-world/systems/RunnerObstacleSystem.ts`:

```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRunnerStore, type ObstacleVariant } from '../core/RunnerState';
import { RUNNER } from '../config/RunnerConfig';

const VARIANTS: ObstacleVariant[] = ['barrier', 'tall', 'low'];

export function useRunnerObstacleSystem() {
  const spawnTimer = useRef(0);

  useFrame((_, delta) => {
    const state = useRunnerStore.getState();
    const { speed } = state;

    // Accumulate distance
    state.setDistance(state.distance + speed * delta);

    // Spawn logic — fixed interval
    spawnTimer.current += delta;
    if (spawnTimer.current >= RUNNER.obstacleSpawnInterval) {
      spawnTimer.current = 0;

      const lane = Math.floor(Math.random() * RUNNER.laneCount);
      const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];

      state.spawnObstacle({
        lane,
        z: RUNNER.obstacleStartZ,
        variant,
        active: true,
      });
    }

    // Move + despawn obstacles
    const obstacles = useRunnerStore.getState().obstacles;
    for (const obs of obstacles) {
      if (!obs.active) continue;
      const newZ = obs.z + speed * delta;
      if (newZ > RUNNER.obstacleDespawnZ) {
        state.deactivateObstacle(obs.id);
      } else {
        state.updateObstacle(obs.id, { z: newZ });
      }
    }

    // Prune inactive obstacles periodically
    const all = useRunnerStore.getState().obstacles;
    if (all.length > RUNNER.obstaclePoolSize * 2) {
      useRunnerStore.setState({ obstacles: all.filter((o) => o.active) });
    }
  });
}

/** Get the half-extents for an obstacle variant. */
export function getObstacleHalfExtents(variant: ObstacleVariant): [number, number, number] {
  const dims = variant === 'barrier' ? RUNNER.obstacleBarrier
    : variant === 'low' ? RUNNER.obstacleLow
    : RUNNER.obstacleTall;
  return [dims[0] / 2, dims[1] / 2, dims[2] / 2];
}

/**
 * Check all active obstacles for collision with the player.
 * Returns the number of collisions detected (for debug display).
 */
export function checkRunnerCollision(
  playerLane: number,
  playerY: number,
  isSliding: boolean,
): number {
  const obstacles = useRunnerStore.getState().obstacles;
  const px = RUNNER.lanePositions[playerLane];
  const [hx, hy, hz] = RUNNER.playerHitboxHalf;
  const effectiveHy = isSliding ? RUNNER.playerSlideHitboxHalfY : hy;

  let collisions = 0;

  for (const obs of obstacles) {
    if (!obs.active) continue;

    const ox = RUNNER.lanePositions[obs.lane];
    const [ohx, ohy, ohz] = getObstacleHalfExtents(obs.variant);

    // Obstacle Y center is at half its height (sitting on ground)
    const obstacleY = ohy;

    // Player bounds
    const pBottom = playerY - effectiveHy;
    const pTop = playerY + effectiveHy;

    // Obstacle bounds
    const oBottom = obstacleY - ohy;
    const oTop = obstacleY + ohy;

    // AABB overlap
    if (
      Math.abs(px - ox) < hx + ohx &&
      Math.abs(obs.z) < hz + ohz &&
      pTop > oBottom &&
      pBottom < oTop
    ) {
      collisions++;
    }
  }

  return collisions;
}
```

**Step 2: Create RunnerObstacles.tsx**

Create `src/runner-world/components/RunnerObstacles.tsx`:

```tsx
import { useRunnerStore, type RunnerObstacle } from '../core/RunnerState';
import { useRunnerObstacleSystem, getObstacleHalfExtents } from '../systems/RunnerObstacleSystem';
import { RUNNER } from '../config/RunnerConfig';
import { URBAN_THEME } from '../config/RunnerTheme';
import * as THREE from 'three';
import { useMemo } from 'react';

function ObstacleMesh({ obs }: { obs: RunnerObstacle }) {
  const theme = URBAN_THEME;
  const dims = obs.variant === 'barrier' ? RUNNER.obstacleBarrier
    : obs.variant === 'low' ? RUNNER.obstacleLow
    : RUNNER.obstacleTall;
  const [sx, sy, sz] = dims;
  const style = theme.obstacles[obs.variant];

  const x = RUNNER.lanePositions[obs.lane];
  const y = sy / 2; // Sitting on ground

  return (
    <mesh position={[x, y, obs.z]}>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial
        color={style.color}
        emissive={style.emissive}
        emissiveIntensity={0.3}
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}

function DebugWireframe({ obs }: { obs: RunnerObstacle }) {
  const [hx, hy, hz] = getObstacleHalfExtents(obs.variant);
  const x = RUNNER.lanePositions[obs.lane];
  const y = hy; // center Y

  const geometry = useMemo(() => new THREE.BoxGeometry(hx * 2, hy * 2, hz * 2), [hx, hy, hz]);

  return (
    <lineSegments position={[x, y, obs.z]}>
      <edgesGeometry args={[geometry]} />
      <lineBasicMaterial color="#ff0000" />
    </lineSegments>
  );
}

export function PlayerDebugWireframe({ playerX, playerY, isSliding }: {
  playerX: number;
  playerY: number;
  isSliding: boolean;
}) {
  const showHitboxes = useRunnerStore((s) => s.showHitboxes);
  const [hx, hy, hz] = RUNNER.playerHitboxHalf;
  const effectiveHy = isSliding ? RUNNER.playerSlideHitboxHalfY : hy;

  const geometry = useMemo(
    () => new THREE.BoxGeometry(hx * 2, effectiveHy * 2, hz * 2),
    [hx, effectiveHy, hz],
  );

  if (!showHitboxes) return null;

  return (
    <lineSegments position={[playerX, playerY, 0]}>
      <edgesGeometry args={[geometry]} />
      <lineBasicMaterial color="#00ff00" />
    </lineSegments>
  );
}

export function RunnerObstacles() {
  useRunnerObstacleSystem();

  const obstacles = useRunnerStore((s) => s.obstacles);
  const showHitboxes = useRunnerStore((s) => s.showHitboxes);

  return (
    <>
      {obstacles.map((obs) =>
        obs.active && (
          <group key={obs.id}>
            <ObstacleMesh obs={obs} />
            {showHitboxes && <DebugWireframe obs={obs} />}
          </group>
        ),
      )}
    </>
  );
}
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 4: Commit**

```bash
git add src/runner-world/systems/RunnerObstacleSystem.ts src/runner-world/components/RunnerObstacles.tsx
git commit -m "feat(runner-world): add obstacle spawning, AABB collision, and debug wireframes"
```

---

### Task 7: Runner Player (FBX Character)

Create the player component that loads FBX characters, handles animation state machine (Run/Jump/Slide), lane switching, jump arc, and collision checking — reusing the character loading pattern from `CharacterController.tsx`.

**Files:**
- Create: `src/runner-world/components/RunnerPlayer.tsx`

**Step 1: Create RunnerPlayer.tsx**

Create `src/runner-world/components/RunnerPlayer.tsx`.

This is the largest component. It reuses patterns from `src/open-world/CharacterController.tsx`:
- FBX loading with bone prefix detection and remapping
- Root motion stripping
- Per-animation ground offset computation (multi-frame sampling)
- T-pose flash prevention (add to scene only after anim is playing)

Key differences from `CharacterController.tsx`:
- No WASD movement — character stays at fixed Z, only X changes (lane lerp)
- Character always faces forward (negative Z direction)
- Animation state machine: Run → Jump (one-shot) → Run, Run → Slide (one-shot) → Run
- Jump adds a sinusoidal Y arc
- Collision detection called every frame

```tsx
import { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useRunnerStore } from '../core/RunnerState';
import { RUNNER } from '../config/RunnerConfig';
import { getSkinnedMinY } from '../../utils/skinnedBounds';
import { checkRunnerCollision } from '../systems/RunnerObstacleSystem';
import { PlayerDebugWireframe } from './RunnerObstacles';

const MODEL_SCALE = 0.01;

type AnimEntry = { name: string; file: string };

export function RunnerPlayer() {
  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const prevAction = useRef<string>('');
  const oneShotPlaying = useRef<string | null>(null);
  const loadedCharFile = useRef<string>('');
  const groundOffsetsRef = useRef<Record<string, number>>({});

  // Smooth lane position
  const currentX = useRef<number>(RUNNER.lanePositions[1]);
  // Jump arc
  const jumpT = useRef(0);
  // Track current player Y for collision/debug
  const playerY = useRef(0.5);

  const { scene } = useThree();

  const loadCharacter = useCallback(async (charFile: string) => {
    if (!groupRef.current || loadedCharFile.current === charFile) return;

    // Clean up previous model
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }
    actionsRef.current = {};
    prevAction.current = '';
    oneShotPlaying.current = null;
    groundOffsetsRef.current = {};

    if (modelRef.current) {
      groupRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    const loader = new FBXLoader();
    const charUrl = `/models/characters/${encodeURIComponent(charFile)}`;
    let fbx: THREE.Group;
    try {
      fbx = await loader.loadAsync(charUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[RunnerPlayer] Failed to load "${charFile}":`, msg);
      if (msg.includes('version not supported')) {
        useRunnerStore.getState().setCharacterError(
          `"${charFile.replace('.fbx', '')}" uses FBX 6.x format which isn't supported. Re-export from Mixamo as FBX Binary (7.4).`,
        );
      } else {
        useRunnerStore.getState().setCharacterError(`Failed to load: ${msg}`);
      }
      loadedCharFile.current = '';
      return;
    }

    fbx.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    // Detect bone prefix (mixamorig, mixamorig7, etc.)
    let charBonePrefix = '';
    fbx.traverse((child) => {
      if (charBonePrefix) return;
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = child as THREE.SkinnedMesh;
        for (const bone of sm.skeleton?.bones || []) {
          const match = bone.name.match(/^(mixamorig\d*)/);
          if (match) {
            charBonePrefix = match[1];
            return;
          }
        }
      }
    });

    // Set up mixer and load animations
    const mixer = new THREE.AnimationMixer(fbx);
    mixerRef.current = mixer;

    let entries: AnimEntry[];
    try {
      const res = await fetch('/models/anims/manifest.json');
      entries = (await res.json()).animations;
    } catch {
      console.error('[RunnerPlayer] Failed to load animation manifest');
      return;
    }

    const actions: Record<string, THREE.AnimationAction> = {};
    for (const entry of entries) {
      try {
        const anim = await loader.loadAsync(`/models/anims/${entry.file}`);
        if (anim.animations.length > 0) {
          const clip = anim.animations[0];
          clip.name = entry.name;

          // Remap bone names
          if (charBonePrefix && charBonePrefix !== 'mixamorig') {
            for (const track of clip.tracks) {
              track.name = track.name.replace(/^mixamorig(?!\d)/, charBonePrefix);
            }
          }

          // Strip horizontal root motion
          for (const track of clip.tracks) {
            if (track.name.endsWith('.position')) {
              const boneName = track.name.split('.')[0];
              if (/Hips|Root/i.test(boneName)) {
                const values = track.values;
                for (let i = 0; i < values.length; i += 3) {
                  values[i] = 0;     // X
                  values[i + 2] = 0; // Z
                }
              }
            }
          }
          actions[entry.name] = mixer.clipAction(clip);
        }
      } catch (err) {
        console.warn(`[RunnerPlayer] Skipping ${entry.file}:`, err);
      }
    }

    actionsRef.current = actions;

    // Compute per-animation ground offsets (same pattern as CharacterController)
    const GROUND_SAMPLES = 5;
    const groundOffsets: Record<string, number> = {};
    for (const [name, action] of Object.entries(actions)) {
      mixer.stopAllAction();
      action.reset().play();
      action.setEffectiveWeight(1);

      const duration = action.getClip().duration;
      let worst = Infinity;
      for (let s = 0; s <= GROUND_SAMPLES; s++) {
        mixer.setTime((s / GROUND_SAMPLES) * duration);
        fbx.updateMatrixWorld(true);
        const y = getSkinnedMinY(fbx);
        if (y < worst) worst = y;
      }
      groundOffsets[name] = worst === Infinity ? 0 : worst;
    }
    groundOffsetsRef.current = groundOffsets;

    // Start with Run animation (character is always running)
    mixer.stopAllAction();
    const startAnim = actions['Run'] ?? actions['Idle'];
    const startName = actions['Run'] ? 'Run' : 'Idle';
    if (startAnim) {
      startAnim.reset().play();
      startAnim.setEffectiveWeight(1);
      prevAction.current = startName;
    }
    mixer.update(0);

    // Apply scale + ground offset, add to scene
    const runOffset = groundOffsets[startName] ?? 0;
    fbx.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
    fbx.position.y = -runOffset * MODEL_SCALE;

    // Face forward (negative Z)
    fbx.rotation.y = Math.PI;

    groupRef.current.add(fbx);
    modelRef.current = fbx;
    loadedCharFile.current = charFile;

    // Handle one-shot animation finish
    mixer.addEventListener('finished', (e: { action: THREE.AnimationAction }) => {
      const name = e.action.getClip().name;
      if (name === oneShotPlaying.current) {
        oneShotPlaying.current = null;
        // Return to Run
        e.action.fadeOut(0.2);
        if (actions['Run']) {
          actions['Run'].reset().fadeIn(0.2).play();
          prevAction.current = 'Run';
        }
        // Update ground offset
        if (modelRef.current) {
          const offset = groundOffsetsRef.current['Run'] ?? 0;
          modelRef.current.position.y = -offset * MODEL_SCALE;
        }
      }
    });
  }, []);

  // Load character on selection change
  const selectedCharacter = useRunnerStore((s) => s.selectedCharacter);
  useEffect(() => {
    // Fetch character manifest
    fetch('/models/characters/manifest.json')
      .then((res) => res.json())
      .then((data) => {
        const chars = data.characters;
        // Store available characters (for the selector UI)
        // Use first available if selectedCharacter not found
        const found = chars.find((c: { file: string }) => c.file === selectedCharacter);
        if (!found && chars.length > 0) {
          useRunnerStore.getState().setSelectedCharacter(chars[0].file);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadCharacter(selectedCharacter);
  }, [selectedCharacter, loadCharacter]);

  useFrame((_, delta) => {
    if (!groupRef.current || !mixerRef.current) return;

    const state = useRunnerStore.getState();

    // Lane lerp
    const targetX = RUNNER.lanePositions[state.lane] ?? 0;
    currentX.current = MathUtils.lerp(currentX.current, targetX, Math.min(1, delta / RUNNER.laneSwitchDuration));
    groupRef.current.position.x = currentX.current;

    // Jump arc
    let jumpOffset = 0;
    if (state.isJumping) {
      jumpT.current = Math.min(jumpT.current + delta / RUNNER.jumpDuration, 1);
      jumpOffset = Math.sin(jumpT.current * Math.PI) * 2.0; // jump height in world units
    } else {
      jumpT.current = 0;
    }

    groupRef.current.position.y = jumpOffset;
    playerY.current = jumpOffset + 0.5; // approximate center Y for collision

    // Trigger one-shot animations
    const actions = actionsRef.current;
    if (!oneShotPlaying.current) {
      if (state.isJumping && actions['Jump'] && prevAction.current !== 'Jump') {
        oneShotPlaying.current = 'Jump';
        actions[prevAction.current]?.fadeOut(0.15);
        const action = actions['Jump'];
        action.reset().fadeIn(0.15).play();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        prevAction.current = 'Jump';
        if (modelRef.current) {
          const offset = groundOffsetsRef.current['Jump'] ?? 0;
          modelRef.current.position.y = -offset * MODEL_SCALE;
        }
      } else if (state.isSliding && actions['Slide'] && prevAction.current !== 'Slide') {
        oneShotPlaying.current = 'Slide';
        actions[prevAction.current]?.fadeOut(0.15);
        const action = actions['Slide'];
        action.reset().fadeIn(0.15).play();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        prevAction.current = 'Slide';
        if (modelRef.current) {
          const offset = groundOffsetsRef.current['Slide'] ?? 0;
          modelRef.current.position.y = -offset * MODEL_SCALE;
        }
      }
    }

    // Collision check
    const collisions = checkRunnerCollision(state.lane, playerY.current, state.isSliding);
    if (collisions > 0 && state.collisionCount === 0) {
      console.log(`[RunnerWorld] Collision detected! (${collisions} overlaps)`);
    }
    state.setCollisionCount(collisions);

    mixerRef.current.update(delta);
  });

  const state = useRunnerStore.getState();

  return (
    <>
      <group ref={groupRef} position={[RUNNER.lanePositions[1], 0, 0]} />
      <PlayerDebugWireframe
        playerX={currentX.current}
        playerY={playerY.current}
        isSliding={state.isSliding}
      />
    </>
  );
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/runner-world/components/RunnerPlayer.tsx
git commit -m "feat(runner-world): add FBX character player with animation state machine and collision"
```

---

### Task 8: Scene Composition + Character Selector UI

Wire everything together into the scene component and update the page with a character selector dropdown and debug HUD.

**Files:**
- Create: `src/runner-world/components/RunnerScene.tsx`
- Create: `src/runner-world/ui/RunnerHUD.tsx`
- Modify: `src/runner-world/RunnerWorldPage.tsx`

**Step 1: Create RunnerScene.tsx**

Create `src/runner-world/components/RunnerScene.tsx`:

```tsx
import { RunnerCamera } from './RunnerCamera';
import { RunnerEnvironment } from './RunnerEnvironment';
import { RunnerPlayer } from './RunnerPlayer';
import { RunnerObstacles } from './RunnerObstacles';
import { useRunnerInput } from '../systems/RunnerInput';

export function RunnerScene() {
  useRunnerInput();

  return (
    <>
      <RunnerCamera />
      <RunnerEnvironment />
      <RunnerPlayer />
      <RunnerObstacles />
    </>
  );
}
```

**Step 2: Create RunnerHUD.tsx**

Create `src/runner-world/ui/RunnerHUD.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useRunnerStore } from '../core/RunnerState';

type CharacterEntry = { name: string; file: string };

export function RunnerHUD() {
  const selected = useRunnerStore((s) => s.selectedCharacter);
  const error = useRunnerStore((s) => s.characterError);
  const showHitboxes = useRunnerStore((s) => s.showHitboxes);
  const collisionCount = useRunnerStore((s) => s.collisionCount);
  const [characters, setCharacters] = useState<CharacterEntry[]>([]);

  useEffect(() => {
    fetch('/models/characters/manifest.json')
      .then((res) => res.json())
      .then((data) => setCharacters(data.characters))
      .catch(console.error);
  }, []);

  return (
    <>
      {/* Character selector - top left */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        color: '#fff',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px 14px',
        borderRadius: 8,
        zIndex: 10,
      }}>
        <label style={{ fontWeight: 'bold', marginRight: 8 }}>Character</label>
        <select
          value={selected}
          onChange={(e) => useRunnerStore.getState().setSelectedCharacter(e.target.value)}
          style={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
          }}
        >
          {characters.map((c) => (
            <option key={c.file} value={c.file}>{c.name}</option>
          ))}
        </select>
        {error && (
          <div style={{
            background: 'rgba(255,60,60,0.25)',
            border: '1px solid rgba(255,60,60,0.5)',
            color: '#faa',
            padding: '6px 8px',
            borderRadius: 4,
            fontSize: '0.7rem',
            lineHeight: 1.3,
            marginTop: 6,
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Debug info - bottom left */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        color: '#aaa',
        background: 'rgba(0,0,0,0.5)',
        padding: '8px 12px',
        borderRadius: 8,
        zIndex: 10,
        lineHeight: 1.6,
      }}>
        <div>Hitboxes: {showHitboxes ? 'ON' : 'OFF'} <span style={{ color: '#666' }}>(H to toggle)</span></div>
        <div>Collisions: <span style={{ color: collisionCount > 0 ? '#ff4444' : '#44ff44' }}>{collisionCount}</span></div>
        <div style={{ color: '#666', marginTop: 4 }}>
          Arrow keys / WASD: move, jump, slide
        </div>
      </div>
    </>
  );
}
```

**Step 3: Update RunnerWorldPage.tsx**

Replace the contents of `src/runner-world/RunnerWorldPage.tsx`:

```tsx
import { Canvas } from '@react-three/fiber';
import { RunnerScene } from './components/RunnerScene';
import { RunnerHUD } from './ui/RunnerHUD';
import { BackButton } from '../BackButton';

export default function RunnerWorldPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#87ceeb', touchAction: 'none' }}>
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <RunnerScene />
      </Canvas>
      <RunnerHUD />
      <BackButton />
    </div>
  );
}
```

**Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

Open browser → Runner World. You should see:
- Urban environment scrolling toward camera
- FBX character running in center lane
- Obstacles spawning ahead and approaching
- Red wireframe hitboxes around obstacles
- Green wireframe hitbox around player
- Character selector dropdown (top left)
- Debug info panel (bottom left)
- Arrow keys switch lanes, up = jump, down = slide
- Collision count turns red on overlap
- Console logs on first collision

**Step 5: Commit**

```bash
git add src/runner-world/components/RunnerScene.tsx src/runner-world/ui/RunnerHUD.tsx src/runner-world/RunnerWorldPage.tsx
git commit -m "feat(runner-world): wire up scene, add character selector and debug HUD"
```

---

### Task 9: Polish + Final Verification

Test the full Runner World end-to-end and fix any issues.

**Step 1: Full type check**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 2: Manual testing checklist**

Open browser at `#/runner-world` and verify:

- [ ] Urban environment scrolls smoothly
- [ ] Buildings appear on both sides
- [ ] Ground tiles scroll seamlessly (no gaps)
- [ ] Lane markers and rails visible
- [ ] FBX character loads and plays Run animation
- [ ] Character faces forward (into the screen)
- [ ] Character grounded properly (feet on floor)
- [ ] Left/Right arrows switch lanes smoothly
- [ ] Up arrow triggers Jump animation + arc
- [ ] Down arrow triggers Slide animation
- [ ] After Jump/Slide, character returns to Run
- [ ] Obstacles spawn and approach
- [ ] 3 obstacle types visible (different colors/sizes)
- [ ] Red wireframe hitboxes on obstacles
- [ ] Green wireframe hitbox on player
- [ ] H key toggles hitbox visibility
- [ ] Collision count increases when overlapping
- [ ] Console log on collision
- [ ] Character selector dropdown works
- [ ] Switching character loads new FBX
- [ ] Back button returns to Home
- [ ] Touch swipes work on mobile/trackpad

**Step 3: Fix any issues found**

Address any bugs discovered during testing.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(runner-world): polish and verify runner world prototype"
```
