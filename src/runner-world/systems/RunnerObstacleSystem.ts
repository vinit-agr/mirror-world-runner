import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useRunnerStore } from '../core/RunnerState';
import { RUNNER, OBSTACLE_MODELS } from '../config/RunnerConfig';

// ── Preloaded model cache ────────────────────────────────────────────────
type CachedObstacle = {
  scene: THREE.Group;
  halfExtents: [number, number, number];
};

const modelCache = new Map<string, CachedObstacle>();
let loadPromise: Promise<void> | null = null;
let modelsReady = false;

/**
 * Preload all obstacle GLB models and compute their half-extents at RUNNER.obstacleScale.
 * Called once; subsequent calls return the same promise.
 */
export function preloadObstacleModels(): Promise<void> {
  if (loadPromise) return loadPromise;

  const loader = new GLTFLoader();
  const scale = RUNNER.obstacleScale;

  const promises = OBSTACLE_MODELS.map(
    (def) =>
      new Promise<void>((resolve) => {
        loader.load(
          `/models/obstacles/street/${def.file}`,
          (gltf) => {
            const scene = gltf.scene;

            // Enable shadows
            scene.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).castShadow = true;
                (child as THREE.Mesh).receiveShadow = true;
              }
            });

            // Compute bounding box at target scale
            const tmp = scene.clone();
            tmp.scale.setScalar(scale);
            tmp.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(tmp);
            const size = new THREE.Vector3();
            box.getSize(size);

            modelCache.set(def.file, {
              scene,
              halfExtents: [size.x / 2, size.y / 2, size.z / 2],
            });
            resolve();
          },
          undefined,
          (err) => {
            console.error(`[ObstacleSystem] Failed to load ${def.file}:`, err);
            resolve(); // Don't block other models
          },
        );
      }),
  );

  loadPromise = Promise.all(promises).then(() => {
    modelsReady = true;
    console.log(`[ObstacleSystem] Loaded ${modelCache.size}/${OBSTACLE_MODELS.length} obstacle models`);
  });
  return loadPromise;
}

/** Clone a preloaded model scene. Returns null if not loaded. */
export function cloneObstacleModel(file: string): THREE.Group | null {
  const cached = modelCache.get(file);
  if (!cached) return null;
  return cached.scene.clone();
}

/** Get the half-extents for a model variant (at RUNNER.obstacleScale). */
export function getObstacleHalfExtents(variant: string): [number, number, number] {
  const cached = modelCache.get(variant);
  if (cached) return cached.halfExtents;
  // Fallback — should not happen after preload
  return [0.3, 0.5, 0.3];
}

// ── Obstacle spawn/move system ───────────────────────────────────────────

export function useRunnerObstacleSystem() {
  const spawnTimer = useRef(0);

  useFrame((_, delta) => {
    if (!modelsReady) return; // Wait until models are loaded

    const state = useRunnerStore.getState();
    const { speed, isBlocked } = state;

    // Only accumulate distance when not blocked
    const effectiveSpeed = isBlocked ? 0 : speed;
    state.setDistance(state.distance + effectiveSpeed * delta);

    // Spawn logic — fixed interval (skip spawning when blocked)
    if (!isBlocked) spawnTimer.current += delta;
    if (spawnTimer.current >= RUNNER.obstacleSpawnInterval) {
      spawnTimer.current = 0;

      const lane = Math.floor(Math.random() * RUNNER.laneCount);
      const model = OBSTACLE_MODELS[Math.floor(Math.random() * OBSTACLE_MODELS.length)];

      state.spawnObstacle({
        lane,
        z: RUNNER.obstacleStartZ,
        variant: model.file,
        active: true,
      });
    }

    // Move + despawn obstacles in a single batched update
    const obstacles = useRunnerStore.getState().obstacles;
    let needsPrune = false;
    const updated = obstacles.map((obs) => {
      if (!obs.active) return obs;
      const newZ = obs.z + effectiveSpeed * delta;
      if (newZ > RUNNER.obstacleDespawnZ) {
        needsPrune = true;
        return { ...obs, active: false };
      }
      return { ...obs, z: newZ };
    });
    // Prune inactive obstacles periodically
    const final = needsPrune && updated.length > RUNNER.obstaclePoolSize * 2
      ? updated.filter((o) => o.active)
      : updated;
    useRunnerStore.setState({ obstacles: final });
  });
}

/**
 * Check all active obstacles for collision with the player.
 * Returns { count, ids } — count for debug display, ids for visual feedback.
 */
export function checkRunnerCollision(
  playerLane: number,
  playerY: number,
  isSliding: boolean,
): { count: number; ids: Set<number> } {
  const obstacles = useRunnerStore.getState().obstacles;
  const px = RUNNER.lanePositions[playerLane];
  const [hx, hy, hz] = RUNNER.playerHitboxHalf;
  const effectiveHy = isSliding ? RUNNER.playerSlideHitboxHalfY : hy;

  const ids = new Set<number>();

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
      ids.add(obs.id);
    }
  }

  return { count: ids.size, ids };
}
