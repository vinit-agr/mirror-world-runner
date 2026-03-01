import { useEffect, useRef, useCallback } from 'react';
import { useRunnerStore } from '../core/RunnerState';
import { RUNNER } from '../config/RunnerConfig';

type SwipeState = { startX: number; startY: number; startTime: number };

const SWIPE_THRESHOLD = 30;
const SWIPE_TIME = 300;

export function useRunnerInput() {
  const swipeRef = useRef<SwipeState | null>(null);

  const moveLeft = useCallback(() => {
    const { lane, setLane } = useRunnerStore.getState();
    setLane(lane - 1);
  }, []);

  const moveRight = useCallback(() => {
    const { lane, setLane } = useRunnerStore.getState();
    setLane(lane + 1);
  }, []);

  const jump = useCallback(() => {
    const { isJumping, isSliding, setJumping } = useRunnerStore.getState();
    if (isJumping || isSliding) return;
    setJumping(true);
    setTimeout(() => useRunnerStore.getState().setJumping(false), RUNNER.jumpDuration * 1000);
  }, []);

  const slide = useCallback(() => {
    const { isSliding, isJumping, setSliding } = useRunnerStore.getState();
    if (isSliding || isJumping) return;
    setSliding(true);
    setTimeout(() => useRunnerStore.getState().setSliding(false), RUNNER.slideDuration * 1000);
  }, []);

  // Keyboard
  useEffect(() => {
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
          e.preventDefault();
          jump();
          break;
        case 'ArrowDown':
        case 's':
          e.preventDefault();
          slide();
          break;
        case 'h':
          useRunnerStore.getState().toggleHitboxes();
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveLeft, moveRight, jump, slide]);

  // Touch / swipe
  useEffect(() => {
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
        if (dx < 0) moveLeft();
        else moveRight();
      } else {
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
  }, [moveLeft, moveRight, jump, slide]);

  return { moveLeft, moveRight, jump, slide };
}
