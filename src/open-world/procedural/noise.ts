import { createNoise2D } from 'simplex-noise';

// Seeded PRNG for deterministic noise
function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function createSeededNoise(seed: number) {
  const rng = mulberry32(seed);
  return createNoise2D(rng);
}

export function chunkRandom(chunkX: number, chunkZ: number, index: number): number {
  const seed = chunkX * 73856093 ^ chunkZ * 19349663 ^ index * 83492791;
  const t = (seed & 0x7fffffff) / 0x7fffffff;
  return t;
}
