import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, Color } from 'three';
import type { InstancedMesh } from 'three';
import { useRunnerStore } from '../core/RunnerState';
import { RUNNER } from '../config/RunnerConfig';
import { URBAN_THEME } from '../config/RunnerTheme';

export function RunnerEnvironment() {
  const theme = URBAN_THEME;

  return (
    <>
      <Ground theme={theme} />
      <LaneMarkers theme={theme} />
      <Rails theme={theme} />
      <Buildings theme={theme} />
      <ambientLight intensity={theme.lighting.ambient} />
      <hemisphereLight args={['#b0d0ff', '#303030', 0.4]} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={theme.lighting.directional.intensity}
        color={theme.lighting.directional.color}
        castShadow
      />
      <fog attach="fog" args={[theme.fog.color, theme.fog.near, theme.fog.far]} />
    </>
  );
}

// Number of tiles to place behind the camera to cover bottom-of-screen view
const GROUND_BEHIND = 5;

function Ground({ theme }: { theme: typeof URBAN_THEME }) {
  const ref = useRef<InstancedMesh>(null!);
  const count = RUNNER.tileCount;
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(theme.ground.color), [theme]);

  useFrame(() => {
    const { distance } = useRunnerStore.getState();
    const totalLen = count * RUNNER.tileLength;
    // Each tile wraps individually: compute its base Z, then wrap into the
    // visible window [-totalLen + GROUND_BEHIND * tileLength, GROUND_BEHIND * tileLength]
    const behindZ = GROUND_BEHIND * RUNNER.tileLength;

    for (let i = 0; i < count; i++) {
      // Raw position that scrolls with distance
      let z = (-i * RUNNER.tileLength) + (distance % totalLen);
      // Wrap individual tile: keep within [-totalLen + behindZ, behindZ]
      if (z > behindZ) z -= totalLen;
      if (z < -totalLen + behindZ) z += totalLen;
      dummy.position.set(0, -0.05, z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[12, 0.1, RUNNER.tileLength - 0.05]} />
      <meshStandardMaterial
        color={color}
        emissive={theme.ground.emissive}
        emissiveIntensity={0.15}
        metalness={0.1}
        roughness={0.9}
      />
    </instancedMesh>
  );
}

const LANE_MARKER_BEHIND = 3;

function LaneMarkers({ theme }: { theme: typeof URBAN_THEME }) {
  const ref = useRef<InstancedMesh>(null!);
  const markerPositionsX = [-1, 1];
  const stripeCount = 20;
  const totalCount = markerPositionsX.length * stripeCount;
  const dummy = useMemo(() => new Object3D(), []);
  const stripeSpacing = 4;
  const totalLen = stripeCount * stripeSpacing;
  const behindZ = LANE_MARKER_BEHIND * stripeSpacing;

  useFrame(() => {
    const { distance } = useRunnerStore.getState();
    let idx = 0;

    for (const mx of markerPositionsX) {
      for (let i = 0; i < stripeCount; i++) {
        let z = -i * stripeSpacing + (distance % totalLen);
        if (z > behindZ) z -= totalLen;
        if (z < -totalLen + behindZ) z += totalLen;
        dummy.position.set(mx, 0.01, z);
        dummy.updateMatrix();
        ref.current.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, totalCount]}>
      <boxGeometry args={[0.08, 0.02, 1.5]} />
      <meshStandardMaterial
        color={theme.lanes.color}
        transparent
        opacity={theme.lanes.opacity}
      />
    </instancedMesh>
  );
}

const RAIL_BEHIND = 3;

function Rails({ theme }: { theme: typeof URBAN_THEME }) {
  const ref = useRef<InstancedMesh>(null!);
  const railPositionsX = [-3, 3];
  const segmentCount = 24;
  const totalCount = railPositionsX.length * segmentCount;
  const dummy = useMemo(() => new Object3D(), []);
  const totalLen = segmentCount * RUNNER.tileLength;
  const behindZ = RAIL_BEHIND * RUNNER.tileLength;

  useFrame(() => {
    const { distance } = useRunnerStore.getState();
    let idx = 0;

    for (const rx of railPositionsX) {
      for (let i = 0; i < segmentCount; i++) {
        let z = -i * RUNNER.tileLength + (distance % totalLen);
        if (z > behindZ) z -= totalLen;
        if (z < -totalLen + behindZ) z += totalLen;
        dummy.position.set(rx, 0.05, z);
        dummy.updateMatrix();
        ref.current.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, totalCount]}>
      <boxGeometry args={[0.06, 0.08, RUNNER.tileLength - 0.1]} />
      <meshStandardMaterial color={theme.rails.color} metalness={0.8} roughness={0.2} />
    </instancedMesh>
  );
}

const BUILDING_BEHIND = 3;

function Buildings({ theme }: { theme: typeof URBAN_THEME }) {
  const leftRef = useRef<InstancedMesh>(null!);
  const rightRef = useRef<InstancedMesh>(null!);
  const count = RUNNER.buildingCount;
  const dummy = useMemo(() => new Object3D(), []);

  const buildingData = useMemo(() => {
    const data: { height: number; colorIndex: number }[] = [];
    for (let i = 0; i < count; i++) {
      const seed = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const rand = seed - Math.floor(seed);
      const height = RUNNER.buildingMinHeight + rand * (RUNNER.buildingMaxHeight - RUNNER.buildingMinHeight);
      const colorIndex = Math.floor(rand * theme.buildings.colors.length) % theme.buildings.colors.length;
      data.push({ height, colorIndex });
    }
    return data;
  }, [count, theme]);

  const spacing = RUNNER.buildingDepth + 1.0;
  const totalLen = count * spacing;
  const behindZ = BUILDING_BEHIND * spacing;

  useFrame(() => {
    const { distance } = useRunnerStore.getState();

    for (let i = 0; i < count; i++) {
      const { height } = buildingData[i];
      // Individual wrapping: each building recycles from behind camera to far end
      let z = -i * spacing + (distance % totalLen);
      if (z > behindZ) z -= totalLen;
      if (z < -totalLen + behindZ) z += totalLen;

      dummy.position.set(-RUNNER.buildingOffsetX, height / 2, z);
      dummy.scale.set(RUNNER.buildingWidth, height, RUNNER.buildingDepth);
      dummy.updateMatrix();
      leftRef.current.setMatrixAt(i, dummy.matrix);

      dummy.position.set(RUNNER.buildingOffsetX, height / 2, z);
      dummy.updateMatrix();
      rightRef.current.setMatrixAt(i, dummy.matrix);
    }

    leftRef.current.instanceMatrix.needsUpdate = true;
    rightRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={leftRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={theme.buildings.colors[0]} emissive={theme.buildings.emissive} emissiveIntensity={0.1} />
      </instancedMesh>
      <instancedMesh ref={rightRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={theme.buildings.colors[1]} emissive={theme.buildings.emissive} emissiveIntensity={0.1} />
      </instancedMesh>
    </>
  );
}
