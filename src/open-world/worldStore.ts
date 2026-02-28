import { create } from 'zustand';

type WorldState = {
  playerX: number;
  playerZ: number;
  playerAngle: number;
  isMoving: boolean;
  setPlayerPosition: (x: number, z: number) => void;
  setPlayerAngle: (angle: number) => void;
  setMoving: (v: boolean) => void;
};

export const useWorldStore = create<WorldState>((set) => ({
  playerX: 0,
  playerZ: 0,
  playerAngle: 0,
  isMoving: false,
  setPlayerPosition: (x, z) => set({ playerX: x, playerZ: z }),
  setPlayerAngle: (angle) => set({ playerAngle: angle }),
  setMoving: (v) => set({ isMoving: v }),
}));
