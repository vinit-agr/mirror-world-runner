import type { WorldTheme, ChunkObject } from './types';
import { chunkRandom } from '../procedural/noise';

const TREES_PER_CHUNK = 5;
const ROCKS_PER_CHUNK = 3;
const GRASS_PER_CHUNK = 12;

export const lowPolyField: WorldTheme = {
  name: 'Low-Poly Field',
  ground: { color: '#4a7c4f', colorAlt: '#3d6b42' },
  sky: { topColor: '#87ceeb', bottomColor: '#d4e8f0' },
  fog: { color: '#c8dce8', near: 40, far: 120 },
  lighting: {
    ambientIntensity: 0.6,
    sunColor: '#fffae0',
    sunIntensity: 1.0,
    sunPosition: [30, 50, 20],
  },
  generateChunkObjects(chunkX, chunkZ, chunkSize) {
    const objects: ChunkObject[] = [];
    let idx = 0;
    // Trees
    for (let i = 0; i < TREES_PER_CHUNK; i++) {
      const r1 = chunkRandom(chunkX, chunkZ, idx++);
      const r2 = chunkRandom(chunkX, chunkZ, idx++);
      const r3 = chunkRandom(chunkX, chunkZ, idx++);
      const x = (r1 - 0.5) * chunkSize;
      const z = (r2 - 0.5) * chunkSize;
      if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
      const scale = 0.6 + r3 * 0.8;
      objects.push({
        type: 'tree',
        position: [chunkX * chunkSize + x, 0, chunkZ * chunkSize + z],
        scale: [scale, scale + r3 * 0.4, scale],
        rotation: [0, r1 * Math.PI * 2, 0],
      });
    }
    // Rocks
    for (let i = 0; i < ROCKS_PER_CHUNK; i++) {
      const r1 = chunkRandom(chunkX, chunkZ, idx++);
      const r2 = chunkRandom(chunkX, chunkZ, idx++);
      const r3 = chunkRandom(chunkX, chunkZ, idx++);
      const x = (r1 - 0.5) * chunkSize;
      const z = (r2 - 0.5) * chunkSize;
      const scale = 0.3 + r3 * 0.5;
      objects.push({
        type: 'rock',
        position: [chunkX * chunkSize + x, scale * 0.3, chunkZ * chunkSize + z],
        scale: [scale * 1.2, scale, scale],
        rotation: [r1 * 0.3, r2 * Math.PI * 2, r3 * 0.3],
      });
    }
    // Grass
    for (let i = 0; i < GRASS_PER_CHUNK; i++) {
      const r1 = chunkRandom(chunkX, chunkZ, idx++);
      const r2 = chunkRandom(chunkX, chunkZ, idx++);
      const r3 = chunkRandom(chunkX, chunkZ, idx++);
      objects.push({
        type: 'grass',
        position: [chunkX * chunkSize + (r1 - 0.5) * chunkSize, 0.1, chunkZ * chunkSize + (r2 - 0.5) * chunkSize],
        scale: [0.15 + r3 * 0.1, 0.3 + r3 * 0.2, 0.15],
        rotation: [0, r1 * Math.PI * 2, 0],
      });
    }
    return objects;
  },
};
