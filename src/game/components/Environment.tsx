import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { InstancedMesh } from 'three';
import { Object3D, Color } from 'three';
import { GAME } from '../config/GameConfig';
import { THEME } from '../config/ThemeConfig';
import { useGameStore } from '../core/GameState';

// Scrolling ground plane made of tiled strips for both worlds
export function Environment() {
  return (
    <>
      <Ground world="bottom" />
      <Ground world="top" />
      <LaneMarkers world="bottom" />
      <LaneMarkers world="top" />
      <SideWalls />
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 10, 5]} intensity={0.4} color="#8080ff" />
      <pointLight position={[0, 3, -10]} intensity={1.5} color={THEME.colors.neonCyan} distance={30} />
      <pointLight position={[0, 3, -30]} intensity={1.0} color={THEME.colors.neonMagenta} distance={30} />
      <fog attach="fog" args={[THEME.colors.fog, THEME.fog.near, THEME.fog.far]} />
    </>
  );
}

function Ground({ world }: { world: 'bottom' | 'top' }) {
  const ref = useRef<InstancedMesh>(null!);
  const count = GAME.tileCount;
  const dummy = useMemo(() => new Object3D(), []);

  const y = world === 'bottom' ? -0.05 : GAME.mirrorGap + 0.05;
  const color = new Color(THEME.colors.groundTop);

  useFrame(() => {
    const { distance } = useGameStore.getState();
    const offset = distance % GAME.tileLength;

    for (let i = 0; i < count; i++) {
      const z = -i * GAME.tileLength + offset;
      dummy.position.set(0, y, z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[12, 0.1, GAME.tileLength - 0.05]} />
      <meshStandardMaterial
        color={color}
        emissive={THEME.colors.gridLine}
        emissiveIntensity={0.2}
        metalness={0.9}
        roughness={0.1}
      />
    </instancedMesh>
  );
}

function LaneMarkers({ world }: { world: 'bottom' | 'top' }) {
  const ref = useRef<InstancedMesh>(null!);
  // Lines between lanes: at x = -1 and x = 1
  const markerPositionsX = [-1, 1];
  const stripeCount = 20;
  const totalCount = markerPositionsX.length * stripeCount;
  const dummy = useMemo(() => new Object3D(), []);

  const y = world === 'bottom' ? 0.01 : GAME.mirrorGap - 0.01;

  useFrame(() => {
    const { distance } = useGameStore.getState();
    const offset = distance % 4;
    let idx = 0;

    for (const mx of markerPositionsX) {
      for (let i = 0; i < stripeCount; i++) {
        const z = -i * 4 + offset;
        dummy.position.set(mx, y, z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        ref.current.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, totalCount]}>
      <boxGeometry args={[0.05, 0.02, 1.5]} />
      <meshStandardMaterial
        color={THEME.colors.neonCyan}
        emissive={THEME.colors.neonCyan}
        emissiveIntensity={0.6}
        transparent
        opacity={0.5}
      />
    </instancedMesh>
  );
}

function SideWalls() {
  const wallColor = new Color(THEME.colors.neonMagenta);

  return (
    <>
      {/* Left wall */}
      <mesh position={[-5.5, GAME.mirrorGap / 2, -30]}>
        <boxGeometry args={[0.1, GAME.mirrorGap, 80]} />
        <meshStandardMaterial
          color={wallColor}
          emissive={THEME.colors.neonMagenta}
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Right wall */}
      <mesh position={[5.5, GAME.mirrorGap / 2, -30]}>
        <boxGeometry args={[0.1, GAME.mirrorGap, 80]} />
        <meshStandardMaterial
          color={wallColor}
          emissive={THEME.colors.neonMagenta}
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
        />
      </mesh>
    </>
  );
}
