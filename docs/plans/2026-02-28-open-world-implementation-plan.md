# Open World + Multi-Page Routing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add hash-based routing with a home page, wire existing experiments to routes, and build a new open world scene with infinite procedural terrain and third-person character movement.

**Architecture:** Hash-based routing (no library) switches between page components. The open world uses chunk-based terrain generation — 32x32 unit chunks spawn/despawn around the player. World themes are pluggable modules providing colors, lighting, and object generators. The character controller reuses the existing FBX loading + animation system from character-test.

**Tech Stack:** React, Three.js, React Three Fiber, Drei, Zustand, simplex-noise (to install)

---

### Task 1: Hash Router + Home Page

**Files:**
- Create: `src/router.ts`
- Create: `src/Home.tsx`
- Modify: `src/App.tsx`

**Step 1: Create the hash router hook**

```typescript
// src/router.ts
import { useState, useEffect } from 'react';

export type Route = '' | 'character-test' | 'open-world' | 'mirror-world-runner';

function parseHash(): Route {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const valid: Route[] = ['character-test', 'open-world', 'mirror-world-runner'];
  return valid.includes(hash as Route) ? (hash as Route) : '';
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export function navigate(route: Route) {
  window.location.hash = route ? `#/${route}` : '#/';
}
```

**Step 2: Create the Home page with experiment cards**

```typescript
// src/Home.tsx
import { navigate, type Route } from './router';

const experiments: { route: Route; title: string; description: string; color: string }[] = [
  {
    route: 'character-test',
    title: 'Character Test',
    description: 'Test Mixamo character animations in isolation',
    color: '#4040a0',
  },
  {
    route: 'open-world',
    title: 'Open World',
    description: 'Run through a procedurally generated landscape',
    color: '#2a6040',
  },
  {
    route: 'mirror-world-runner',
    title: 'Mirror World Runner',
    description: 'Cyberpunk endless runner with gravity flipping',
    color: '#602040',
  },
];

