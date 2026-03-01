import { useWorldStore } from './worldStore';

export function CharacterSelector() {
  const characters = useWorldStore((s) => s.availableCharacters);
  const selected = useWorldStore((s) => s.selectedCharacter);
  const error = useWorldStore((s) => s.characterError);

  if (characters.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 16,
      fontFamily: 'monospace',
      fontSize: '0.8rem',
      color: '#fff',
      background: 'rgba(0,0,0,0.5)',
      padding: '10px 14px',
      borderRadius: 8,
    }}>
      <label style={{ fontWeight: 'bold', marginRight: 8 }}>Character</label>
      <select
        value={selected}
        onChange={(e) => useWorldStore.getState().setSelectedCharacter(e.target.value)}
        style={{
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 4,
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        {characters.map((c) => (
          <option key={c.file} value={c.file}>{c.name}</option>
        ))}
      </select>
      {error && (
        <div style={{
          background: 'rgba(255,60,60,0.25)',
          border: '1px solid rgba(255,60,60,0.5)',
          color: '#faa',
          padding: '6px 8px',
          borderRadius: 4,
          fontSize: '0.7rem',
          lineHeight: 1.3,
          marginTop: 6,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
