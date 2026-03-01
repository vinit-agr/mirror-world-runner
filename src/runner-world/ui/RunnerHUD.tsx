import { useEffect, useState } from 'react';
import { useRunnerStore } from '../core/RunnerState';

type CharacterEntry = { name: string; file: string };

export function RunnerHUD() {
  const selected = useRunnerStore((s) => s.selectedCharacter);
  const error = useRunnerStore((s) => s.characterError);
  const showHitboxes = useRunnerStore((s) => s.showHitboxes);
  const collisionCount = useRunnerStore((s) => s.collisionCount);
  const [characters, setCharacters] = useState<CharacterEntry[]>([]);

  useEffect(() => {
    fetch('/models/characters/manifest.json')
      .then((res) => res.json())
      .then((data) => setCharacters(data.characters))
      .catch(console.error);
  }, []);

  return (
    <>
      {/* Character selector - top left */}
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
        zIndex: 10,
      }}>
        <label style={{ fontWeight: 'bold', marginRight: 8 }}>Character</label>
        <select
          value={selected}
          onChange={(e) => useRunnerStore.getState().setSelectedCharacter(e.target.value)}
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

      {/* Debug info - bottom left */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        color: '#aaa',
        background: 'rgba(0,0,0,0.5)',
        padding: '8px 12px',
        borderRadius: 8,
        zIndex: 10,
        lineHeight: 1.6,
      }}>
        <div>Hitboxes: {showHitboxes ? 'ON' : 'OFF'} <span style={{ color: '#666' }}>(H to toggle)</span></div>
        <div>Collisions: <span style={{ color: collisionCount > 0 ? '#ff4444' : '#44ff44' }}>{collisionCount}</span></div>
        <div style={{ color: '#666', marginTop: 4 }}>
          Arrow keys / WASD: move, jump, slide
        </div>
      </div>
    </>
  );
}
