import { useGameStore } from '../core/GameState';
import { THEME } from '../config/ThemeConfig';

export function HUD() {
  const score = useGameStore((s) => s.score);
  const phase = useGameStore((s) => s.phase);

  if (phase !== 'playing') return null;

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <div style={{
        background: THEME.colors.uiBackground,
        color: THEME.colors.uiText,
        padding: '8px 24px',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        border: `1px solid ${THEME.colors.neonCyan}`,
        textShadow: `0 0 10px ${THEME.colors.neonCyan}`,
      }}>
        {String(score).padStart(6, '0')}
      </div>
    </div>
  );
}
