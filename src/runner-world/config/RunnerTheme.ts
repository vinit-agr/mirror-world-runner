export type RunnerWorldTheme = {
  name: string;
  ground: { color: string; emissive: string };
  buildings: { colors: string[]; emissive: string };
  rails: { color: string };
  lanes: { color: string; opacity: number };
  sky: { color: string };
  fog: { color: string; near: number; far: number };
  lighting: {
    ambient: number;
    directional: { color: string; intensity: number };
  };
};

export const URBAN_THEME: RunnerWorldTheme = {
  name: 'Urban',
  ground: { color: '#3a3a3a', emissive: '#1a1a1a' },
  buildings: {
    colors: ['#8b7355', '#a0522d', '#696969', '#556b2f', '#4a4a6a', '#705040'],
    emissive: '#0a0a0a',
  },
  rails: { color: '#888888' },
  lanes: { color: '#ffffff', opacity: 0.15 },
  sky: { color: '#87ceeb' },
  fog: { color: '#c8d8e8', near: 30, far: 100 },
  lighting: {
    ambient: 0.4,
    directional: { color: '#ffffff', intensity: 0.8 },
  },
};
