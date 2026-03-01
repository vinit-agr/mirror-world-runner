import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BackSide } from 'three';
import { CharacterController } from './CharacterController';
import { TerrainManager } from './TerrainManager';
import { FollowCamera } from './FollowCamera';
import { lowPolyField } from './themes/lowPolyField';
import { useWorldStore } from './worldStore';
import type { WorldTheme } from './themes/types';

const ACTIVE_THEME: WorldTheme = lowPolyField;

function SkyDome({ theme }: { theme: WorldTheme }) {
  return (
    <mesh scale={[500, 500, 500]}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshBasicMaterial color={theme.sky.topColor} side={BackSide} />
    </mesh>
  );
}

function Mountains() {
  const mountains = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 150 + Math.sin(i * 3.7) * 30;
    const height = 15 + Math.sin(i * 2.3) * 10;
    const width = 20 + Math.cos(i * 1.7) * 8;
    mountains.push(
      <mesh key={i} position={[Math.cos(angle) * dist, height / 2, Math.sin(angle) * dist]}>
        <coneGeometry args={[width, height, 5]} />
        <meshStandardMaterial color="#5a6a5a" flatShading />
      </mesh>,
    );
  }
  return <>{mountains}</>;
}

function SunLight({ theme }: { theme: WorldTheme }) {
  const lightRef = useRef<THREE.DirectionalLight>(null!);
  const sunOffset = theme.lighting.sunPosition;

  useFrame(() => {
    const { playerX, playerZ } = useWorldStore.getState();
    lightRef.current.position.set(
      playerX + sunOffset[0],
      sunOffset[1],
      playerZ + sunOffset[2],
    );
    lightRef.current.target.position.set(playerX, 0, playerZ);
    lightRef.current.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={lightRef}
      intensity={theme.lighting.sunIntensity}
      color={theme.lighting.sunColor}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-far={80}
      shadow-camera-left={-20}
      shadow-camera-right={20}
      shadow-camera-top={20}
      shadow-camera-bottom={-20}
    />
  );
}

export function OpenWorldScene() {
  const theme = ACTIVE_THEME;
  return (
    <>
      <SkyDome theme={theme} />
      <ambientLight intensity={theme.lighting.ambientIntensity} />
      <SunLight theme={theme} />
      <fog attach="fog" args={[theme.fog.color, theme.fog.near, theme.fog.far]} />
      <Mountains />
      <TerrainManager theme={theme} />
      <CharacterController />
      <FollowCamera />
    </>
  );
}
