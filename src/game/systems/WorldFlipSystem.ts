// World flip / gravity inversion system
// Manages the visual + logical transition between bottom and top mirror worlds

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useGameStore } from '../core/GameState';
import { GAME } from '../config/GameConfig';

export function useWorldFlip() {
  // Current interpolated Y position and rotation of the player "rig"
  const flipProgress = useRef(0); // 0 = bottom, 1 = top
  const targetFlip = useRef(0);

  useFrame((_, delta) => {
    const { worldSide, phase } = useGameStore.getState();
    if (phase !== 'playing') return;

    targetFlip.current = worldSide === 'bottom' ? 0 : 1;

    // Smooth lerp
    const lerpSpeed = 1 / GAME.flipDuration;
    flipProgress.current = MathUtils.lerp(
      flipProgress.current,
      targetFlip.current,
      Math.min(1, lerpSpeed * delta * 4),
    );
  });

  const getFlipY = () => {
    const t = flipProgress.current;
    return MathUtils.lerp(GAME.playerY, GAME.mirrorGap - GAME.playerY, t);
  };

  const getFlipRotationX = () => {
    return flipProgress.current * Math.PI;
  };

  return { flipProgress, getFlipY, getFlipRotationX };
}
