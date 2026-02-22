import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useGameStore } from '../core/GameState';
import { GAME } from '../config/GameConfig';

export function GameCamera() {
  const { camera } = useThree();
  const currentY = useRef(3);

  useFrame(() => {
    const { worldSide, phase } = useGameStore.getState();
    if (phase !== 'playing') {
      camera.position.set(0, 4, 8);
      camera.lookAt(0, GAME.mirrorGap / 2, -10);
      return;
    }

    // Camera follows world side with smooth transition
    const targetY = worldSide === 'bottom' ? 3 : GAME.mirrorGap - 1;
    currentY.current = MathUtils.lerp(currentY.current, targetY, 0.05);

    camera.position.set(0, currentY.current, 6);
    const lookY = worldSide === 'bottom' ? 0.5 : GAME.mirrorGap - 0.5;
    camera.lookAt(0, MathUtils.lerp(camera.position.y, lookY, 0.1), -20);
  });

  return null;
}
