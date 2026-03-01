import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from './worldStore';

export function FollowCamera() {
  const controlsRef = useRef<any>(null!);

  useFrame(() => {
    if (!controlsRef.current) return;
    const { playerX, playerZ } = useWorldStore.getState();
    const target = controlsRef.current.target as THREE.Vector3;
    target.lerp(new THREE.Vector3(playerX, 1, playerZ), 0.1);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, 1, 0]}
      minDistance={3}
      maxDistance={12}
      maxPolarAngle={Math.PI / 2 - 0.1}
      minPolarAngle={0.3}
      enablePan={false}
    />
  );
}
