import { create } from 'zustand';
import { RUNNER } from '../config/RunnerConfig';

export type ObstacleVariant = 'barrier' | 'low' | 'tall';

export type RunnerObstacle = {
  id: number;
  lane: number;
  z: number;
  variant: ObstacleVariant;
  active: boolean;
};

type RunnerState = {
  // Movement
  lane: number;
  isJumping: boolean;
  isSliding: boolean;
  speed: number;
  distance: number;

  // Obstacles
  obstacles: RunnerObstacle[];
  nextObstacleId: number;

  // Character
  selectedCharacter: string;
  characterError: string | null;

  // Collision blocking
  isBlocked: boolean;
  collidingObstacleIds: Set<number>;

  // Debug
  showHitboxes: boolean;

  // Collisions detected this frame (for debug display)
  collisionCount: number;

  // Actions
  setLane: (lane: number) => void;
  setJumping: (v: boolean) => void;
  setSliding: (v: boolean) => void;
  setSpeed: (s: number) => void;
  setDistance: (d: number) => void;
  setSelectedCharacter: (file: string) => void;
  setCharacterError: (err: string | null) => void;
  setBlocked: (v: boolean) => void;
  setCollidingObstacleIds: (ids: Set<number>) => void;
  toggleHitboxes: () => void;
  setCollisionCount: (n: number) => void;
  spawnObstacle: (obs: Omit<RunnerObstacle, 'id'>) => void;
  updateObstacle: (id: number, patch: Partial<RunnerObstacle>) => void;
  deactivateObstacle: (id: number) => void;
};

export const useRunnerStore = create<RunnerState>((set, get) => ({
  lane: 1,
  isJumping: false,
  isSliding: false,
  speed: RUNNER.speed,
  distance: 0,

  obstacles: [],
  nextObstacleId: 0,

  selectedCharacter: 'default.fbx',
  characterError: null,

  isBlocked: false,
  collidingObstacleIds: new Set<number>(),

  showHitboxes: true,
  collisionCount: 0,

  setLane: (lane) => set({ lane: Math.max(0, Math.min(2, lane)) }),
  setJumping: (v) => set({ isJumping: v }),
  setSliding: (v) => set({ isSliding: v }),
  setSpeed: (s) => set({ speed: s }),
  setDistance: (d) => set({ distance: d }),
  setSelectedCharacter: (file) => set({ selectedCharacter: file, characterError: null }),
  setCharacterError: (err) => set({ characterError: err }),
  setBlocked: (v) => set({ isBlocked: v }),
  setCollidingObstacleIds: (ids) => set({ collidingObstacleIds: ids }),
  toggleHitboxes: () => set((s) => ({ showHitboxes: !s.showHitboxes })),
  setCollisionCount: (n) => set({ collisionCount: n }),

  spawnObstacle: (obs) => {
    const id = get().nextObstacleId;
    set((s) => ({
      obstacles: [...s.obstacles, { ...obs, id }],
      nextObstacleId: id + 1,
    }));
  },

  updateObstacle: (id, patch) =>
    set((s) => ({
      obstacles: s.obstacles.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),

  deactivateObstacle: (id) =>
    set((s) => ({
      obstacles: s.obstacles.map((o) => (o.id === id ? { ...o, active: false } : o)),
    })),
}));
