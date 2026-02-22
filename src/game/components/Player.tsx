import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Mesh } from 'three';
import { useGameStore } from '../core/GameState';
import { GAME } from '../config/GameConfig';
import { ASSETS } from '../config/AssetRegistry';
import { useWorldFlip } from '../systems/WorldFlipSystem';
import { checkCollision } from '../systems/ObstacleSystem';

export function Player() {
  const meshRef = useRef<Mesh>(null!);
  const { getFlipY, getFlipRotationX } = useWorldFlip();

  // Smooth lane position
  const currentX = useRef<number>(GAME.lanePositions[1]);
  // Jump arc
  const jumpT = useRef(0);

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
    } else {
      jumpT.current = 0;
    }

    // Slide scale
    const scaleY = state.isSliding ? GAME.slideScale : 1;

    // Flip Y
    const baseY = getFlipY();
    const flipRot = getFlipRotationX();
    const flipDir = state.worldSide === 'bottom' ? 1 : -1;

    const finalY = baseY + jumpOffset * flipDir;

    meshRef.current.position.set(currentX.current, finalY, 0);
    meshRef.current.rotation.x = flipRot;
    meshRef.current.scale.set(1, scaleY, 1);

    // Collision
    if (checkCollision(state.lane, state.worldSide, finalY, state.isSliding)) {
      state.die();
    }

    // Score + speed ramp
    state.addScore(Math.round(GAME.scorePerSecond * delta * (state.speed / GAME.initialSpeed)));
    state.setDistance(state.distance + state.speed * delta);
    state.setSpeed(Math.min(GAME.maxSpeed, state.speed + GAME.speedRampPerSecond * delta));
  });

  const a = ASSETS.player;

  return (
    <mesh ref={meshRef} position={[0, GAME.playerY, 0]}>
      <boxGeometry args={a.scale as [number, number, number]} />
      <meshStandardMaterial
        color={a.color}
        emissive={a.emissive}
        emissiveIntensity={a.emissiveIntensity}
        metalness={a.metalness}
        roughness={a.roughness}
      />
    </mesh>
  );
}
