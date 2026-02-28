export type ChunkObject = {
  type: 'tree' | 'rock' | 'grass';
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
};

export type WorldTheme = {
  name: string;
  ground: {
    color: string;
    colorAlt: string;
  };
  sky: {
    topColor: string;
    bottomColor: string;
  };
  fog: {
    color: string;
    near: number;
    far: number;
  };
  lighting: {
    ambientIntensity: number;
    sunColor: string;
    sunIntensity: number;
    sunPosition: [number, number, number];
  };
  generateChunkObjects: (chunkX: number, chunkZ: number, chunkSize: number) => ChunkObject[];
};
