import { create } from 'zustand';

type CharacterState = {
  // Currently playing animation name
  currentAction: string | null;
  // All available animation names (populated after animations load)
  availableActions: string[];
  // Whether the character is in running state
  isRunning: boolean;

  setCurrentAction: (name: string | null) => void;
  setAvailableActions: (names: string[]) => void;
  setRunning: (v: boolean) => void;
};

export const useCharacterStore = create<CharacterState>((set) => ({
  currentAction: null,
  availableActions: [],
  isRunning: false,

  setCurrentAction: (name) => set({ currentAction: name }),
  setAvailableActions: (names) => set({ availableActions: names }),
  setRunning: (v) => set({ isRunning: v }),
}));
