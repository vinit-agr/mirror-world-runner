import { create } from 'zustand';
import { GAME } from '../config/GameConfig';

export type GamePhase = 'menu' | 'playing' | 'dead';
export type WorldSide = 'bottom' | 'top';

export type Obstacle = {
  id: number;
  lane: number;
  z: number;
  world: WorldSide;
  variant: 'barrier' | 'tall' | 'low';
  active: boolean;
};

type GameState = {
  phase: GamePhase;
  score: number;
  highScore: number;
  speed: number;
  distance: number;

  // Player state
  lane: number;           // 0, 1, 2
  worldSide: WorldSide;
  isFlipping: boolean;
  isJumping: boolean;
  isSliding: boolean;

  // Obstacle pool
  obstacles: Obstacle[];
  nextObstacleId: number;

  // Actions
  startGame: () => void;
  die: () => void;
  setLane: (lane: number) => void;
  flipWorld: () => void;
  setFlipping: (v: boolean) => void;
  setJumping: (v: boolean) => void;
  setSliding: (v: boolean) => void;
  addScore: (delta: number) => void;
  setSpeed: (s: number) => void;
  setDistance: (d: number) => void;
  spawnObstacle: (obs: Omit<Obstacle, 'id'>) => void;
  updateObstacle: (id: number, patch: Partial<Obstacle>) => void;
  deactivateObstacle: (id: number) => void;
  resetObstacles: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  score: 0,
  highScore: 0,
  speed: GAME.initialSpeed,
  distance: 0,

  lane: 1,
  worldSide: 'bottom',
  isFlipping: false,
  isJumping: false,
  isSliding: false,

  obstacles: [],
  nextObstacleId: 0,

  startGame: () =>
    set({
      phase: 'playing',
      score: 0,
      speed: GAME.initialSpeed,
      distance: 0,
      lane: 1,
      worldSide: 'bottom',
      isFlipping: false,
      isJumping: false,
      isSliding: false,
      obstacles: [],
      nextObstacleId: 0,
    }),

  die: () => {
    const { score, highScore } = get();
    set({
      phase: 'dead',
      highScore: Math.max(score, highScore),
    });
  },

  setLane: (lane) => set({ lane: Math.max(0, Math.min(2, lane)) }),

  flipWorld: () => {
    const { worldSide, isFlipping } = get();
    if (isFlipping) return;
    set({
      worldSide: worldSide === 'bottom' ? 'top' : 'bottom',
      isFlipping: true,
    });
  },

  setFlipping: (v) => set({ isFlipping: v }),
  setJumping: (v) => set({ isJumping: v }),
  setSliding: (v) => set({ isSliding: v }),
  addScore: (delta) => set((s) => ({ score: s.score + delta })),
  setSpeed: (s) => set({ speed: s }),
  setDistance: (d) => set({ distance: d }),

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

  resetObstacles: () => set({ obstacles: [], nextObstacleId: 0 }),
}));
