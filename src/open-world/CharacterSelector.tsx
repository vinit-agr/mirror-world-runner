import { useWorldStore } from './worldStore';

export function CharacterSelector() {
  const characters = useWorldStore((s) => s.availableCharacters);
  const selected = useWorldStore((s) => s.selectedCharacter);

  if (characters.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      fontFamily: 'monospace',
      fontSize: '0.8rem',
      color: '#fff',
      background: 'rgba(0,0,0,0.5)',
      padding: '10px 14px',
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 2 }}>Character</div>
      {characters.map((c) => (
        <button
          key={c.file}
          onClick={() => useWorldStore.getState().setSelectedCharacter(c.file)}
          style={{
            background: selected === c.file ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
            border: selected === c.file ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '5px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            textAlign: 'left',
          }}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
