import { useGameStore } from '../core/GameState';
import { THEME } from '../config/ThemeConfig';

export function MenuOverlay() {
  const phase = useGameStore((s) => s.phase);
  const highScore = useGameStore((s) => s.highScore);
  const score = useGameStore((s) => s.score);
  const startGame = useGameStore((s) => s.startGame);

  if (phase === 'playing') return null;

  const isDead = phase === 'dead';

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      background: 'rgba(0, 0, 20, 0.85)',
      fontFamily: 'monospace',
      color: THEME.colors.uiText,
    }}>
      <h1 style={{
        fontSize: 'clamp(1.8rem, 6vw, 3.5rem)',
        margin: 0,
        textShadow: `0 0 20px ${THEME.colors.neonCyan}, 0 0 40px ${THEME.colors.neonMagenta}`,
        letterSpacing: '0.1em',
        textAlign: 'center',
        padding: '0 16px',
      }}>
        MIRROR WORLD
        <br />
        <span style={{ color: THEME.colors.neonMagenta }}>RUNNER</span>
      </h1>

      {isDead && (
        <div style={{
          marginTop: 24,
          fontSize: '1.2rem',
          textAlign: 'center',
        }}>
          <div style={{ color: THEME.colors.neonPink }}>GAME OVER</div>
          <div style={{ marginTop: 8 }}>Score: {score}</div>
          {highScore > 0 && (
            <div style={{ color: THEME.colors.neonYellow, marginTop: 4 }}>
              Best: {highScore}
            </div>
          )}
        </div>
      )}

      <button
        onClick={startGame}
        style={{
          marginTop: 40,
          padding: '14px 48px',
          fontSize: '1.1rem',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          background: 'transparent',
          color: THEME.colors.neonCyan,
          border: `2px solid ${THEME.colors.neonCyan}`,
          borderRadius: 8,
          cursor: 'pointer',
          textShadow: `0 0 10px ${THEME.colors.neonCyan}`,
          boxShadow: `0 0 20px ${THEME.colors.neonCyan}44`,
          letterSpacing: '0.15em',
        }}
      >
        {isDead ? 'RETRY' : 'START'}
      </button>

      <div style={{
        marginTop: 32,
        fontSize: '0.75rem',
        opacity: 0.6,
        textAlign: 'center',
        lineHeight: 1.6,
        padding: '0 16px',
      }}>
        Swipe or Arrow Keys to move | Space to flip gravity
      </div>
    </div>
  );
}
