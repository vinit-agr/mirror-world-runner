import { useMemo } from 'react';
import { useWorldStore } from './worldStore';
import { Chunk } from './Chunk';
import type { WorldTheme } from './themes/types';

const CHUNK_SIZE = 32;
const VIEW_RADIUS = 4;

export function TerrainManager({ theme }: { theme: WorldTheme }) {
  const playerX = useWorldStore((s) => s.playerX);
  const playerZ = useWorldStore((s) => s.playerZ);
  const centerChunkX = Math.floor(playerX / CHUNK_SIZE);
  const centerChunkZ = Math.floor(playerZ / CHUNK_SIZE);

  const chunks = useMemo(() => {
    const result: { x: number; z: number }[] = [];
    for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
      for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
        if (dx * dx + dz * dz <= VIEW_RADIUS * VIEW_RADIUS) {
          result.push({ x: centerChunkX + dx, z: centerChunkZ + dz });
        }
      }
    }
    return result;
  }, [centerChunkX, centerChunkZ]);

  return (
    <>
      {chunks.map((c) => (
        <Chunk key={`${c.x}_${c.z}`} chunkX={c.x} chunkZ={c.z} chunkSize={CHUNK_SIZE} theme={theme} />
      ))}
    </>
  );
}
