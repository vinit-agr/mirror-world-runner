# Mirror World Runner — Next Stage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the placeholder-box MVP into a visually polished cyberpunk endless runner with GLTF character/obstacle models, a city corridor environment, collectibles, particle effects, and sound.

**Architecture:** Layer Cake approach — 4 horizontal layers, each independently shippable. Layer 1 builds the asset pipeline and character. Layer 2 adds environment and obstacle models. Layer 3 adds collectibles and fixes duck/slide. Layer 4 adds particle effects and sound. Each layer builds on the previous one.

**Tech Stack:** React Three Fiber, Drei (useGLTF, useAnimations, Environment, Sparkles), Zustand, Three.js particle systems, Web Audio API / Howler.js, Vite (static assets in public/).

**Design doc:** `docs/plans/2026-02-28-next-stage-visual-gameplay-upgrade-design.md`

---

## Pre-requisites

Before starting, source and download these free assets:

### Character Model
- Go to [Mixamo](https://www.mixamo.com/)
- Download a humanoid character (e.g., "X Bot" or "Y Bot" — these are Mixamo's own robots, fit the cyber theme)
- Download these animations for the chosen character (FBX format, "Without Skin" for animations after the first):
  - **Running** (in-place loop)
  - **Jump** (in-place)
  - **Slide / Crouch** (in-place, look for "Crouching" or "Baseball Slide")
  - **Death** (look for "Falling Back Death" or "Electrocuted")
- Convert FBX to GLB using [gltf.report](https://gltf.report/) or the `gltf-transform` CLI
- Place in `public/models/character.glb` (character + run anim baked in)
- Place animations in `public/models/anims/jump.glb`, `slide.glb`, `death.glb`

**Alternative:** Use a single GLB with all animations embedded. Mixamo lets you stack animations before export. This is simpler — one file, all clips.

### Obstacle Models
- Source from [Kenney.nl](https://kenney.nl/assets) (CC0) or [Sketchfab](https://sketchfab.com/) (CC-BY or CC0)
- Need 3 models:
  - **barrier**: horizontal beam/gate (~1.0 x 1.2 x 0.4 proportions)
  - **tall**: vertical pillar/tower (~0.8 x 2.0 x 0.4 proportions)
  - **low**: ground pipe/platform (~1.2 x 0.5 x 0.5 proportions)
- Convert to GLB, place in `public/models/obstacles/{barrier,tall,low}.glb`
- If no suitable models found, these can stay as enhanced primitives (composed shapes with better materials) — the pipeline supports both

### Environment
- Skybox: find a dark cyberpunk HDRI or cube texture (Poly Haven has free HDRIs)
- Or skip skybox and use a gradient sphere (simpler, still looks good with fog)
- Building models: optional — can use composed box primitives with emissive materials

### Audio
- BGM: synthwave loop from [Pixabay Music](https://pixabay.com/music/) (free, no attribution needed)
- SFX: generate with [sfxr](https://sfxr.me/) or [jsfxr](https://sfxr.me/) for retro synth sounds
- Place in `public/audio/{bgm.mp3, jump.mp3, slide.mp3, flip.mp3, collect.mp3, death.mp3, lane.mp3}`

---

## Layer 1: Asset Pipeline & Character Model

### Task 1: Set Up Asset Directories and GLTF Tooling

**Files:**
- Create: `public/models/.gitkeep`
- Create: `public/models/obstacles/.gitkeep`
- Create: `public/models/anims/.gitkeep`
- Create: `public/audio/.gitkeep`

**Step 1: Create asset directories**

```bash
mkdir -p public/models/obstacles public/models/anims public/audio
touch public/models/.gitkeep public/models/obstacles/.gitkeep public/models/anims/.gitkeep public/audio/.gitkeep
```

**Step 2: Verify Drei's useGLTF is available**

Drei is already installed (`@react-three/drei: ^10.7.7`). Verify it exports what we need:

```bash
grep -r "useGLTF\|useAnimations" node_modules/@react-three/drei/dist/index.js | head -5
```

Expected: exports for `useGLTF` and `useAnimations` exist.

**Step 3: Commit**

```bash
git add public/
git commit -m "chore: add asset directories for models and audio"
```

---

### Task 2: Extend AssetRegistry for GLTF Models

**Files:**
- Modify: `src/game/config/AssetRegistry.ts`

**Step 1: Add model asset type**

Replace the entire `AssetRegistry.ts` with the extended version:

```typescript
// Asset registry — supports procedural primitives and GLTF models
// Each entry describes geometry + material for a game entity

export type PrimitiveAssetDef = {
  type: 'primitive';
  geometry: 'box' | 'sphere' | 'cylinder' | 'cone' | 'capsule';
  scale: [number, number, number];
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
};

export type ModelAssetDef = {
  type: 'model';
  url: string;
  scale: [number, number, number];
  rotation?: [number, number, number];
  animations?: string[];         // expected animation clip names
  emissiveOverride?: string;     // override material emissive color
  emissiveIntensity?: number;
};

export type AnyAssetDef = PrimitiveAssetDef | ModelAssetDef;

// --- Current assets (primitives — will be swapped to models as they become available) ---

export const ASSETS: Record<string, AnyAssetDef> = {
  player: {
    type: 'primitive',
    geometry: 'box',
    scale: [0.6, 0.8, 0.6],
    color: '#00f5ff',
    emissive: '#00f5ff',
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.2,
  },

  obstacleBarrier: {
    type: 'primitive',
    geometry: 'box',
    scale: [1.0, 1.2, 0.4],
    color: '#ff2d95',
    emissive: '#ff2d95',
    emissiveIntensity: 0.6,
    metalness: 0.6,
    roughness: 0.3,
  },

  obstacleTall: {
    type: 'primitive',
    geometry: 'box',
    scale: [0.8, 2.0, 0.4],
    color: '#ff00ff',
    emissive: '#ff00ff',
    emissiveIntensity: 0.5,
    metalness: 0.6,
    roughness: 0.3,
  },

  obstacleLow: {
    type: 'primitive',
    geometry: 'box',
    scale: [1.2, 0.5, 0.5],
    color: '#f0ff00',
    emissive: '#f0ff00',
    emissiveIntensity: 0.4,
    metalness: 0.5,
    roughness: 0.4,
  },

  groundTile: {
    type: 'primitive',
    geometry: 'box',
    scale: [12, 0.1, 4],
    color: '#0a0a2e',
    emissive: '#1a1a4e',
    emissiveIntensity: 0.15,
    metalness: 0.9,
    roughness: 0.1,
  },

  collectible: {
    type: 'primitive',
    geometry: 'sphere',
    scale: [0.3, 0.3, 0.3],
    color: '#f0ff00',
    emissive: '#f0ff00',
    emissiveIntensity: 0.8,
    metalness: 0.9,
    roughness: 0.1,
  },
};

// Helper: get all model URLs for preloading
export function getModelUrls(): string[] {
  return Object.values(ASSETS)
    .filter((a): a is ModelAssetDef => a.type === 'model')
    .map((a) => a.url);
}
```

**Step 2: Verify the app still builds**

```bash
pnpm build
```

Expected: build succeeds with no type errors. The game still runs with primitives.

**Step 3: Commit**

```bash
git add src/game/config/AssetRegistry.ts
git commit -m "feat: extend AssetRegistry to support GLTF model definitions"
```

---

### Task 3: Create useGameAsset Hook

**Files:**
- Create: `src/game/hooks/useGameAsset.ts`

**Step 1: Write the hook**

```typescript
// Hook to load and return a game asset — handles both primitives and GLTF models
// Primitive assets return mesh props; model assets return a loaded GLTF scene

import { useGLTF } from '@react-three/drei';
import { ASSETS, type AnyAssetDef, type PrimitiveAssetDef, type ModelAssetDef } from '../config/AssetRegistry';

export type PrimitiveResult = {
  type: 'primitive';
  def: PrimitiveAssetDef;
};

export type ModelResult = {
  type: 'model';
  def: ModelAssetDef;
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
};

export type AssetResult = PrimitiveResult | ModelResult;

export function useGameAsset(key: string): AssetResult {
  const def = ASSETS[key];
  if (!def) throw new Error(`Unknown asset key: ${key}`);

  if (def.type === 'primitive') {
    return { type: 'primitive', def };
  }

  // Model type — useGLTF is called unconditionally (React rules of hooks)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const gltf = useGLTF(def.url);

  return {
    type: 'model',
    def,
    scene: gltf.scene.clone(),
    animations: gltf.animations,
  };
}

// Preload all model assets (call once at app level)
export function preloadAllModels() {
  const urls = Object.values(ASSETS)
    .filter((a): a is ModelAssetDef => a.type === 'model')
    .map((a) => a.url);

  urls.forEach((url) => useGLTF.preload(url));
}
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: build succeeds. Hook isn't used yet, just created.

**Step 3: Commit**

```bash
git add src/game/hooks/useGameAsset.ts
git commit -m "feat: add useGameAsset hook for loading primitives and GLTF models"
```

---

### Task 4: Add Loading Screen

**Files:**
- Create: `src/game/ui/LoadingScreen.tsx`
- Modify: `src/App.tsx`

**Step 1: Create LoadingScreen component**

```typescript
import { Suspense, useState, useEffect } from 'react';
import { THEME } from '../config/ThemeConfig';

function LoadingUI() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000011',
      fontFamily: 'monospace',
      color: THEME.colors.uiText,
      zIndex: 100,
    }}>
      <h1 style={{
        fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
        textShadow: `0 0 20px ${THEME.colors.neonCyan}`,
        letterSpacing: '0.1em',
        margin: 0,
      }}>
        LOADING{dots}
      </h1>
      <div style={{
        marginTop: 24,
        width: 200,
        height: 4,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: `linear-gradient(90deg, ${THEME.colors.neonCyan}, ${THEME.colors.neonMagenta})`,
          animation: 'loading-bar 1.5s ease-in-out infinite',
          width: '40%',
        }} />
      </div>
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

export function LoadingScreen({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingUI />}>
      {children}
    </Suspense>
  );
}
```

**Step 2: Wrap App in LoadingScreen**

Modify `src/App.tsx` — wrap the Canvas content in `<LoadingScreen>`:

```typescript
import { Canvas } from '@react-three/fiber';
import { GameLoop } from './game/components/GameLoop';
import { HUD } from './game/ui/HUD';
import { TouchControls } from './game/ui/TouchControls';
import { MenuOverlay } from './game/ui/MenuOverlay';
import { LoadingScreen } from './game/ui/LoadingScreen';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#000011', touchAction: 'none' }}>
      <LoadingScreen>
        <Canvas
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          style={{ width: '100%', height: '100%' }}
        >
          <GameLoop />
        </Canvas>
      </LoadingScreen>
      <HUD />
      <TouchControls />
      <MenuOverlay />
    </div>
  );
}
```

**Step 3: Verify it works**

```bash
pnpm dev
```

Open browser. The loading screen should briefly flash (since there are no models to load yet, it'll be instant). The game should work exactly as before.

**Step 4: Commit**

```bash
git add src/game/ui/LoadingScreen.tsx src/App.tsx
git commit -m "feat: add loading screen with Suspense wrapper for asset preloading"
```

---

### Task 5: Integrate Character Model into Player

**Prerequisite:** A character GLB file must exist at `public/models/character.glb` with embedded animations (run, jump, slide, death). If not available yet, this task shows the code pattern — the fallback to the primitive box continues to work.

**Files:**
- Modify: `src/game/config/AssetRegistry.ts` (update player entry when model is ready)
- Modify: `src/game/components/Player.tsx`

**Step 1: Update AssetRegistry with model path (when model is available)**

In `AssetRegistry.ts`, replace the `player` entry:

```typescript
  player: {
    type: 'model',
    url: '/models/character.glb',
    scale: [0.5, 0.5, 0.5],       // adjust based on actual model size
    rotation: [0, Math.PI, 0],     // face away from camera (running forward)
    animations: ['Run', 'Jump', 'Slide', 'Death'],
    emissiveOverride: '#00f5ff',
    emissiveIntensity: 0.3,
  },
```

**Step 2: Rewrite Player.tsx to support both primitives and models**

```typescript
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations } from '@react-three/drei';
import { MathUtils, type Group, AnimationMixer, MeshStandardMaterial } from 'three';
import { useGameStore } from '../core/GameState';
import { GAME } from '../config/GameConfig';
import { ASSETS, type ModelAssetDef } from '../config/AssetRegistry';
import { useGameAsset } from '../hooks/useGameAsset';
import { useWorldFlip } from '../systems/WorldFlipSystem';
import { checkCollision } from '../systems/ObstacleSystem';

