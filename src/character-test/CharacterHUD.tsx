import { useCharacterStore } from './characterStore';

export function CharacterHUD() {
  const currentAction = useCharacterStore((s) => s.currentAction);
  const availableActions = useCharacterStore((s) => s.availableActions);
  const isRunning = useCharacterStore((s) => s.isRunning);
  const availableCharacters = useCharacterStore((s) => s.availableCharacters);
  const selectedCharacter = useCharacterStore((s) => s.selectedCharacter);
  const loadError = useCharacterStore((s) => s.loadError);

  return (
    <>
      {/* Current state */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#888' }}>Playing: </span>
        <span style={{ color: '#5f5' }}>{currentAction ?? 'none'}</span>
        {isRunning && <span style={{ color: '#ff8', marginLeft: 8 }}>[running]</span>}
      </div>

      {/* Keyboard controls */}
      <div style={{ marginBottom: 10, borderTop: '1px solid #444', paddingTop: 8 }}>
        <div style={{ color: '#aaa', fontWeight: 'bold', marginBottom: 4 }}>Controls</div>
        <div><Key k="Space" /> Toggle run</div>
        <div><Key k="Up / W" /> Jump</div>
        <div><Key k="Down / S" /> Slide</div>
      </div>

      {/* Available animations */}
      <div style={{ borderTop: '1px solid #444', paddingTop: 8 }}>
        <div style={{ color: '#aaa', fontWeight: 'bold', marginBottom: 4 }}>
          Animations ({availableActions.length})
        </div>
        {availableActions.length === 0 ? (
          <div style={{ color: '#ff8' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {availableActions.map((name) => (
              <button
                key={name}
                onClick={() => useCharacterStore.getState().setCurrentAction(name)}
                style={{
                  padding: '4px 10px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  background: name === currentAction ? '#4040a0' : '#2a2a3e',
                  color: name === currentAction ? '#fff' : '#ccc',
                  border: name === currentAction ? '1px solid #6060c0' : '1px solid #444',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Character selection */}
      {availableCharacters.length > 0 && (
        <div style={{ borderTop: '1px solid #444', paddingTop: 8, marginTop: 10 }}>
          <div style={{ color: '#aaa', fontWeight: 'bold', marginBottom: 4 }}>
            Character
          </div>
          {loadError && (
            <div style={{
              background: 'rgba(255,60,60,0.2)',
              border: '1px solid rgba(255,60,60,0.4)',
              color: '#faa',
              padding: '6px 8px',
              borderRadius: 4,
              fontSize: '0.7rem',
              lineHeight: 1.3,
              marginBottom: 4,
            }}>
              {loadError}
            </div>
          )}
          <select
            value={selectedCharacter}
            onChange={(e) => useCharacterStore.getState().setSelectedCharacter(e.target.value)}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              background: '#2a2a3e',
              color: '#ccc',
              border: '1px solid #444',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            {availableCharacters.map((c) => (
              <option key={c.file} value={c.file}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: 10,
        borderTop: '1px solid #444',
        paddingTop: 8,
        color: '#888',
        fontSize: '0.7rem',
      }}>
        Drop FBX files into <span style={{ color: '#aaa' }}>public/models/characters/</span> or{' '}
        <span style={{ color: '#aaa' }}>public/models/anims/</span> and refresh.
      </div>
    </>
  );
}

function Key({ k }: { k: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 6px',
      background: '#333',
      border: '1px solid #555',
      borderRadius: 3,
      fontSize: '0.75rem',
      color: '#ddd',
      marginRight: 6,
      minWidth: 60,
      textAlign: 'center',
    }}>
      {k}
    </span>
  );
}
