// Cyber Neon theme configuration — swap colors/values here for reskinning

export const THEME = {
  name: 'Cyber Neon',

  colors: {
    // Primary palette
    neonCyan: '#00f5ff',
    neonMagenta: '#ff00ff',
    neonPink: '#ff2d95',
    neonYellow: '#f0ff00',
    neonGreen: '#39ff14',

    // Environment
    groundTop: '#0a0a2e',
    groundBottom: '#1a0030',
    skyTop: '#000011',
    skyBottom: '#0a0a2e',
    fog: '#0a0020',
    gridLine: '#1a1a4e',

    // Player
    playerBody: '#00f5ff',
    playerEmissive: '#00f5ff',
    playerTrail: '#ff00ff',

    // Obstacles
    obstacle: '#ff2d95',
    obstacleEmissive: '#ff2d95',

    // UI
    uiPrimary: '#00f5ff',
    uiSecondary: '#ff00ff',
    uiBackground: 'rgba(0, 0, 20, 0.8)',
    uiText: '#ffffff',
  },

  bloom: {
    intensity: 0.8,
    luminanceThreshold: 0.2,
    luminanceSmoothing: 0.9,
  },

  fog: {
    near: 20,
    far: 80,
  },
} as const;

export type ThemeColors = typeof THEME.colors;
