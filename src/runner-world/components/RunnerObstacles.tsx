import { useRunnerStore, type RunnerObstacle } from '../core/RunnerState';
import { useRunnerObstacleSystem, getObstacleHalfExtents } from '../systems/RunnerObstacleSystem';
import { RUNNER } from '../config/RunnerConfig';
import { URBAN_THEME } from '../config/RunnerTheme';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

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

export function PlayerDebugWireframe({ playerXRef, playerYRef }: {
  playerXRef: React.RefObject<number>;
  playerYRef: React.RefObject<number>;
}) {
  const showHitboxes = useRunnerStore((s) => s.showHitboxes);
  const isSliding = useRunnerStore((s) => s.isSliding);
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
