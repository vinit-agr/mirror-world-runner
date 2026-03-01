import * as THREE from 'three';

const trunkColor = new THREE.Color('#8B6914');
const canopyColors = ['#2d8a4e', '#3a9d5e', '#228b22', '#1e7a3c'];

export function LowPolyTree({ position, scale, rotation }: {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}) {
  const colorIdx = Math.abs(Math.floor(position[0] * 7 + position[2] * 13)) % canopyColors.length;
  const canopyColor = canopyColors[colorIdx];
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 1.2, 6]} />
        <meshStandardMaterial color={trunkColor} flatShading />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[0.7, 1.6, 6]} />
        <meshStandardMaterial color={canopyColor} flatShading />
      </mesh>
    </group>
  );
}
