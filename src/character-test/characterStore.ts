import { create } from 'zustand';

type CharacterState = {
  // Currently playing animation name
  currentAction: string | null;
  // All available animation names (populated after model loads)
  availableActions: string[];

  setCurrentAction: (name: string | null) => void;
  setAvailableActions: (names: string[]) => void;
};

export const useCharacterStore = create<CharacterState>((set) => ({
  currentAction: null,
  availableActions: [],

  setCurrentAction: (name) => set({ currentAction: name }),
  setAvailableActions: (names) => set({ availableActions: names }),
}));
