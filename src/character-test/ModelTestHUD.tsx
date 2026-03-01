import { useModelTestStore, type ModelMode } from './modelTestStore';
import { CharacterHUD } from './CharacterHUD';
import { ObstacleHUD } from './ObstacleHUD';

const MODES: { value: ModelMode; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'obstacle', label: 'Obstacle' },
];

export function ModelTestHUD() {
  const mode = useModelTestStore((s) => s.mode);

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 16,
      fontFamily: 'monospace',
      color: '#e0e0e0',
      fontSize: '0.85rem',
      lineHeight: 1.6,
      background: 'rgba(0,0,0,0.7)',
      padding: '12px 16px',
      borderRadius: 8,
      maxWidth: 320,
      maxHeight: 'calc(100dvh - 32px)',
      overflowY: 'auto',
      userSelect: 'none',
    }}>
      <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: 8, color: '#8080ff' }}>
        Model Test
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => useModelTestStore.getState().setMode(m.value)}
            style={{
              flex: 1,
              padding: '6px 0',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              background: mode === m.value ? '#4040a0' : '#2a2a3e',
              color: mode === m.value ? '#fff' : '#888',
              border: mode === m.value ? '1px solid #6060c0' : '1px solid #444',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode-specific controls */}
      {mode === 'character' && <CharacterHUD />}
      {mode === 'obstacle' && <ObstacleHUD />}
    </div>
  );
}