export function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      color: '#e0e0e0',
      padding: 32,
    }}>
      <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: 8, color: '#8080ff' }}>
        3D Experiments
      </h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Choose an experiment to explore</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        width: '100%',
        maxWidth: 900,
      }}>
        {experiments.map((exp) => (
          <button
            key={exp.route}
            onClick={() => navigate(exp.route)}
            style={{
              padding: 24,
              background: exp.color,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              color: '#fff',
              fontFamily: 'monospace',
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 8 }}>
              {exp.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              {exp.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Update App.tsx to route between pages**

Replace `src/App.tsx` with:

```typescript
import { Suspense, lazy } from 'react';
import { useHashRoute } from './router';
import { Home } from './Home';

// Lazy-load page components so they don't all bundle into initial load
const CharacterTestPage = lazy(() => import('./character-test/CharacterTestPage'));
const MirrorWorldRunnerPage = lazy(() => import('./game/MirrorWorldRunnerPage'));
const OpenWorldPage = lazy(() => import('./open-world/OpenWorldPage'));

function LoadingFallback() {
  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#1a1a2e', color: '#888', fontFamily: 'monospace',
    }}>
      Loading...
    </div>
  );
}

export default function App() {
  const route = useHashRoute();

  if (route === '') return <Home />;

  return (
    <Suspense fallback={<LoadingFallback />}>
      {route === 'character-test' && <CharacterTestPage />}
      {route === 'mirror-world-runner' && <MirrorWorldRunnerPage />}
      {route === 'open-world' && <OpenWorldPage />}
    </Suspense>
  );
}
```

**Step 4: Create page wrapper for character-test (default export for lazy)**

```typescript
// src/character-test/CharacterTestPage.tsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CharacterScene } from './CharacterScene';
import { ControlsHUD } from './ControlsHUD';
import { BackButton } from '../BackButton';

export default function CharacterTestPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#1a1a2e' }}>
      <Suspense fallback={null}>
        <Canvas
          shadows
          camera={{ position: [0, 2, 5], fov: 50 }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%' }}
        >
          <CharacterScene />
        </Canvas>
      </Suspense>
      <ControlsHUD />
      <BackButton />
    </div>
  );
}
```

**Step 5: Create page wrapper for mirror-world-runner**

```typescript
// src/game/MirrorWorldRunnerPage.tsx
import { Canvas } from '@react-three/fiber';
import { GameLoop } from './components/GameLoop';
import { HUD } from './ui/HUD';
import { TouchControls } from './ui/TouchControls';
import { MenuOverlay } from './ui/MenuOverlay';
import { BackButton } from '../BackButton';

export default function MirrorWorldRunnerPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#000011', touchAction: 'none' }}>
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <GameLoop />
      </Canvas>
      <HUD />
      <TouchControls />
      <MenuOverlay />
      <BackButton />
    </div>
  );
}
```

**Step 6: Create shared BackButton component**

```typescript
// src/BackButton.tsx
import { navigate } from './router';

export function BackButton() {
  return (
    <button
      onClick={() => navigate('')}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        padding: '6px 14px',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        background: 'rgba(0,0,0,0.5)',
        color: '#aaa',
        border: '1px solid #444',
        borderRadius: 6,
        cursor: 'pointer',
        zIndex: 50,
      }}
    >
      Home
    </button>
  );
}
```

**Step 7: Verify routing works**

Run: `npx tsc --noEmit` — expect clean.
Open browser, verify:
- `/#/` shows home page with 3 cards
- Click "Character Test" navigates to `/#/character-test` and loads the character scene
- Click "Mirror World Runner" loads the game
- "Home" button returns to home
- "Open World" will 404 until we build it (create placeholder next)

**Step 8: Create placeholder OpenWorldPage**

```typescript
// src/open-world/OpenWorldPage.tsx
import { BackButton } from '../BackButton';

export default function OpenWorldPage() {
  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#1a1a2e', color: '#888', fontFamily: 'monospace',
    }}>
      <div>Open World — coming soon</div>
      <BackButton />
    </div>
  );
}
```

**Step 9: Commit**

```bash
git add src/router.ts src/Home.tsx src/BackButton.tsx src/App.tsx \
  src/character-test/CharacterTestPage.tsx src/game/MirrorWorldRunnerPage.tsx \
  src/open-world/OpenWorldPage.tsx
git commit -m "feat: add hash-based routing with home page and page wrappers"
```

---

### Task 2: Simplex Noise Utility

**Files:**
- Create: `src/open-world/procedural/noise.ts`

**Step 1: Install simplex-noise package**

```bash
pnpm add simplex-noise
```

**Step 2: Create noise utility**

```typescript
// src/open-world/procedural/noise.ts
import { createNoise2D } from 'simplex-noise';

// Seeded PRNG for deterministic noise
function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Create a deterministic 2D noise function from a seed
export function createSeededNoise(seed: number) {
  const rng = mulberry32(seed);
  return createNoise2D(rng);
}

// Deterministic random from chunk coordinates (for object placement)
export function chunkRandom(chunkX: number, chunkZ: number, index: number): number {
  const seed = chunkX * 73856093 ^ chunkZ * 19349663 ^ index * 83492791;
  const t = (seed & 0x7fffffff) / 0x7fffffff;
  return t;
}
```

**Step 3: Commit**

```bash
git add src/open-world/procedural/noise.ts package.json pnpm-lock.yaml
git commit -m "feat: add simplex noise utility for terrain generation"
```

---

### Task 3: World Theme Types + Low-Poly Field Theme

**Files:**
- Create: `src/open-world/themes/types.ts`
- Create: `src/open-world/themes/lowPolyField.ts`

**Step 1: Define the WorldTheme interface**

```typescript
// src/open-world/themes/types.ts
export type ChunkObject = {
  type: 'tree' | 'rock' | 'grass';
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
};

export type WorldTheme = {
  name: string;
  ground: {
    color: string;
    colorAlt: string; // secondary color for patches
  };
  sky: {
    topColor: string;
    bottomColor: string;
  };
  fog: {
    color: string;
    near: number;
    far: number;
  };
  lighting: {
    ambientIntensity: number;
    sunColor: string;
    sunIntensity: number;
    sunPosition: [number, number, number];
  };
  // Generate objects for a chunk at given chunk coordinates
  generateChunkObjects: (chunkX: number, chunkZ: number, chunkSize: number) => ChunkObject[];
};
```

**Step 2: Implement the Low-Poly Field theme**

```typescript
// src/open-world/themes/lowPolyField.ts
import type { WorldTheme, ChunkObject } from './types';
import { chunkRandom } from '../procedural/noise';

const TREES_PER_CHUNK = 5;
const ROCKS_PER_CHUNK = 3;
const GRASS_PER_CHUNK = 12;

export const lowPolyField: WorldTheme = {
  name: 'Low-Poly Field',
  ground: {
    color: '#4a7c4f',
    colorAlt: '#3d6b42',
  },
  sky: {
    topColor: '#87ceeb',
    bottomColor: '#d4e8f0',
  },
  fog: {
    color: '#c8dce8',
    near: 40,
    far: 120,
  },
  lighting: {
    ambientIntensity: 0.6,
    sunColor: '#fffae0',
    sunIntensity: 1.0,
    sunPosition: [30, 50, 20],
  },

  generateChunkObjects(chunkX: number, chunkZ: number, chunkSize: number): ChunkObject[] {
    const objects: ChunkObject[] = [];
    const half = chunkSize / 2;
    let idx = 0;

    // Trees
    for (let i = 0; i < TREES_PER_CHUNK; i++) {
      const r1 = chunkRandom(chunkX, chunkZ, idx++);
      const r2 = chunkRandom(chunkX, chunkZ, idx++);
      const r3 = chunkRandom(chunkX, chunkZ, idx++);

      // Skip trees near chunk center (leave space for player path)
      const x = (r1 - 0.5) * chunkSize;
      const z = (r2 - 0.5) * chunkSize;
      if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;

      const scale = 0.6 + r3 * 0.8; // 0.6 to 1.4
      objects.push({
        type: 'tree',
        position: [chunkX * chunkSize + x, 0, chunkZ * chunkSize + z],
        scale: [scale, scale + r3 * 0.4, scale],
        rotation: [0, r1 * Math.PI * 2, 0],
      });
    }

    // Rocks
    for (let i = 0; i < ROCKS_PER_CHUNK; i++) {
      const r1 = chunkRandom(chunkX, chunkZ, idx++);
      const r2 = chunkRandom(chunkX, chunkZ, idx++);
      const r3 = chunkRandom(chunkX, chunkZ, idx++);

      const x = (r1 - 0.5) * chunkSize;
      const z = (r2 - 0.5) * chunkSize;
      const scale = 0.3 + r3 * 0.5;

      objects.push({
        type: 'rock',
        position: [chunkX * chunkSize + x, scale * 0.3, chunkZ * chunkSize + z],
        scale: [scale * 1.2, scale, scale],
        rotation: [r1 * 0.3, r2 * Math.PI * 2, r3 * 0.3],
      });
    }

    // Grass tufts
    for (let i = 0; i < GRASS_PER_CHUNK; i++) {
      const r1 = chunkRandom(chunkX, chunkZ, idx++);
      const r2 = chunkRandom(chunkX, chunkZ, idx++);
      const r3 = chunkRandom(chunkX, chunkZ, idx++);

      objects.push({
        type: 'grass',
        position: [
          chunkX * chunkSize + (r1 - 0.5) * chunkSize,
          0.1,
          chunkZ * chunkSize + (r2 - 0.5) * chunkSize,
        ],
        scale: [0.15 + r3 * 0.1, 0.3 + r3 * 0.2, 0.15],
        rotation: [0, r1 * Math.PI * 2, 0],
      });
    }

    return objects;
  },
};
```

**Step 3: Commit**

```bash
git add src/open-world/themes/
git commit -m "feat: add world theme interface and low-poly field theme"
```

---

### Task 4: Procedural Geometry Generators (Trees, Rocks)

**Files:**
- Create: `src/open-world/procedural/trees.tsx`
- Create: `src/open-world/procedural/rocks.tsx`

**Step 1: Create procedural tree component**

Low-poly tree: brown cylinder trunk + green cone canopy. Each tree is a single `<group>` with two meshes.

```tsx
// src/open-world/procedural/trees.tsx
import { useMemo } from 'react';
import * as THREE from 'three';

const trunkColor = new THREE.Color('#8B6914');
const canopyColors = ['#2d8a4e', '#3a9d5e', '#228b22', '#1e7a3c'];

export function LowPolyTree({ position, scale, rotation }: {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}) {
  // Pick canopy color deterministically from position
  const colorIdx = Math.abs(Math.floor(position[0] * 7 + position[2] * 13)) % canopyColors.length;
  const canopyColor = canopyColors[colorIdx];

  return (
    <group position={position} scale={scale} rotation={rotation}>
      {/* Trunk */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 1.2, 6]} />
        <meshStandardMaterial color={trunkColor} flatShading />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[0.7, 1.6, 6]} />
        <meshStandardMaterial color={canopyColor} flatShading />
      </mesh>
    </group>
  );
}
```

**Step 2: Create procedural rock component**

```tsx
// src/open-world/procedural/rocks.tsx
import { useMemo } from 'react';
import * as THREE from 'three';

const rockColors = ['#7a7a7a', '#6b6b5e', '#8a8275', '#5c5c4f'];

export function LowPolyRock({ position, scale, rotation }: {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}) {
  const colorIdx = Math.abs(Math.floor(position[0] * 3 + position[2] * 7)) % rockColors.length;

  // Displace vertices for organic look — memoize to avoid recomputing
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.5, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const noise = 0.85 + Math.sin(x * 5.1 + z * 3.7) * 0.15;
      pos.setXYZ(i, x * noise, y * 0.7 * noise, z * noise);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh position={position} scale={scale} rotation={rotation} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={rockColors[colorIdx]} flatShading />
    </mesh>
  );
}
```

**Step 3: Commit**

```bash
git add src/open-world/procedural/
git commit -m "feat: add procedural low-poly tree and rock generators"
```

---

### Task 5: World Store + Chunk/Terrain Components

**Files:**
- Create: `src/open-world/worldStore.ts`
- Create: `src/open-world/Chunk.tsx`
- Create: `src/open-world/TerrainManager.tsx`

**Step 1: Create the world store**

```typescript
// src/open-world/worldStore.ts
import { create } from 'zustand';

type WorldState = {
  // Player position in world coordinates
  playerX: number;
  playerZ: number;
  // Character movement direction (radians)
  playerAngle: number;
  // Is moving
  isMoving: boolean;

  setPlayerPosition: (x: number, z: number) => void;
  setPlayerAngle: (angle: number) => void;
  setMoving: (v: boolean) => void;
};

export const useWorldStore = create<WorldState>((set) => ({
  playerX: 0,
  playerZ: 0,
  playerAngle: 0,
  isMoving: false,

  setPlayerPosition: (x, z) => set({ playerX: x, playerZ: z }),
  setPlayerAngle: (angle) => set({ playerAngle: angle }),
  setMoving: (v) => set({ isMoving: v }),
}));
```

**Step 2: Create the Chunk component**

Each chunk renders a ground plane + the objects from the theme generator.

```tsx
// src/open-world/Chunk.tsx
import { useMemo } from 'react';
import type { WorldTheme, ChunkObject } from './themes/types';
import { LowPolyTree } from './procedural/trees';
import { LowPolyRock } from './procedural/rocks';
import * as THREE from 'three';

type ChunkProps = {
  chunkX: number;
  chunkZ: number;
  chunkSize: number;
  theme: WorldTheme;
};

function ChunkObjectRenderer({ obj }: { obj: ChunkObject }) {
  switch (obj.type) {
    case 'tree':
      return <LowPolyTree position={obj.position} scale={obj.scale} rotation={obj.rotation} />;
    case 'rock':
      return <LowPolyRock position={obj.position} scale={obj.scale} rotation={obj.rotation} />;
    case 'grass':
      return (
        <mesh position={obj.position} scale={obj.scale} rotation={obj.rotation}>
          <coneGeometry args={[0.5, 1, 4]} />
          <meshStandardMaterial color="#3d8b3d" flatShading />
        </mesh>
      );
    default:
      return null;
  }
}

export function Chunk({ chunkX, chunkZ, chunkSize, theme }: ChunkProps) {
  const worldX = chunkX * chunkSize;
  const worldZ = chunkZ * chunkSize;

  // Generate objects deterministically
  const objects = useMemo(
    () => theme.generateChunkObjects(chunkX, chunkZ, chunkSize),
    [chunkX, chunkZ, chunkSize, theme],
  );

  // Alternate ground color for visual variety
  const isAlt = (chunkX + chunkZ) % 2 === 0;
  const groundColor = isAlt ? theme.ground.color : theme.ground.colorAlt;

  return (
    <group>
      {/* Ground plane */}
      <mesh
        position={[worldX, 0, worldZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[chunkSize, chunkSize]} />
        <meshStandardMaterial color={groundColor} flatShading />
      </mesh>

      {/* Chunk objects */}
      {objects.map((obj, i) => (
        <ChunkObjectRenderer key={`${chunkX}_${chunkZ}_${i}`} obj={obj} />
      ))}
    </group>
  );
}
```

**Step 3: Create the TerrainManager**

Determines which chunks should be active based on player position.

```tsx
// src/open-world/TerrainManager.tsx
import { useMemo } from 'react';
import { useWorldStore } from './worldStore';
import { Chunk } from './Chunk';
import type { WorldTheme } from './themes/types';

const CHUNK_SIZE = 32;
const VIEW_RADIUS = 4; // chunks in each direction

export function TerrainManager({ theme }: { theme: WorldTheme }) {
  const playerX = useWorldStore((s) => s.playerX);
  const playerZ = useWorldStore((s) => s.playerZ);

  // Calculate which chunk the player is in
  const centerChunkX = Math.floor(playerX / CHUNK_SIZE);
  const centerChunkZ = Math.floor(playerZ / CHUNK_SIZE);

  // Generate list of chunks to render
  const chunks = useMemo(() => {
    const result: { x: number; z: number }[] = [];
    for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
      for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
        // Use circular radius for more natural view area
        if (dx * dx + dz * dz <= VIEW_RADIUS * VIEW_RADIUS) {
          result.push({ x: centerChunkX + dx, z: centerChunkZ + dz });
        }
      }
    }
    return result;
  }, [centerChunkX, centerChunkZ]);

  return (
    <>
      {chunks.map((c) => (
        <Chunk
          key={`${c.x}_${c.z}`}
          chunkX={c.x}
          chunkZ={c.z}
          chunkSize={CHUNK_SIZE}
          theme={theme}
        />
      ))}
    </>
  );
}
```

**Step 4: Commit**

```bash
git add src/open-world/worldStore.ts src/open-world/Chunk.tsx src/open-world/TerrainManager.tsx
git commit -m "feat: add world store, chunk rendering, and terrain manager"
```

---

### Task 6: Third-Person Character Controller

**Files:**
- Create: `src/open-world/CharacterController.tsx`

This is the core component. It:
- Loads the FBX character + animations (reusing pattern from character-test)
- Handles WASD movement relative to camera direction
- Rotates character to face movement direction
- Switches between Idle/Run animations based on movement
- Updates the world store with player position

```tsx
// src/open-world/CharacterController.tsx
import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useWorldStore } from './worldStore';

const MODEL_SCALE = 0.01;
const MOVE_SPEED = 6;
const ROTATION_SPEED = 10;

type AnimEntry = { name: string; file: string };

export function CharacterController() {
  const groupRef = useRef<THREE.Group>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const prevAction = useRef<string>('');
  const keys = useRef(new Set<string>());
  const [ready, setReady] = useState(false);

  const fbx = useFBX('/models/character.fbx');

  // Enable shadows
  useEffect(() => {
    fbx.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        (child as THREE.SkinnedMesh).castShadow = true;
        (child as THREE.SkinnedMesh).receiveShadow = true;
      }
    });
  }, [fbx]);

  // Load animations from manifest
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(fbx);
    mixerRef.current = mixer;

    async function loadAnims() {
      let entries: AnimEntry[];
      try {
        const res = await fetch('/models/anims/manifest.json');
        entries = (await res.json()).animations;
      } catch {
        console.error('[CharacterController] Failed to load manifest');
        return;
      }

      const loader = new FBXLoader();
      const actions: Record<string, THREE.AnimationAction> = {};

      for (const entry of entries) {
        try {
          const anim = await loader.loadAsync(`/models/anims/${entry.file}`);
          if (anim.animations.length > 0) {
            const clip = anim.animations[0];
            clip.name = entry.name;
            actions[entry.name] = mixer.clipAction(clip);
          }
        } catch (err) {
          console.warn(`[CharacterController] Skipping ${entry.file}:`, err);
        }
      }

      actionsRef.current = actions;

      // Start with Idle
      if (actions['Idle']) {
        actions['Idle'].reset().fadeIn(0.3).play();
        prevAction.current = 'Idle';
      }

      setReady(true);
    }

    loadAnims();
    return () => { mixer.stopAllAction(); };
  }, [fbx]);

  // Keyboard tracking
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const { camera } = useThree();

  // Movement + animation per frame
  useFrame((_, delta) => {
    if (!groupRef.current || !mixerRef.current) return;

    const k = keys.current;
    const moveDir = new THREE.Vector3();

    // Camera-relative movement
    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();
    const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

    if (k.has('w') || k.has('arrowup')) moveDir.add(camForward);
    if (k.has('s') || k.has('arrowdown')) moveDir.sub(camForward);
    if (k.has('a') || k.has('arrowleft')) moveDir.sub(camRight);
    if (k.has('d') || k.has('arrowright')) moveDir.add(camRight);

    const isMoving = moveDir.lengthSq() > 0.001;

    if (isMoving) {
      moveDir.normalize();

      // Move character
      groupRef.current.position.x += moveDir.x * MOVE_SPEED * delta;
      groupRef.current.position.z += moveDir.z * MOVE_SPEED * delta;

      // Rotate to face movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      const current = groupRef.current.rotation.y;
      // Smooth rotation
      let diff = targetAngle - current;
      // Normalize angle difference to [-PI, PI]
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      groupRef.current.rotation.y += diff * Math.min(1, ROTATION_SPEED * delta);
    }

    // Update world store
    useWorldStore.getState().setPlayerPosition(
      groupRef.current.position.x,
      groupRef.current.position.z,
    );
    useWorldStore.getState().setMoving(isMoving);

    // Switch animation
    const actions = actionsRef.current;
    const wantedAction = isMoving ? 'Run' : 'Idle';
    if (wantedAction !== prevAction.current && actions[wantedAction]) {
      actions[prevAction.current]?.fadeOut(0.2);
      actions[wantedAction].reset().fadeIn(0.2).play();
      prevAction.current = wantedAction;
    }

    // Update mixer
    mixerRef.current.update(delta);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={fbx} scale={MODEL_SCALE} rotation={[0, Math.PI, 0]} />
    </group>
  );
}
```

**Step 2: Commit**

```bash
git add src/open-world/CharacterController.tsx
git commit -m "feat: add third-person character controller with WASD movement"
```

---

### Task 7: Open World Scene Assembly + Camera

**Files:**
- Create: `src/open-world/OpenWorldScene.tsx`
- Create: `src/open-world/FollowCamera.tsx`
- Modify: `src/open-world/OpenWorldPage.tsx`

**Step 1: Create follow camera**

```tsx
// src/open-world/FollowCamera.tsx
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from './worldStore';

export function FollowCamera() {
  const controlsRef = useRef<any>(null!);

  useFrame(() => {
    if (!controlsRef.current) return;
    const { playerX, playerZ } = useWorldStore.getState();
    // Smoothly move the orbit target to the player position
    const target = controlsRef.current.target as THREE.Vector3;
    target.lerp(new THREE.Vector3(playerX, 1, playerZ), 0.1);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, 1, 0]}
      minDistance={3}
      maxDistance={12}
      maxPolarAngle={Math.PI / 2 - 0.1}
      minPolarAngle={0.3}
      enablePan={false}
    />
  );
}
```

**Step 2: Create the scene**

```tsx
// src/open-world/OpenWorldScene.tsx
import { BackSide } from 'three';
import { CharacterController } from './CharacterController';
import { TerrainManager } from './TerrainManager';
import { FollowCamera } from './FollowCamera';
import { lowPolyField } from './themes/lowPolyField';
import type { WorldTheme } from './themes/types';

// Swap this to change the world theme
const ACTIVE_THEME: WorldTheme = lowPolyField;

function SkyDome({ theme }: { theme: WorldTheme }) {
  return (
    <mesh scale={[500, 500, 500]}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshBasicMaterial color={theme.sky.topColor} side={BackSide} />
    </mesh>
  );
}

function Mountains() {
  // Static distant mountain ring
  const mountains = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 150 + Math.sin(i * 3.7) * 30;
    const height = 15 + Math.sin(i * 2.3) * 10;
    const width = 20 + Math.cos(i * 1.7) * 8;
    mountains.push(
      <mesh
        key={i}
        position={[Math.cos(angle) * dist, height / 2, Math.sin(angle) * dist]}
      >
        <coneGeometry args={[width, height, 5]} />
        <meshStandardMaterial color="#5a6a5a" flatShading />
      </mesh>,
    );
  }
  return <>{mountains}</>;
}

export function OpenWorldScene() {
  const theme = ACTIVE_THEME;

  return (
    <>
      {/* Sky */}
      <SkyDome theme={theme} />

      {/* Lighting */}
      <ambientLight intensity={theme.lighting.ambientIntensity} />
      <directionalLight
        position={theme.lighting.sunPosition}
        intensity={theme.lighting.sunIntensity}
        color={theme.lighting.sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />

      {/* Fog */}
      <fog attach="fog" args={[theme.fog.color, theme.fog.near, theme.fog.far]} />

      {/* Distant mountains */}
      <Mountains />

      {/* Terrain chunks */}
      <TerrainManager theme={theme} />

      {/* Player character */}
      <CharacterController />

      {/* Camera */}
      <FollowCamera />
    </>
  );
}
```

**Step 3: Update OpenWorldPage**

Replace the placeholder:

```tsx
// src/open-world/OpenWorldPage.tsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OpenWorldScene } from './OpenWorldScene';
import { BackButton } from '../BackButton';

export default function OpenWorldPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#87ceeb' }}>
      <Suspense fallback={
        <div style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: '#1a1a2e', color: '#888', fontFamily: 'monospace',
        }}>
          Loading world...
        </div>
      }>
        <Canvas
          shadows
          camera={{ position: [0, 4, 8], fov: 55 }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%' }}
        >
          <OpenWorldScene />
        </Canvas>
      </Suspense>
      <BackButton />
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.6)',
        background: 'rgba(0,0,0,0.4)',
        padding: '8px 16px',
        borderRadius: 8,
        textAlign: 'center',
      }}>
        WASD to move | Mouse drag to orbit camera | Scroll to zoom
      </div>
    </div>
  );
}
```

**Step 4: Type-check and verify**

Run: `npx tsc --noEmit` — expect clean.
Open browser at `/#/open-world` — verify:
- Green terrain chunks appear
- Trees and rocks scattered around
- Mountains in distance
- Character visible and animating
- WASD moves character
- Camera follows
- Terrain generates as you move

**Step 5: Commit**

```bash
git add src/open-world/
git commit -m "feat: assemble open world scene with terrain, camera, and character"
```

---

### Task 8: Final Polish + Push

**Step 1: Verify all routes work**

Open each route and verify:
- `/#/` — home page with 3 cards
- `/#/character-test` — character test scene with animations
- `/#/mirror-world-runner` — original game loads and is playable
- `/#/open-world` — open world with movement and terrain generation
- Back button works on all pages

**Step 2: Commit any fixes, then push**

```bash
git push origin character-test
```