export function Player() {
  const groupRef = useRef<Group>(null!);
  const asset = useGameAsset('player');
  const { getFlipY, getFlipRotationX } = useWorldFlip();

  // Smooth lane position
  const currentX = useRef<number>(GAME.lanePositions[1]);
  // Jump arc
  const jumpT = useRef(0);

  // Animation handling for model assets
  const animations = asset.type === 'model' ? asset.animations : [];
  const { actions, mixer } = useAnimations(animations, groupRef);

  // Apply emissive override to model materials
  useEffect(() => {
    if (asset.type !== 'model') return;
    const def = asset.def as ModelAssetDef;
    if (!def.emissiveOverride) return;

    groupRef.current?.traverse((child) => {
      if ('material' in child && child.material instanceof MeshStandardMaterial) {
        child.material.emissive.set(def.emissiveOverride!);
        child.material.emissiveIntensity = def.emissiveIntensity ?? 0.3;
      }
    });
  }, [asset]);

  // Play run animation by default
  useEffect(() => {
    if (actions['Run']) {
      actions['Run'].reset().fadeIn(0.2).play();
    }
  }, [actions]);

  // Track current animation to handle transitions
  const currentAnim = useRef('Run');

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;

    // Lane lerp
    const targetX = GAME.lanePositions[state.lane] ?? 0;
    currentX.current = MathUtils.lerp(currentX.current, targetX, Math.min(1, delta / GAME.laneSwitchDuration));

    // Jump arc
    let jumpOffset = 0;
    if (state.isJumping) {
      jumpT.current = Math.min(jumpT.current + delta / GAME.jumpDuration, 1);
      jumpOffset = Math.sin(jumpT.current * Math.PI) * GAME.jumpHeight;

      // Trigger jump animation
      if (currentAnim.current !== 'Jump' && actions['Jump']) {
        actions[currentAnim.current]?.fadeOut(0.1);
        actions['Jump'].reset().fadeIn(0.1).play();
        currentAnim.current = 'Jump';
      }
    } else {
      jumpT.current = 0;

      if (state.isSliding) {
        if (currentAnim.current !== 'Slide' && actions['Slide']) {
          actions[currentAnim.current]?.fadeOut(0.1);
          actions['Slide'].reset().fadeIn(0.1).play();
          currentAnim.current = 'Slide';
        }
      } else if (currentAnim.current !== 'Run' && actions['Run']) {
        actions[currentAnim.current]?.fadeOut(0.2);
        actions['Run'].reset().fadeIn(0.2).play();
        currentAnim.current = 'Run';
      }
    }

    // Slide scale (for primitive fallback; model uses animation)
    const scaleY = asset.type === 'primitive' && state.isSliding ? GAME.slideScale : 1;

    // Flip Y
    const baseY = getFlipY();
    const flipRot = getFlipRotationX();
    const flipDir = state.worldSide === 'bottom' ? 1 : -1;
    const finalY = baseY + jumpOffset * flipDir;

    groupRef.current.position.set(currentX.current, finalY, 0);
    groupRef.current.rotation.x = flipRot;

    if (asset.type === 'primitive') {
      groupRef.current.scale.set(1, scaleY, 1);
    }

    // Update animation mixer
    if (mixer) {
      mixer.update(delta);
    }

    // Collision
    if (checkCollision(state.lane, state.worldSide, finalY, state.isSliding)) {
      // Play death animation before dying
      if (actions['Death']) {
        actions[currentAnim.current]?.fadeOut(0.1);
        actions['Death'].reset().fadeIn(0.1).play();
        actions['Death'].clampWhenFinished = true;
        actions['Death'].setLoop(2200, 1); // LoopOnce
      }
      state.die();
    }

    // Score + speed ramp
    state.addScore(Math.round(GAME.scorePerSecond * delta * (state.speed / GAME.initialSpeed)));
    state.setDistance(state.distance + state.speed * delta);
    state.setSpeed(Math.min(GAME.maxSpeed, state.speed + GAME.speedRampPerSecond * delta));
  });

  // Render based on asset type
  if (asset.type === 'model') {
    const def = asset.def as ModelAssetDef;
    return (
      <group
        ref={groupRef}
        position={[0, GAME.playerY, 0]}
        scale={def.scale}
        rotation={def.rotation ? [def.rotation[0], def.rotation[1], def.rotation[2]] : undefined}
      >
        <primitive object={asset.scene} />
      </group>
    );
  }

  // Primitive fallback
  const a = asset.def;
  return (
    <group ref={groupRef} position={[0, GAME.playerY, 0]}>
      <mesh>
        <boxGeometry args={a.scale as [number, number, number]} />
        <meshStandardMaterial
          color={a.color}
          emissive={a.emissive}
          emissiveIntensity={a.emissiveIntensity}
          metalness={a.metalness}
          roughness={a.roughness}
        />
      </mesh>
    </group>
  );
}
```

**Step 3: Verify the game still works with the primitive fallback**

```bash
pnpm dev
```

Open browser. The game should work exactly as before (cyan box). The model path only activates when the player entry in AssetRegistry is changed to `type: 'model'`.

**Step 4: If you have the character GLB, test model loading**

- Place the GLB at `public/models/character.glb`
- Update the `player` entry in AssetRegistry to `type: 'model'` (step 1)
- Reload — character model should appear, run animation should play
- Test jump, slide, gravity flip — all should animate correctly
- If model scale/rotation is wrong, adjust the `scale` and `rotation` values in AssetRegistry

**Step 5: Commit**

```bash
git add src/game/components/Player.tsx src/game/hooks/useGameAsset.ts src/game/config/AssetRegistry.ts
git commit -m "feat: support GLTF character model with animation in Player component"
```

---

## Layer 2: Cyberpunk City Corridor & Obstacle Models

### Task 6: Add Scrolling Buildings Component

**Files:**
- Create: `src/game/components/Buildings.tsx`
- Modify: `src/game/components/Environment.tsx`

**Step 1: Create Buildings.tsx**

```typescript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { InstancedMesh } from 'three';
import { Object3D, Color } from 'three';
import { GAME } from '../config/GameConfig';
import { THEME } from '../config/ThemeConfig';
import { useGameStore } from '../core/GameState';

