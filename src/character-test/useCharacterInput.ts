import { useEffect } from 'react';
import { useCharacterStore } from './characterStore';

// Map keyboard keys to animation names
// These will be updated as the user provides Mixamo animation FBX files
const KEY_MAP: Record<string, string> = {
  // Will be populated once we know what animations are available
  // Example mappings (uncomment when animations are added):
  // 'ArrowUp': 'Run',
  // 'ArrowDown': 'Crouch',
  // ' ': 'Jump',
  // 'ArrowLeft': 'Left Turn',
  // 'ArrowRight': 'Right Turn',
};

// Default idle animation (first available, or the embedded one)
let idleAction: string | null = null;

export function useCharacterInput() {
  const availableActions = useCharacterStore((s) => s.availableActions);

  useEffect(() => {
    // Set idle as the first available action
    if (availableActions.length > 0 && !idleAction) {
      idleAction = availableActions[0];
    }
  }, [availableActions]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const actionName = KEY_MAP[e.key];
      if (actionName) {
        e.preventDefault();
        useCharacterStore.getState().setCurrentAction(actionName);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const actionName = KEY_MAP[e.key];
      if (actionName) {
        // Return to idle when key is released
        const current = useCharacterStore.getState().currentAction;
        if (current === actionName && idleAction) {
          useCharacterStore.getState().setCurrentAction(idleAction);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);
}
