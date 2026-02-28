import { BackButton } from '../BackButton';

export default function OpenWorldPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      background: '#1a1a2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      color: '#888',
      fontSize: '1.2rem',
    }}>
      Open World — coming soon
      <BackButton />
    </div>
  );
}
