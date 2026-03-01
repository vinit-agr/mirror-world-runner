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
