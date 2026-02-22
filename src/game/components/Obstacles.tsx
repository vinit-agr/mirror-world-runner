import { useGameStore, type Obstacle as ObstacleData } from '../core/GameState';
import { GAME } from '../config/GameConfig';
import { ASSETS } from '../config/AssetRegistry';
import { useObstacleSystem } from '../systems/ObstacleSystem';

const VARIANT_ASSET = {
  barrier: ASSETS.obstacleBarrier,
  tall: ASSETS.obstacleTall,
  low: ASSETS.obstacleLow,
} as const;

function ObstacleMesh({ obs }: { obs: ObstacleData }) {
  const asset = VARIANT_ASSET[obs.variant];
  const [sx, sy, sz] = asset.scale;

  // Position: lane X, world Y, z along track
  const x = GAME.lanePositions[obs.lane];
  const baseY = obs.world === 'bottom' ? sy / 2 : GAME.mirrorGap - sy / 2;

  return (
    <mesh position={[x, baseY, obs.z]}>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial
        color={asset.color}
        emissive={asset.emissive}
        emissiveIntensity={asset.emissiveIntensity}
        metalness={asset.metalness}
        roughness={asset.roughness}
      />
    </mesh>
  );
}

export function Obstacles() {
  // Run the obstacle spawn/move system
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
