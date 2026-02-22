import { useGameStore } from '../core/GameState';
import { usePlayerInput } from '../systems/PlayerController';
import { THEME } from '../config/ThemeConfig';

const btnStyle = (color: string): React.CSSProperties => ({
  width: 56,
  height: 56,
  borderRadius: 12,
  border: `2px solid ${color}`,
  background: 'rgba(0,0,20,0.5)',
  color,
  fontSize: '1.4rem',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'manipulation',
  cursor: 'pointer',
  textShadow: `0 0 8px ${color}`,
  boxShadow: `0 0 12px ${color}33`,
});

export function TouchControls() {
  const phase = useGameStore((s) => s.phase);
  const { moveLeft, moveRight, flipWorld } = usePlayerInput();

  if (phase !== 'playing') return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      padding: '0 20px',
      zIndex: 10,
      pointerEvents: 'none',
    }}>
      {/* Left side: lane controls */}
      <div style={{ display: 'flex', gap: 12, pointerEvents: 'auto' }}>
        <button
          style={btnStyle(THEME.colors.neonCyan)}
          onPointerDown={(e) => { e.stopPropagation(); moveLeft(); }}
        >
          &larr;
        </button>
        <button
          style={btnStyle(THEME.colors.neonCyan)}
          onPointerDown={(e) => { e.stopPropagation(); moveRight(); }}
        >
          &rarr;
        </button>
      </div>

      {/* Right side: flip button */}
      <div style={{ pointerEvents: 'auto' }}>
        <button
          style={{
            ...btnStyle(THEME.colors.neonMagenta),
            width: 72,
            height: 72,
            borderRadius: 36,
            fontSize: '0.7rem',
          }}
          onPointerDown={(e) => { e.stopPropagation(); flipWorld(); }}
        >
          FLIP
        </button>
      </div>
    </div>
  );
}
