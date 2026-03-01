export type ObstacleModelDef = {
  name: string;
  file: string;
};

/** Street obstacle models used in the runner world. */
export const OBSTACLE_MODELS: ObstacleModelDef[] = [
  { name: 'Barrel', file: 'barrel.glb' },
  { name: 'Bin', file: 'bin.glb' },
  { name: 'Cone', file: 'cone.glb' },
  { name: 'Fire Hydrant', file: 'hydrant.glb' },
  { name: 'Concrete Barrier', file: 'concrete-barrier.glb' },
  { name: 'Red Barrier', file: 'red-barrier.glb' },
  { name: 'Metal Barrier 1', file: 'metal-barrier1.glb' },
  { name: 'Metal Barrier 2', file: 'metal-barrier2.glb' },
  { name: 'Metal Barrier Damaged 1', file: 'metal-barrier-damaged1.glb' },
  { name: 'Metal Barrier Damaged 2', file: 'metal-barrier-damaged2.glb' },
  { name: 'Stop Sign', file: 'stop.glb' },
  { name: 'Warning Sign', file: 'warning.glb' },
  { name: 'Give Way Sign', file: 'give-way.glb' },
  { name: 'No Waiting Sign', file: 'no-waiting.glb' },
];

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
  obstacleScale: 0.5,             // GLB model scale (fits well with characters)

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
  cameraOffset: [0, 2, 3.5] as [number, number, number],
  cameraLookAt: [0, 1, -15] as [number, number, number],
} as const;
