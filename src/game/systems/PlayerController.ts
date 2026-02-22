// Player input & physics — consumed by the Player component via useFrame

import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../core/GameState';
import { GAME } from '../config/GameConfig';

// Swipe detection state
type SwipeState = {
  startX: number;
  startY: number;
  startTime: number;
};

const SWIPE_THRESHOLD = 30;  // px
const SWIPE_TIME = 300;       // ms

export function usePlayerInput() {
  const swipeRef = useRef<SwipeState | null>(null);

  const { phase } = useGameStore();

  const moveLeft = useCallback(() => {
    const { lane, setLane, phase: p } = useGameStore.getState();
    if (p !== 'playing') return;
    setLane(lane - 1);
  }, []);

  const moveRight = useCallback(() => {
    const { lane, setLane, phase: p } = useGameStore.getState();
    if (p !== 'playing') return;
    setLane(lane + 1);
  }, []);

  const jump = useCallback(() => {
    const { isJumping, isSliding, setJumping, phase: p } = useGameStore.getState();
    if (p !== 'playing' || isJumping || isSliding) return;
    setJumping(true);
    setTimeout(() => useGameStore.getState().setJumping(false), GAME.jumpDuration * 1000);
  }, []);

  const slide = useCallback(() => {
    const { isSliding, isJumping, setSliding, phase: p } = useGameStore.getState();
    if (p !== 'playing' || isSliding || isJumping) return;
    setSliding(true);
    setTimeout(() => useGameStore.getState().setSliding(false), GAME.slideDuration * 1000);
  }, []);

  const flipWorld = useCallback(() => {
    const { flipWorld: flip, phase: p } = useGameStore.getState();
    if (p !== 'playing') return;
    flip();
    setTimeout(() => useGameStore.getState().setFlipping(false), GAME.flipDuration * 1000);
  }, []);

  // Keyboard
  useEffect(() => {
    if (phase !== 'playing') return;

    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
          moveRight();
          break;
        case 'ArrowUp':
        case 'w':
          jump();
          break;
        case 'ArrowDown':
        case 's':
          slide();
          break;
        case ' ':
          e.preventDefault();
          flipWorld();
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, moveLeft, moveRight, jump, slide, flipWorld]);

  // Touch / swipe
  useEffect(() => {
    if (phase !== 'playing') return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      swipeRef.current = { startX: t.clientX, startY: t.clientY, startTime: Date.now() };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!swipeRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - swipeRef.current.startX;
      const dy = t.clientY - swipeRef.current.startY;
      const dt = Date.now() - swipeRef.current.startTime;
      swipeRef.current = null;

      if (dt > SWIPE_TIME) return;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return;

      if (absDx > absDy) {
        // Horizontal swipe
        if (dx < 0) moveLeft();
        else moveRight();
      } else {
        // Vertical swipe
        if (dy < 0) jump();
        else slide();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [phase, moveLeft, moveRight, jump, slide]);

  return { moveLeft, moveRight, jump, slide, flipWorld };
}
