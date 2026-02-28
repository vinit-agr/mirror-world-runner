import { useMemo } from 'react';
import type { WorldTheme, ChunkObject } from './themes/types';
import { LowPolyTree } from './procedural/trees';
import { LowPolyRock } from './procedural/rocks';

type ChunkProps = {
  chunkX: number;
  chunkZ: number;
  chunkSize: number;
  theme: WorldTheme;
};

function ChunkObjectRenderer({ obj }: { obj: ChunkObject }) {
  switch (obj.type) {
    case 'tree':
      return <LowPolyTree position={obj.position} scale={obj.scale} rotation={obj.rotation} />;
    case 'rock':
      return <LowPolyRock position={obj.position} scale={obj.scale} rotation={obj.rotation} />;
    case 'grass':
      return (
        <mesh position={obj.position} scale={obj.scale} rotation={obj.rotation}>
          <coneGeometry args={[0.5, 1, 4]} />
          <meshStandardMaterial color="#3d8b3d" flatShading />
        </mesh>
      );
    default:
      return null;
  }
}

export function Chunk({ chunkX, chunkZ, chunkSize, theme }: ChunkProps) {
  const worldX = chunkX * chunkSize;
  const worldZ = chunkZ * chunkSize;
  const objects = useMemo(
    () => theme.generateChunkObjects(chunkX, chunkZ, chunkSize),
    [chunkX, chunkZ, chunkSize, theme],
  );
  const isAlt = (chunkX + chunkZ) % 2 === 0;
  const groundColor = isAlt ? theme.ground.color : theme.ground.colorAlt;

  return (
    <group>
      <mesh position={[worldX, 0, worldZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[chunkSize, chunkSize]} />
        <meshStandardMaterial color={groundColor} flatShading />
      </mesh>
      {objects.map((obj, i) => (
        <ChunkObjectRenderer key={`${chunkX}_${chunkZ}_${i}`} obj={obj} />
      ))}
    </group>
  );
}
