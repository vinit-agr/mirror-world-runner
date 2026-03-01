import { useEffect } from 'react';
import { useCharacterStore } from './characterStore';

export function useCharacterInput(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const store = useCharacterStore.getState();
      const { currentAction, availableActions } = store;

      switch (e.key) {
        case 'ArrowUp':
        case 'w': {
          e.preventDefault();
          // Jump (one-shot, returns to idle/run after)
          if (availableActions.includes('Jump') && currentAction !== 'Jump') {
            store.setCurrentAction('Jump');
          }
          break;
        }

        case 'ArrowDown':
        case 's': {
          e.preventDefault();
          // Slide (one-shot, returns to idle/run after)
          if (availableActions.includes('Slide') && currentAction !== 'Slide') {
            store.setCurrentAction('Slide');
          }
          break;
        }

        case ' ': {
          e.preventDefault();
          // Space = toggle running
          if (store.isRunning) {
            // Stop running, go to idle
            store.setRunning(false);
            store.setCurrentAction('Idle');
          } else {
            // Start running
            store.setRunning(true);
            store.setCurrentAction('Run');
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
