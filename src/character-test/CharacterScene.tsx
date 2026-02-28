import { OrbitControls, Grid } from '@react-three/drei';
import { Character } from './Character';
import { useCharacterInput } from './useCharacterInput';

export function CharacterScene() {
  useCharacterInput();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#8080ff" />

      {/* Ground platform */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Grid overlay for spatial reference */}
      <Grid
        position={[0, 0.01, 0]}
        args={[40, 40]}
        cellSize={1}
        cellColor="#404060"
        sectionSize={5}
        sectionColor="#6060a0"
        fadeDistance={25}
        infiniteGrid
      />

      {/* Character */}
      <Character />

      {/* Camera controls - orbit around the character */}
      <OrbitControls
        target={[0, 1, 0]}
        minDistance={2}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}
