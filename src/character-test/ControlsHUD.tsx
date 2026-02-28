import { useCharacterStore } from './characterStore';

export function ControlsHUD() {
  const currentAction = useCharacterStore((s) => s.currentAction);
  const availableActions = useCharacterStore((s) => s.availableActions);

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 16,
      fontFamily: 'monospace',
      color: '#e0e0e0',
      fontSize: '0.85rem',
      lineHeight: 1.6,
      background: 'rgba(0,0,0,0.6)',
      padding: '12px 16px',
      borderRadius: 8,
      maxWidth: 300,
    }}>
      <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: 8, color: '#8080ff' }}>
        Character Test Scene
      </div>

      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#888' }}>Current: </span>
        <span style={{ color: '#5f5' }}>{currentAction ?? 'none'}</span>
      </div>

      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#888' }}>Available animations:</span>
        {availableActions.length === 0 ? (
          <div style={{ color: '#ff8' }}>No animations loaded yet</div>
        ) : (
          <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
            {availableActions.map((name) => (
              <li
                key={name}
                style={{
                  color: name === currentAction ? '#5f5' : '#ccc',
                  cursor: 'pointer',
                }}
                onClick={() => useCharacterStore.getState().setCurrentAction(name)}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ borderTop: '1px solid #444', paddingTop: 8, color: '#888', fontSize: '0.75rem' }}>
        <div>Mouse drag: orbit camera</div>
        <div>Scroll: zoom</div>
        <div>Click animation name: play it</div>
        <div style={{ marginTop: 4, color: '#ff8' }}>
          Add Mixamo FBX animations to<br />
          public/models/anims/ to use them
        </div>
      </div>
    </div>
  );
}
