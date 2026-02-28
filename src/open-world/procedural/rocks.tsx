import { useMemo } from 'react';
import * as THREE from 'three';

const rockColors = ['#7a7a7a', '#6b6b5e', '#8a8275', '#5c5c4f'];

export function LowPolyRock({ position, scale, rotation }: {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}) {
  const colorIdx = Math.abs(Math.floor(position[0] * 3 + position[2] * 7)) % rockColors.length;
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.5, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const noise = 0.85 + Math.sin(x * 5.1 + z * 3.7) * 0.15;
      pos.setXYZ(i, x * noise, y * 0.7 * noise, z * noise);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  return (
    <mesh position={position} scale={scale} rotation={rotation} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={rockColors[colorIdx]} flatShading />
    </mesh>
  );
}