type BuildingsProps = {
  world: 'bottom' | 'top';
  side: 'left' | 'right';
};

// Procedural buildings flanking the track
export function Buildings({ world, side }: BuildingsProps) {
  const ref = useRef<InstancedMesh>(null!);
  const count = 12; // buildings visible at once
  const dummy = useMemo(() => new Object3D(), []);
  const colors = useMemo(() => {
    // Randomized building heights and positions (seeded per side/world)
    return Array.from({ length: count }, (_, i) => ({
      height: 3 + Math.sin(i * 2.7 + (side === 'left' ? 0 : 17)) * 2.5,
      width: 1.5 + Math.cos(i * 1.3) * 0.5,
      xOffset: (side === 'left' ? -1 : 1) * (4.5 + Math.abs(Math.sin(i * 3.1)) * 1.5),
      emissive: i % 3 === 0 ? THEME.colors.neonCyan : i % 3 === 1 ? THEME.colors.neonMagenta : THEME.colors.neonPink,
    }));
  }, [side]);

  useFrame(() => {
    const { distance } = useGameStore.getState();
    const spacing = 6;
    const offset = distance % spacing;

    for (let i = 0; i < count; i++) {
      const b = colors[i];
      const z = -i * spacing + offset;
      const baseY = world === 'bottom' ? b.height / 2 : GAME.mirrorGap - b.height / 2;

      dummy.position.set(b.xOffset, baseY, z);
      dummy.scale.set(b.width, b.height, 2);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={new Color(THEME.colors.groundBottom)}
        emissive={new Color(THEME.colors.neonMagenta)}
        emissiveIntensity={0.15}
        metalness={0.8}
        roughness={0.2}
      />
    </instancedMesh>
  );
}

// Neon light strips on building faces
export function BuildingLights({ world, side }: BuildingsProps) {
  const ref = useRef<InstancedMesh>(null!);
  const count = 8;
  const dummy = useMemo(() => new Object3D(), []);

  const lightColor = side === 'left' ? THEME.colors.neonCyan : THEME.colors.neonMagenta;

  useFrame(() => {
    const { distance } = useGameStore.getState();
    const spacing = 9;
    const offset = distance % spacing;

    for (let i = 0; i < count; i++) {
      const z = -i * spacing + offset;
      const x = (side === 'left' ? -1 : 1) * 3.8;
      const baseY = world === 'bottom' ? 1.5 : GAME.mirrorGap - 1.5;

      dummy.position.set(x, baseY, z);
      dummy.scale.set(0.05, 2.5, 0.05);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={lightColor}
        emissive={lightColor}
        emissiveIntensity={1.5}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
```

**Step 2: Add Buildings to Environment.tsx**

Modify `src/game/components/Environment.tsx` — add the imports and render Buildings:

Add import at top:
```typescript
import { Buildings, BuildingLights } from './Buildings';
```

Add inside the `<>...</>` return of `Environment()`, after `<SideWalls />`:
```typescript
      <Buildings world="bottom" side="left" />
      <Buildings world="bottom" side="right" />
      <Buildings world="top" side="left" />
      <Buildings world="top" side="right" />
      <BuildingLights world="bottom" side="left" />
      <BuildingLights world="bottom" side="right" />
      <BuildingLights world="top" side="left" />
      <BuildingLights world="top" side="right" />
```

**Step 3: Verify visually**

```bash
pnpm dev
```

Open browser. Buildings should appear flanking the track on both sides, scrolling toward the player. Both floor and ceiling worlds should have mirrored buildings. Neon light strips should glow on the building faces.

**Step 4: Commit**

```bash
git add src/game/components/Buildings.tsx src/game/components/Environment.tsx
git commit -m "feat: add scrolling cyberpunk buildings with neon light strips"
```

---

### Task 7: Add Background Skybox

**Files:**
- Modify: `src/game/components/Environment.tsx`

**Step 1: Add a gradient sky sphere**

Instead of requiring an HDRI file, create a procedural dark sky. Add this component inside `Environment.tsx`:

```typescript
function CyberSky() {
  return (
    <mesh scale={[200, 200, 200]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color={THEME.colors.skyTop}
        side={1}  // BackSide
      />
    </mesh>
  );
}
```

Add `<CyberSky />` at the top of the Environment return.

If/when you have an HDRI, replace with:
```typescript
import { Environment as DreiEnvironment } from '@react-three/drei';
// <DreiEnvironment files="/textures/cyberpunk.hdr" background />
```

**Step 2: Verify visually**

```bash
pnpm dev
```

The background should be a dark sphere instead of the default. With fog, it blends seamlessly.

**Step 3: Commit**

```bash
git add src/game/components/Environment.tsx
git commit -m "feat: add procedural cyber sky background"
```

---

### Task 8: Upgrade Obstacles to Support GLTF Models

**Files:**
- Modify: `src/game/components/Obstacles.tsx`

**Step 1: Rewrite Obstacles.tsx to use useGameAsset**

```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Group, MeshStandardMaterial } from 'three';
import { useGameStore, type Obstacle as ObstacleData } from '../core/GameState';
import { GAME } from '../config/GameConfig';
import { ASSETS, type PrimitiveAssetDef, type ModelAssetDef } from '../config/AssetRegistry';
import { useObstacleSystem } from '../systems/ObstacleSystem';

const VARIANT_KEY = {
  barrier: 'obstacleBarrier',
  tall: 'obstacleTall',
  low: 'obstacleLow',
} as const;

function ObstacleMesh({ obs }: { obs: ObstacleData }) {
  const assetKey = VARIANT_KEY[obs.variant];
  const asset = ASSETS[assetKey];

  // Position: lane X, world Y, z along track
  const x = GAME.lanePositions[obs.lane];

  if (asset.type === 'model') {
    const def = asset as ModelAssetDef;
    // Model obstacle rendering would use useGLTF here
    // For now, fall through to primitive
    const sy = obs.variant === 'tall' ? 2.0 : obs.variant === 'low' ? 0.5 : 1.2;
    const baseY = obs.world === 'bottom' ? sy / 2 : GAME.mirrorGap - sy / 2;
    return (
      <group position={[x, baseY, obs.z]} scale={def.scale}>
        {/* Placeholder until model files are available */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff2d95" emissive="#ff2d95" emissiveIntensity={0.5} />
        </mesh>
      </group>
    );
  }

  // Primitive rendering (current behavior)
  const prim = asset as PrimitiveAssetDef;
  const [sx, sy, sz] = prim.scale;
  const baseY = obs.world === 'bottom' ? sy / 2 : GAME.mirrorGap - sy / 2;

  return (
    <mesh position={[x, baseY, obs.z]}>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial
        color={prim.color}
        emissive={prim.emissive}
        emissiveIntensity={prim.emissiveIntensity}
        metalness={prim.metalness}
        roughness={prim.roughness}
      />
    </mesh>
  );
}

export function Obstacles() {
  useObstacleSystem();
  const obstacles = useGameStore((s) => s.obstacles);

  return (
    <>
      {obstacles.map(
        (obs) => obs.active && <ObstacleMesh key={obs.id} obs={obs} />,
      )}
    </>
  );
}
```

**Step 2: Verify the game works exactly as before**

```bash
pnpm dev
```

Obstacles should look identical (still primitives). The code now supports swapping to models via AssetRegistry.

**Step 3: Commit**

```bash
git add src/game/components/Obstacles.tsx
git commit -m "feat: upgrade Obstacles component to support GLTF model assets"
```

---

## Layer 3: Duck/Slide Fix & Collectibles

### Task 9: Verify and Fix Slide Collision

**Files:**
- Modify: `src/game/systems/ObstacleSystem.ts` (if fix needed)
- Modify: `src/game/config/GameConfig.ts` (if tuning needed)
- Modify: `src/game/components/GameCamera.tsx` (camera dip)

**Step 1: Analyze the collision math**

Current collision in `ObstacleSystem.ts:checkCollision`:
- Player hitbox half Y: `hy = 0.35`
- Player Y when on ground: `GAME.playerY = 0.5`
- Player pTop normal: `0.5 + 0.35 = 0.85`
- Player pTop sliding: `0.5 + 0.35 * 0.4 = 0.64`
- Tall obstacle: ohy = 1.0, so oBottom = 0 (on bottom world)

The sliding player (pTop=0.64) vs tall obstacle bottom (oBottom=0): `0.64 > 0` is TRUE → collision still triggers.

The issue: `tall` obstacles extend from Y=0 to Y=2.0 on bottom world. The player at Y=0.5 sliding to height 0.64 is still inside the obstacle. The slide doesn't actually clear tall obstacles.

**Fix:** The tall obstacle should have a gap at the bottom (like a barrier you slide under). The obstacle's bottom edge should be above the sliding player height. Adjust the obstacle Y positioning or add a `clearanceY` property.

Change `checkCollision` so tall obstacles have their bottom edge raised:

```typescript
export function checkCollision(
  playerLane: number,
  playerWorldSide: WorldSide,
  playerY: number,
  isSliding: boolean,
): boolean {
  const obstacles = useGameStore.getState().obstacles;
  const px = GAME.lanePositions[playerLane];
  const [hx, hy, hz] = GAME.playerHitboxHalf;

  for (const obs of obstacles) {
    if (!obs.active) continue;
    if (obs.world !== playerWorldSide) continue;

    const ox = GAME.lanePositions[obs.lane];
    const oz = obs.z;

    // Obstacle half-extents
    const ohx = 0.5;
    const ohy = obs.variant === 'tall' ? 1.0 : obs.variant === 'low' ? 0.25 : 0.6;
    const ohz = 0.2;

    // For tall obstacles: the blocking area is the TOP portion (above slide height)
    // The bottom has clearance for sliding under
    const slideClearance = obs.variant === 'tall' ? GAME.slideClearance : 0;

    // Obstacle Y center (shifted up for tall obstacles to create slide gap)
    let obstacleY: number;
    if (obs.world === 'bottom') {
      obstacleY = ohy + slideClearance;
    } else {
      obstacleY = GAME.mirrorGap - ohy - slideClearance;
    }

    // Player effective height
    const pBottom = playerY - hy;
    const pTop = playerY + (isSliding ? hy * GAME.slideScale : hy);

    const oBottom = obstacleY - ohy;
    const oTop = obstacleY + ohy;

    // AABB overlap
    if (
      Math.abs(px - ox) < hx + ohx &&
      Math.abs(oz) < hz + ohz &&
      pTop > oBottom &&
      pBottom < oTop
    ) {
      return true;
    }
  }

  return false;
}
```

**Step 2: Add slideClearance to GameConfig**

In `GameConfig.ts`, add:
```typescript
  slideClearance: 0.7,  // gap below tall obstacles for sliding under
```

**Step 3: Update obstacle visual positions in Obstacles.tsx**

In the `ObstacleMesh` component, adjust tall obstacle Y to match the collision:

For the primitive case, change the baseY calculation:
```typescript
  const slideClearance = obs.variant === 'tall' ? GAME.slideClearance : 0;
  const baseY = obs.world === 'bottom'
    ? sy / 2 + slideClearance
    : GAME.mirrorGap - sy / 2 - slideClearance;
```

**Step 4: Add camera dip during slide**

In `GameCamera.tsx`, add a slight Y offset when sliding:

```typescript
  useFrame(() => {
    const { worldSide, phase, isSliding } = useGameStore.getState();
    if (phase !== 'playing') {
      camera.position.set(0, 4, 8);
      camera.lookAt(0, GAME.mirrorGap / 2, -10);
      return;
    }

    const slideDip = isSliding ? -0.5 : 0;
    const targetY = worldSide === 'bottom' ? 3 + slideDip : GAME.mirrorGap - 1 + slideDip;
    currentY.current = MathUtils.lerp(currentY.current, targetY, 0.05);

    camera.position.set(0, currentY.current, 6);
    const lookY = worldSide === 'bottom' ? 0.5 : GAME.mirrorGap - 0.5;
    camera.lookAt(0, MathUtils.lerp(camera.position.y, lookY, 0.1), -20);
  });
```

**Step 5: Verify slide mechanic**

```bash
pnpm dev
```

- Run the game and approach a tall obstacle
- Press S / swipe down to slide
- The player should pass under the tall obstacle without dying
- The camera should dip slightly during the slide
- Normal barriers and low obstacles should still cause collision normally

**Step 6: Commit**

```bash
git add src/game/systems/ObstacleSystem.ts src/game/config/GameConfig.ts src/game/components/Obstacles.tsx src/game/components/GameCamera.tsx
git commit -m "fix: slide under tall obstacles with proper clearance and camera dip"
```

---

### Task 10: Add Collectible System State

**Files:**
- Modify: `src/game/core/GameState.ts`

**Step 1: Add collectible types and state**

Add to the type definitions at the top of `GameState.ts`:

```typescript
export type Collectible = {
  id: number;
  lane: number;
  z: number;
  world: WorldSide;
  active: boolean;
};
```

Add to the `GameState` type:
```typescript
  // Collectibles
  coins: number;
  collectibles: Collectible[];
  nextCollectibleId: number;

  // Collectible actions
  spawnCollectible: (c: Omit<Collectible, 'id'>) => void;
  collectItem: (id: number) => void;
  deactivateCollectible: (id: number) => void;
```

Add to the initial state in `create(...)`:
```typescript
  coins: 0,
  collectibles: [],
  nextCollectibleId: 0,
```

Add to `startGame`:
```typescript
  coins: 0,
  collectibles: [],
  nextCollectibleId: 0,
```

Add action implementations:
```typescript
  spawnCollectible: (c) => {
    const id = get().nextCollectibleId;
    set((s) => ({
      collectibles: [...s.collectibles, { ...c, id }],
      nextCollectibleId: id + 1,
    }));
  },

  collectItem: (id) =>
    set((s) => ({
      collectibles: s.collectibles.map((c) => (c.id === id ? { ...c, active: false } : c)),
      coins: s.coins + 1,
      score: s.score + 50,
    })),

  deactivateCollectible: (id) =>
    set((s) => ({
      collectibles: s.collectibles.map((c) => (c.id === id ? { ...c, active: false } : c)),
    })),
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: no type errors.

**Step 3: Commit**

```bash
git add src/game/core/GameState.ts
git commit -m "feat: add collectible state and actions to game store"
```

---

### Task 11: Create Collectible System and Rendering

**Files:**
- Create: `src/game/systems/CollectibleSystem.ts`
- Create: `src/game/components/Collectibles.tsx`
- Modify: `src/game/components/GameLoop.tsx`
- Modify: `src/game/config/GameConfig.ts`

**Step 1: Add collectible config values**

In `GameConfig.ts`, add:
```typescript
  // Collectibles
  collectibleSpawnInterval: 1.5,    // base interval
  collectibleSpawnChance: 0.6,      // probability per spawn tick
  collectiblePickupRadius: 1.0,     // forgiving pickup distance
  collectibleBonusScore: 50,
```

**Step 2: Create CollectibleSystem.ts**

```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, type WorldSide } from '../core/GameState';
import { GAME } from '../config/GameConfig';

export function useCollectibleSystem() {
  const spawnTimer = useRef(0);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;

    const { speed } = state;

    // Spawn logic
    spawnTimer.current += delta;
    if (spawnTimer.current >= GAME.collectibleSpawnInterval) {
      spawnTimer.current = 0;

      if (Math.random() < GAME.collectibleSpawnChance) {
        const lane = Math.floor(Math.random() * GAME.laneCount);
        const world: WorldSide = Math.random() < 0.5 ? 'bottom' : 'top';

        state.spawnCollectible({
          lane,
          z: GAME.obstacleStartZ - 10, // slightly further than obstacles
          world,
          active: true,
        });
      }
    }

    // Move + collection check + recycle
    const collectibles = useGameStore.getState().collectibles;
    const playerLane = state.lane;
    const playerWorld = state.worldSide;

    for (const c of collectibles) {
      if (!c.active) continue;
      const newZ = c.z + speed * delta;

      if (newZ > GAME.obstacleDespawnZ) {
        state.deactivateCollectible(c.id);
      } else {
        // Check if player is close enough to collect
        const cx = GAME.lanePositions[c.lane];
        const px = GAME.lanePositions[playerLane];

        if (
          c.world === playerWorld &&
          Math.abs(cx - px) < GAME.collectiblePickupRadius &&
          Math.abs(newZ) < GAME.collectiblePickupRadius
        ) {
          state.collectItem(c.id);
        } else {
          // Move collectible forward
          useGameStore.setState((s) => ({
            collectibles: s.collectibles.map((item) =>
              item.id === c.id ? { ...item, z: newZ } : item,
            ),
          }));
        }
      }
    }

    // Prune inactive
    const all = useGameStore.getState().collectibles;
    if (all.length > 60) {
      useGameStore.setState({ collectibles: all.filter((c) => c.active) });
    }
  });
}
```

**Step 3: Create Collectibles.tsx**

```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useGameStore, type Collectible as CollectibleData } from '../core/GameState';
import { GAME } from '../config/GameConfig';
import { ASSETS, type PrimitiveAssetDef } from '../config/AssetRegistry';
import { useCollectibleSystem } from '../systems/CollectibleSystem';

function CollectibleMesh({ item }: { item: CollectibleData }) {
  const meshRef = useRef<Mesh>(null!);
  const asset = ASSETS.collectible as PrimitiveAssetDef;

  const x = GAME.lanePositions[item.lane];
  const baseY = item.world === 'bottom' ? 0.8 : GAME.mirrorGap - 0.8;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.rotation.x += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[x, baseY, item.z]}>
      <octahedronGeometry args={[0.25, 0]} />
      <meshStandardMaterial
        color={asset.color}
        emissive={asset.emissive}
        emissiveIntensity={asset.emissiveIntensity}
        metalness={asset.metalness}
        roughness={asset.roughness}
        toneMapped={false}
      />
    </mesh>
  );
}

export function Collectibles() {
  useCollectibleSystem();
  const collectibles = useGameStore((s) => s.collectibles);

  return (
    <>
      {collectibles.map(
        (item) => item.active && <CollectibleMesh key={item.id} item={item} />,
      )}
    </>
  );
}
```

**Step 4: Wire into GameLoop**

Modify `src/game/components/GameLoop.tsx`:

Add import:
```typescript
import { Collectibles } from './Collectibles';
```

Add `<Collectibles />` after `<Obstacles />` in the return.

**Step 5: Add coin count to HUD**

Modify `src/game/ui/HUD.tsx` — add coin display:

```typescript
export function HUD() {
  const score = useGameStore((s) => s.score);
  const coins = useGameStore((s) => s.coins);
  const phase = useGameStore((s) => s.phase);

  if (phase !== 'playing') return null;

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      gap: 16,
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <div style={{
        background: THEME.colors.uiBackground,
        color: THEME.colors.uiText,
        padding: '8px 24px',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        border: `1px solid ${THEME.colors.neonCyan}`,
        textShadow: `0 0 10px ${THEME.colors.neonCyan}`,
      }}>
        {String(score).padStart(6, '0')}
      </div>
      <div style={{
        background: THEME.colors.uiBackground,
        color: THEME.colors.neonYellow,
        padding: '8px 16px',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        border: `1px solid ${THEME.colors.neonYellow}`,
        textShadow: `0 0 10px ${THEME.colors.neonYellow}`,
      }}>
        {coins}
      </div>
    </div>
  );
}
```

**Step 6: Verify everything works**

```bash
pnpm dev
```

- Collectible orbs should spawn along the track (both floor and ceiling)
- They should rotate/spin
- Running through one in the same lane + world should collect it
- Coin counter in HUD should increment
- Score should get +50 bonus per collection

**Step 7: Commit**

```bash
git add src/game/systems/CollectibleSystem.ts src/game/components/Collectibles.tsx src/game/components/GameLoop.tsx src/game/config/GameConfig.ts src/game/ui/HUD.tsx
git commit -m "feat: add collectible orbs with spawning, collection, and HUD coin counter"
```

---

## Layer 4: Particle Effects & Sound

### Task 12: Add Player Trail Particles

**Files:**
- Create: `src/game/components/PlayerTrail.tsx`
- Modify: `src/game/components/GameLoop.tsx`

**Step 1: Create PlayerTrail.tsx**

```typescript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { MathUtils, type Points as PointsType } from 'three';
import { useGameStore } from '../core/GameState';
import { GAME } from '../config/GameConfig';
import { THEME } from '../config/ThemeConfig';

const TRAIL_COUNT = 40;

export function PlayerTrail() {
  const pointsRef = useRef<PointsType>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(TRAIL_COUNT * 3);
    return arr;
  }, []);

  const headIndex = useRef(0);

  useFrame(() => {
    const { phase, lane, worldSide, distance } = useGameStore.getState();
    if (phase !== 'playing') return;

    const px = GAME.lanePositions[lane];
    const py = worldSide === 'bottom' ? GAME.playerY : GAME.mirrorGap - GAME.playerY;

    // Add new point at player position with slight randomness
    const i = headIndex.current % TRAIL_COUNT;
    positions[i * 3] = px + (Math.random() - 0.5) * 0.3;
    positions[i * 3 + 1] = py + (Math.random() - 0.5) * 0.3;
    positions[i * 3 + 2] = 0.5 + Math.random() * 0.5; // slightly behind player
    headIndex.current++;

    if (pointsRef.current?.geometry) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={THEME.colors.neonCyan}
        size={0.08}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
        toneMapped={false}
      />
    </Points>
  );
}
```

**Step 2: Add to GameLoop**

In `GameLoop.tsx`, import and add `<PlayerTrail />` after `<Player />`.

**Step 3: Verify visually**

```bash
pnpm dev
```

A faint trail of cyan particles should follow the player.

**Step 4: Commit**

```bash
git add src/game/components/PlayerTrail.tsx src/game/components/GameLoop.tsx
git commit -m "feat: add cyan particle trail behind player"
```

---

### Task 13: Add Flip Burst and Death Shatter Effects

**Files:**
- Create: `src/game/components/Effects.tsx`
- Modify: `src/game/components/GameLoop.tsx`

**Step 1: Create Effects.tsx**

```typescript
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import type { Points as PointsType } from 'three';
import { useGameStore } from '../core/GameState';
import { GAME } from '../config/GameConfig';
import { THEME } from '../config/ThemeConfig';

const BURST_COUNT = 50;

// Flip burst: magenta + cyan particle explosion when flipping gravity
export function FlipBurst() {
  const pointsRef = useRef<PointsType>(null!);
  const [active, setActive] = useState(false);
  const velocities = useRef<Float32Array>(new Float32Array(BURST_COUNT * 3));
  const positions = useRef<Float32Array>(new Float32Array(BURST_COUNT * 3));
  const lifetime = useRef(0);
  const prevWorldSide = useRef<string>('bottom');

  useFrame((_, delta) => {
    const { worldSide, phase, lane } = useGameStore.getState();

    // Detect flip
    if (phase === 'playing' && worldSide !== prevWorldSide.current) {
      prevWorldSide.current = worldSide;
      setActive(true);
      lifetime.current = 0;

      const px = GAME.lanePositions[lane];
      const py = worldSide === 'bottom' ? GAME.playerY : GAME.mirrorGap - GAME.playerY;

      // Initialize burst particles at player position
      for (let i = 0; i < BURST_COUNT; i++) {
        positions.current[i * 3] = px;
        positions.current[i * 3 + 1] = py;
        positions.current[i * 3 + 2] = 0;
        velocities.current[i * 3] = (Math.random() - 0.5) * 6;
        velocities.current[i * 3 + 1] = (Math.random() - 0.5) * 6;
        velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
    }

    if (!active) return;

    lifetime.current += delta;
    if (lifetime.current > 0.5) {
      setActive(false);
      return;
    }

    // Update positions
    for (let i = 0; i < BURST_COUNT; i++) {
      positions.current[i * 3] += velocities.current[i * 3] * delta;
      positions.current[i * 3 + 1] += velocities.current[i * 3 + 1] * delta;
      positions.current[i * 3 + 2] += velocities.current[i * 3 + 2] * delta;
      // Dampen
      velocities.current[i * 3] *= 0.95;
      velocities.current[i * 3 + 1] *= 0.95;
      velocities.current[i * 3 + 2] *= 0.95;
    }

    if (pointsRef.current?.geometry) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <Points ref={pointsRef} positions={positions.current} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={THEME.colors.neonMagenta}
        size={0.12}
        sizeAttenuation
        depthWrite={false}
        opacity={0.8}
        toneMapped={false}
      />
    </Points>
  );
}

// Death shatter: player explodes into particles
export function DeathEffect() {
  const pointsRef = useRef<PointsType>(null!);
  const [active, setActive] = useState(false);
  const velocities = useRef<Float32Array>(new Float32Array(BURST_COUNT * 3));
  const positions = useRef<Float32Array>(new Float32Array(BURST_COUNT * 3));
  const lifetime = useRef(0);
  const prevPhase = useRef<string>('menu');

  useFrame((_, delta) => {
    const { phase, lane, worldSide } = useGameStore.getState();

    // Detect death
    if (phase === 'dead' && prevPhase.current === 'playing') {
      setActive(true);
      lifetime.current = 0;

      const px = GAME.lanePositions[lane];
      const py = worldSide === 'bottom' ? GAME.playerY : GAME.mirrorGap - GAME.playerY;

      for (let i = 0; i < BURST_COUNT; i++) {
        positions.current[i * 3] = px + (Math.random() - 0.5) * 0.5;
        positions.current[i * 3 + 1] = py + (Math.random() - 0.5) * 0.5;
        positions.current[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        velocities.current[i * 3] = (Math.random() - 0.5) * 8;
        velocities.current[i * 3 + 1] = Math.random() * 5 + 2;
        velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 6;
      }
    }
    prevPhase.current = phase;

    if (!active) return;

    lifetime.current += delta;
    if (lifetime.current > 1.2) {
      setActive(false);
      return;
    }

    for (let i = 0; i < BURST_COUNT; i++) {
      positions.current[i * 3] += velocities.current[i * 3] * delta;
      positions.current[i * 3 + 1] += velocities.current[i * 3 + 1] * delta;
      positions.current[i * 3 + 2] += velocities.current[i * 3 + 2] * delta;
      velocities.current[i * 3 + 1] -= 9.8 * delta; // gravity
    }

    if (pointsRef.current?.geometry) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <Points ref={pointsRef} positions={positions.current} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={THEME.colors.neonCyan}
        size={0.15}
        sizeAttenuation
        depthWrite={false}
        opacity={0.9}
        toneMapped={false}
      />
    </Points>
  );
}
```

**Step 2: Add to GameLoop**

In `GameLoop.tsx`, import `FlipBurst` and `DeathEffect`, add them after `<PlayerTrail />`.

**Step 3: Verify visually**

```bash
pnpm dev
```

- Flip gravity → magenta particle burst at player position
- Die → cyan particles scatter outward with gravity

**Step 4: Commit**

```bash
git add src/game/components/Effects.tsx src/game/components/GameLoop.tsx
git commit -m "feat: add flip burst and death shatter particle effects"
```

---

### Task 14: Create Audio Manager

**Files:**
- Create: `src/game/systems/AudioManager.ts`
- Modify: `src/game/core/GameState.ts`

**Step 1: Add audio state to GameState**

Add to the GameState type:
```typescript
  // Audio
  musicEnabled: boolean;
  sfxEnabled: boolean;
  volume: number;
  toggleMusic: () => void;
  toggleSfx: () => void;
  setVolume: (v: number) => void;
```

Add to initial state:
```typescript
  musicEnabled: true,
  sfxEnabled: true,
  volume: 0.7,
```

Add actions:
```typescript
  toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
  toggleSfx: () => set((s) => ({ sfxEnabled: !s.sfxEnabled })),
  setVolume: (v) => set({ volume: v }),
```

**Step 2: Create AudioManager.ts**

```typescript
// Singleton audio manager — wraps Web Audio API for game sounds

type SoundName = 'jump' | 'slide' | 'flip' | 'collect' | 'death' | 'lane';

class AudioManagerClass {
  private ctx: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private bgmLoaded = false;

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.connect(this.masterGain);
  }

  async loadSound(name: string, url: string) {
    if (!this.ctx) await this.init();
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const audio = await this.ctx!.decodeAudioData(buf);
      this.buffers.set(name, audio);
    } catch {
      console.warn(`Failed to load sound: ${name} from ${url}`);
    }
  }

  async loadAll() {
    await this.init();
    const sounds: [string, string][] = [
      ['bgm', '/audio/bgm.mp3'],
      ['jump', '/audio/jump.mp3'],
      ['slide', '/audio/slide.mp3'],
      ['flip', '/audio/flip.mp3'],
      ['collect', '/audio/collect.mp3'],
      ['death', '/audio/death.mp3'],
      ['lane', '/audio/lane.mp3'],
    ];

    await Promise.allSettled(sounds.map(([name, url]) => this.loadSound(name, url)));
    this.bgmLoaded = this.buffers.has('bgm');
  }

  playSfx(name: SoundName, volume = 1) {
    if (!this.ctx || !this.masterGain) return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  startBgm() {
    if (!this.ctx || !this.bgmGain || !this.bgmLoaded) return;
    this.stopBgm();

    const buffer = this.buffers.get('bgm');
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.bgmGain);
    source.start();
    this.bgmSource = source;
  }

  stopBgm() {
    if (this.bgmSource) {
      try { this.bgmSource.stop(); } catch { /* ignore */ }
      this.bgmSource = null;
    }
  }

  setBgmVolume(v: number) {
    if (this.bgmGain) this.bgmGain.gain.value = v;
  }

  setMasterVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const AudioManager = new AudioManagerClass();
```

**Step 3: Commit**

```bash
git add src/game/systems/AudioManager.ts src/game/core/GameState.ts
git commit -m "feat: add audio manager and audio state to game store"
```

---

### Task 15: Wire Audio into Game Events

**Files:**
- Create: `src/game/systems/AudioBridge.ts`
- Modify: `src/game/components/GameLoop.tsx`
- Modify: `src/game/ui/MenuOverlay.tsx`

**Step 1: Create AudioBridge — subscribes to game state and plays sounds**

```typescript
import { useEffect, useRef } from 'react';
import { useGameStore } from '../core/GameState';
import { AudioManager } from './AudioManager';

// Bridges game state changes to audio playback
export function useAudioBridge() {
  const phase = useGameStore((s) => s.phase);
  const isJumping = useGameStore((s) => s.isJumping);
  const isSliding = useGameStore((s) => s.isSliding);
  const worldSide = useGameStore((s) => s.worldSide);
  const coins = useGameStore((s) => s.coins);
  const lane = useGameStore((s) => s.lane);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const musicEnabled = useGameStore((s) => s.musicEnabled);
  const volume = useGameStore((s) => s.volume);

  const prevPhase = useRef(phase);
  const prevJumping = useRef(isJumping);
  const prevSliding = useRef(isSliding);
  const prevWorldSide = useRef(worldSide);
  const prevCoins = useRef(coins);
  const prevLane = useRef(lane);

  // Initialize audio on first interaction
  useEffect(() => {
    AudioManager.loadAll();
  }, []);

  // Volume control
  useEffect(() => {
    AudioManager.setMasterVolume(volume);
  }, [volume]);

  // Music control
  useEffect(() => {
    if (phase === 'playing' && musicEnabled) {
      AudioManager.resume();
      AudioManager.startBgm();
    } else {
      AudioManager.stopBgm();
    }
  }, [phase, musicEnabled]);

  // SFX triggers
  useEffect(() => {
    if (!sfxEnabled) return;

    // Game start
    if (phase === 'playing' && prevPhase.current !== 'playing') {
      AudioManager.resume();
    }

    // Death
    if (phase === 'dead' && prevPhase.current === 'playing') {
      AudioManager.playSfx('death');
    }

    prevPhase.current = phase;
  }, [phase, sfxEnabled]);

  useEffect(() => {
    if (!sfxEnabled || phase !== 'playing') return;
    if (isJumping && !prevJumping.current) AudioManager.playSfx('jump');
    prevJumping.current = isJumping;
  }, [isJumping, sfxEnabled, phase]);

  useEffect(() => {
    if (!sfxEnabled || phase !== 'playing') return;
    if (isSliding && !prevSliding.current) AudioManager.playSfx('slide');
    prevSliding.current = isSliding;
  }, [isSliding, sfxEnabled, phase]);

  useEffect(() => {
    if (!sfxEnabled || phase !== 'playing') return;
    if (worldSide !== prevWorldSide.current) AudioManager.playSfx('flip');
    prevWorldSide.current = worldSide;
  }, [worldSide, sfxEnabled, phase]);

  useEffect(() => {
    if (!sfxEnabled || phase !== 'playing') return;
    if (coins > prevCoins.current) AudioManager.playSfx('collect', 0.8);
    prevCoins.current = coins;
  }, [coins, sfxEnabled, phase]);

  useEffect(() => {
    if (!sfxEnabled || phase !== 'playing') return;
    if (lane !== prevLane.current) AudioManager.playSfx('lane', 0.4);
    prevLane.current = lane;
  }, [lane, sfxEnabled, phase]);
}
```

**Step 2: Wire into GameLoop**

In `GameLoop.tsx`, import and call `useAudioBridge()`:

```typescript
import { useAudioBridge } from '../systems/AudioBridge';
```

Add `useAudioBridge();` inside `GameLoop()` after `usePlayerInput()`.

**Step 3: Add mute buttons to MenuOverlay**

In `MenuOverlay.tsx`, add sound toggle buttons after the instructions text:

```typescript
const musicEnabled = useGameStore((s) => s.musicEnabled);
const sfxEnabled = useGameStore((s) => s.sfxEnabled);
const toggleMusic = useGameStore((s) => s.toggleMusic);
const toggleSfx = useGameStore((s) => s.toggleSfx);
```

Add after the instructions div:
```tsx
<div style={{
  marginTop: 16,
  display: 'flex',
  gap: 12,
  fontSize: '0.8rem',
}}>
  <button
    onClick={toggleMusic}
    style={{
      background: 'transparent',
      border: `1px solid ${THEME.colors.neonCyan}`,
      color: musicEnabled ? THEME.colors.neonCyan : '#555',
      padding: '6px 12px',
      borderRadius: 4,
      fontFamily: 'monospace',
      cursor: 'pointer',
    }}
  >
    Music: {musicEnabled ? 'ON' : 'OFF'}
  </button>
  <button
    onClick={toggleSfx}
    style={{
      background: 'transparent',
      border: `1px solid ${THEME.colors.neonCyan}`,
      color: sfxEnabled ? THEME.colors.neonCyan : '#555',
      padding: '6px 12px',
      borderRadius: 4,
      fontFamily: 'monospace',
      cursor: 'pointer',
    }}
  >
    SFX: {sfxEnabled ? 'ON' : 'OFF'}
  </button>
</div>
```

**Step 4: Verify everything**

```bash
pnpm dev
```

- If audio files exist in `public/audio/`, sounds play on game events
- If audio files don't exist, the game works silently (AudioManager warns in console)
- Music/SFX toggle buttons appear on menu screen

**Step 5: Commit**

```bash
git add src/game/systems/AudioBridge.ts src/game/components/GameLoop.tsx src/game/ui/MenuOverlay.tsx src/game/core/GameState.ts
git commit -m "feat: wire audio manager to game events with music and SFX controls"
```

---

## Final Verification

After completing all layers:

```bash
pnpm build
```

Verify no type errors, no build warnings.

```bash
pnpm dev
```

Full manual test:
- [ ] Loading screen appears briefly
- [ ] Menu screen shows with music/SFX toggles
- [ ] Game starts on button click
- [ ] Player runs forward (character model if available, else cyan box)
- [ ] Lane switching works (left/right)
- [ ] Jump clears low obstacles
- [ ] Slide passes under tall obstacles
- [ ] Gravity flip works with camera follow
- [ ] Buildings scroll on both sides
- [ ] Collectible orbs appear and can be collected
- [ ] Coin counter in HUD updates
- [ ] Player trail particles visible
- [ ] Flip triggers particle burst
- [ ] Death triggers shatter effect
- [ ] Sounds play on game events (if audio files present)
- [ ] Game over screen shows score + coins
- [ ] Retry works correctly

---

## Asset Checklist

These files need to be sourced/created separately (not generated by code):

| File | Source | Notes |
|------|--------|-------|
| `public/models/character.glb` | Mixamo | Rigged humanoid + run/jump/slide/death anims |
| `public/models/obstacles/barrier.glb` | Sketchfab/Kenney | Optional — primitives work as fallback |
| `public/models/obstacles/tall.glb` | Sketchfab/Kenney | Optional |
| `public/models/obstacles/low.glb` | Sketchfab/Kenney | Optional |
| `public/audio/bgm.mp3` | Pixabay | Synthwave loop |
| `public/audio/jump.mp3` | jsfxr | Rising synth tone |
| `public/audio/slide.mp3` | jsfxr | Low swoosh |
| `public/audio/flip.mp3` | jsfxr | Deep bass drop |
| `public/audio/collect.mp3` | jsfxr | Bright chime |
| `public/audio/death.mp3` | jsfxr | Glitch crash |
| `public/audio/lane.mp3` | jsfxr | Subtle whoosh |
