// Obstacle spawning + recycling logic

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, type WorldSide } from '../core/GameState';
import { GAME } from '../config/GameConfig';

const VARIANTS = ['barrier', 'tall', 'low'] as const;

export function useObstacleSystem() {
  const spawnTimer = useRef(0);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;

    const { speed } = state;

    // Spawn logic
    const interval = Math.max(
      GAME.minSpawnInterval,
      GAME.obstacleSpawnInterval - state.distance * 0.0003,
    );

    spawnTimer.current += delta;
    if (spawnTimer.current >= interval) {
      spawnTimer.current = 0;

      const lane = Math.floor(Math.random() * GAME.laneCount);
      const world: WorldSide = Math.random() < 0.5 ? 'bottom' : 'top';
      const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];

      state.spawnObstacle({
        lane,
        z: GAME.obstacleStartZ,
        world,
        variant,
        active: true,
      });
    }

    // Move + recycle obstacles
    const obstacles = useGameStore.getState().obstacles;
    for (const obs of obstacles) {
      if (!obs.active) continue;
      const newZ = obs.z + speed * delta;
      if (newZ > GAME.obstacleDespawnZ) {
        state.deactivateObstacle(obs.id);
      } else {
        state.updateObstacle(obs.id, { z: newZ });
      }
    }

    // Prune inactive obstacles periodically
    const all = useGameStore.getState().obstacles;
    if (all.length > GAME.obstaclePoolSize * 2) {
      useGameStore.setState({ obstacles: all.filter((o) => o.active) });
    }
  });
}

// Collision check — called per frame from the game loop
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

    // Obstacle half-extents (rough)
    const ohx = 0.5;
    const ohy = obs.variant === 'tall' ? 1.0 : obs.variant === 'low' ? 0.25 : 0.6;
    const ohz = 0.2;

    // Obstacle Y center
    const obstacleBaseY = obs.world === 'bottom' ? ohy : GAME.mirrorGap - ohy;
    const obstacleY = obstacleBaseY;

    // Player effective Y height
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
