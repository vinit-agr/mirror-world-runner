// Asset registry — placeholder procedural primitives now, swap for GLTF/GLB later
// Each entry describes geometry + material for a game entity

export type AssetDef = {
  type: 'primitive';
  geometry: 'box' | 'sphere' | 'cylinder' | 'cone' | 'capsule';
  scale: [number, number, number];
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
};

// Future: add 'model' type for GLTF
// export type ModelAssetDef = { type: 'model'; url: string; scale: [number, number, number] };

export const ASSETS = {
  player: {
    type: 'primitive' as const,
    geometry: 'box' as const,
    scale: [0.6, 0.8, 0.6],
    color: '#00f5ff',
    emissive: '#00f5ff',
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.2,
  },

  obstacleBarrier: {
    type: 'primitive' as const,
    geometry: 'box' as const,
    scale: [1.0, 1.2, 0.4],
    color: '#ff2d95',
    emissive: '#ff2d95',
    emissiveIntensity: 0.6,
    metalness: 0.6,
    roughness: 0.3,
  },

  obstacleTall: {
    type: 'primitive' as const,
    geometry: 'box' as const,
    scale: [0.8, 2.0, 0.4],
    color: '#ff00ff',
    emissive: '#ff00ff',
    emissiveIntensity: 0.5,
    metalness: 0.6,
    roughness: 0.3,
  },

  obstacleLow: {
    type: 'primitive' as const,
    geometry: 'box' as const,
    scale: [1.2, 0.5, 0.5],
    color: '#f0ff00',
    emissive: '#f0ff00',
    emissiveIntensity: 0.4,
    metalness: 0.5,
    roughness: 0.4,
  },

  groundTile: {
    type: 'primitive' as const,
    geometry: 'box' as const,
    scale: [12, 0.1, 4],
    color: '#0a0a2e',
    emissive: '#1a1a4e',
    emissiveIntensity: 0.15,
    metalness: 0.9,
    roughness: 0.1,
  },
} satisfies Record<string, AssetDef>;
