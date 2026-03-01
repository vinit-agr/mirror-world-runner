import { create } from 'zustand';

export type CharacterEntry = { name: string; file: string };

type WorldState = {
  playerX: number;
  playerZ: number;
  playerAngle: number;
  isMoving: boolean;
  availableCharacters: CharacterEntry[];
  selectedCharacter: string; // file name
  setPlayerPosition: (x: number, z: number) => void;
  setPlayerAngle: (angle: number) => void;
  setMoving: (v: boolean) => void;
  setAvailableCharacters: (chars: CharacterEntry[]) => void;
  setSelectedCharacter: (file: string) => void;
};

export const useWorldStore = create<WorldState>((set) => ({
  playerX: 0,
  playerZ: 0,
  playerAngle: 0,
  isMoving: false,
  availableCharacters: [],
  selectedCharacter: 'default.fbx',
  setPlayerPosition: (x, z) => set({ playerX: x, playerZ: z }),
  setPlayerAngle: (angle) => set({ playerAngle: angle }),
  setMoving: (v) => set({ isMoving: v }),
  setAvailableCharacters: (chars) => set({ availableCharacters: chars }),
  setSelectedCharacter: (file) => set({ selectedCharacter: file }),
}));
