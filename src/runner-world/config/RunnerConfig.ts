export const RUNNER = {
  // Lanes
  laneCount: 3,
  laneWidth: 2.0,
  lanePositions: [-2.0, 0, 2.0],

  // Speed (constant for now — no difficulty ramp)
  speed: 12,

  // Player movement
  laneSwitchDuration: 0.15,   // seconds to lerp between lanes
  jumpDuration: 0.6,          // seconds in air
  slideDuration: 0.6,         // seconds sliding

  // Player hitbox (half-extents)
  playerHitboxHalf: [0.3, 0.5, 0.3] as [number, number, number],
  playerSlideHitboxHalfY: 0.25,   // shorter Y when sliding

  // Obstacles
  obstacleSpawnInterval: 1.2,     // seconds between spawns
  obstacleStartZ: -100,           // spawn distance ahead
  obstacleDespawnZ: 10,           // remove after passing
  obstaclePoolSize: 30,

  // Obstacle dimensions [width, height, depth]
  obstacleBarrier: [1.0, 1.2, 0.4] as [number, number, number],
  obstacleLow:     [1.2, 0.5, 0.5] as [number, number, number],
  obstacleTall:    [0.8, 2.0, 0.4] as [number, number, number],

  // World tiles
  tileLength: 4,
  tileCount: 40,

  // Buildings
  buildingCount: 30,         // per side
  buildingMinHeight: 3,
  buildingMaxHeight: 8,
  buildingWidth: 2.5,
  buildingDepth: 3,
  buildingOffsetX: 5.5,      // distance from center

  // Camera
  cameraOffset: [0, 3.5, 7] as [number, number, number],
  cameraLookAt: [0, 1, -15] as [number, number, number],
} as const;
