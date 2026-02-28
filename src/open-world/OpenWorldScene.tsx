import { BackSide } from 'three';
import { CharacterController } from './CharacterController';
import { TerrainManager } from './TerrainManager';
import { FollowCamera } from './FollowCamera';
import { lowPolyField } from './themes/lowPolyField';
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

export function OpenWorldScene() {
  const theme = ACTIVE_THEME;
  return (
    <>
      <SkyDome theme={theme} />
      <ambientLight intensity={theme.lighting.ambientIntensity} />
      <directionalLight
        position={theme.lighting.sunPosition}
        intensity={theme.lighting.sunIntensity}
        color={theme.lighting.sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <fog attach="fog" args={[theme.fog.color, theme.fog.near, theme.fog.far]} />
      <Mountains />
      <TerrainManager theme={theme} />
      <CharacterController />
      <FollowCamera />
    </>
  );
}
