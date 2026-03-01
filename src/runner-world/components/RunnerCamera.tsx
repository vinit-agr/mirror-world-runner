import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useRunnerStore } from '../core/RunnerState';
import { RUNNER } from '../config/RunnerConfig';

export function RunnerCamera() {
  const { camera } = useThree();
  const currentX = useRef(0);

  useFrame(() => {
    const { lane } = useRunnerStore.getState();
    const targetX = RUNNER.lanePositions[lane] ?? 0;

    // Smooth follow on X axis when switching lanes
    currentX.current = MathUtils.lerp(currentX.current, targetX * 0.3, 0.05);

    const [ox, oy, oz] = RUNNER.cameraOffset;
    const [lx, ly, lz] = RUNNER.cameraLookAt;

    camera.position.set(currentX.current + ox, oy, oz);
    camera.lookAt(currentX.current + lx, ly, lz);
  });

  return null;
}
