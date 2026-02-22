// Core gameplay tuning knobs

export const GAME = {
  // Lanes
  laneCount: 3,
  laneWidth: 2.0,
  lanePositions: [-2.0, 0, 2.0],

  // Speed
  initialSpeed: 8,
  maxSpeed: 24,
  speedRampPerSecond: 0.08,

  // Player
  laneSwitchDuration: 0.15,
  jumpHeight: 1.5,
  jumpDuration: 0.5,
  slideScale: 0.4,
  slideDuration: 0.5,
  playerY: 0.5,

  // Mirror world
  flipDuration: 0.35,
  mirrorGap: 6, // distance between top and bottom world surfaces

  // Obstacles
  obstacleSpawnInterval: 0.8,    // base interval in seconds
  minSpawnInterval: 0.35,
  obstaclePoolSize: 30,
  obstacleStartZ: -80,
  obstacleDespawnZ: 10,

  // Collision
  playerHitboxHalf: [0.25, 0.35, 0.25] as [number, number, number],

  // World tiles
  tileLength: 4,
  tileCount: 24,

  // Score
  scorePerSecond: 10,
} as const;
