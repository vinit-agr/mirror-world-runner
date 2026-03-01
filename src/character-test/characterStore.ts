import { create } from 'zustand';

export type CharacterEntry = { name: string; file: string };

type CharacterState = {
  currentAction: string | null;
  availableActions: string[];
  isRunning: boolean;
  availableCharacters: CharacterEntry[];
  selectedCharacter: string; // file name
  setCurrentAction: (name: string | null) => void;
  setAvailableActions: (names: string[]) => void;
  setRunning: (v: boolean) => void;
  setAvailableCharacters: (chars: CharacterEntry[]) => void;
  setSelectedCharacter: (file: string) => void;
};

export const useCharacterStore = create<CharacterState>((set) => ({
  currentAction: null,
  availableActions: [],
  isRunning: false,
  availableCharacters: [],
  selectedCharacter: 'default.fbx',
  setCurrentAction: (name) => set({ currentAction: name }),
  setAvailableActions: (names) => set({ availableActions: names }),
  setRunning: (v) => set({ isRunning: v }),
  setAvailableCharacters: (chars) => set({ availableCharacters: chars }),
  setSelectedCharacter: (file) => set({ selectedCharacter: file }),
}));
