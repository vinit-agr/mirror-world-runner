import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRunnerStore, type RunnerObstacle } from '../core/RunnerState';
import {
  useRunnerObstacleSystem,
  getObstacleHalfExtents,
  cloneObstacleModel,
  preloadObstacleModels,
} from '../systems/RunnerObstacleSystem';
import { RUNNER } from '../config/RunnerConfig';

// ── Single obstacle rendered from preloaded GLB ──────────────────────────

function ObstacleMesh({ obs }: { obs: RunnerObstacle }) {
  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Group | null>(null);
  const loadedVariant = useRef('');

  const x = RUNNER.lanePositions[obs.lane];

  useEffect(() => {
    if (!groupRef.current || loadedVariant.current === obs.variant) return;

    // Remove previous clone
    if (modelRef.current) {
      groupRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    const cloned = cloneObstacleModel(obs.variant);
    if (cloned) {
      cloned.scale.setScalar(RUNNER.obstacleScale);
      groupRef.current.add(cloned);
      modelRef.current = cloned;
      loadedVariant.current = obs.variant;
    }
  }, [obs.variant]);

  // Update position each frame (z changes every frame as obstacles move)
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(x, 0, obs.z);
    }
  });

  return <group ref={groupRef} position={[x, 0, obs.z]} />;
}

// ── Debug wireframe for collision box ────────────────────────────────────

function DebugWireframe({ obs, isColliding }: { obs: RunnerObstacle; isColliding: boolean }) {
  const [hx, hy, hz] = getObstacleHalfExtents(obs.variant);
  const x = RUNNER.lanePositions[obs.lane];
  const y = hy; // center Y

  const geometry = useMemo(() => new THREE.BoxGeometry(hx * 2, hy * 2, hz * 2), [hx, hy, hz]);

  return (
    <lineSegments position={[x, y, obs.z]}>
      <edgesGeometry args={[geometry]} />
      <lineBasicMaterial color={isColliding ? '#ffffff' : '#ff0000'} linewidth={isColliding ? 3 : 1} />
    </lineSegments>
  );
}

// ── Player debug wireframe (unchanged) ───────────────────────────────────

export function PlayerDebugWireframe({ playerXRef, playerYRef }: {
  playerXRef: React.RefObject<number>;
  playerYRef: React.RefObject<number>;
}) {
  const showHitboxes = useRunnerStore((s) => s.showHitboxes);
  const isSliding = useRunnerStore((s) => s.isSliding);
  const isBlocked = useRunnerStore((s) => s.isBlocked);
  const lineRef = useRef<THREE.LineSegments>(null!);
  const [hx, hy, hz] = RUNNER.playerHitboxHalf;
  const effectiveHy = isSliding ? RUNNER.playerSlideHitboxHalfY : hy;

  const geometry = useMemo(
    () => new THREE.BoxGeometry(hx * 2, effectiveHy * 2, hz * 2),
    [hx, effectiveHy, hz],
  );

  useFrame(() => {
    if (!lineRef.current) return;
    lineRef.current.position.set(playerXRef.current ?? 0, playerYRef.current ?? 0.5, 0);
  });

  if (!showHitboxes) return null;

  return (
    <lineSegments ref={lineRef} position={[0, 0.5, 0]}>
      <edgesGeometry args={[geometry]} />
      <lineBasicMaterial color={isBlocked ? '#ff0000' : '#00ff00'} linewidth={isBlocked ? 3 : 1} />
    </lineSegments>
  );
}

// ── Main obstacles container ─────────────────────────────────────────────

export function RunnerObstacles() {
  const [ready, setReady] = useState(false);

  // Kick off model preloading on mount
  useEffect(() => {
    preloadObstacleModels().then(() => setReady(true));
  }, []);

  useRunnerObstacleSystem();

  const obstacles = useRunnerStore((s) => s.obstacles);
  const showHitboxes = useRunnerStore((s) => s.showHitboxes);
  const collidingIds = useRunnerStore((s) => s.collidingObstacleIds);

  if (!ready) return null;

  return (
    <>
      {obstacles.map((obs) =>
        obs.active && (
          <group key={obs.id}>
            <ObstacleMesh obs={obs} />
            {showHitboxes && <DebugWireframe obs={obs} isColliding={collidingIds.has(obs.id)} />}
          </group>
        ),
      )}
    </>
  );
}
