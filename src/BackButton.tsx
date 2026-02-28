import { navigate } from './router';

export function BackButton() {
  return (
    <button
      onClick={() => navigate('')}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 50,
        padding: '8px 16px',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        color: '#ccc',
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 6,
        cursor: 'pointer',
        letterSpacing: '0.05em',
      }}
    >
      Home
    </button>
  );
}
