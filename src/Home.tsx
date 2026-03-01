import { navigate } from './router';
import type { Route } from './router';

interface ExperimentCard {
  title: string;
  description: string;
  route: Route;
  color: string;
}

const experiments: ExperimentCard[] = [
  {
    title: 'Character Test',
    description: 'Test Mixamo character animations in isolation',
    route: 'character-test',
    color: '#4040a0',
  },
  {
    title: 'Open World',
    description: 'Run through a procedurally generated landscape',
    route: 'open-world',
    color: '#2a6040',
  },
  {
    title: 'Mirror World Runner',
    description: 'Cyberpunk endless runner with gravity flipping',
    route: 'mirror-world-runner',
    color: '#602040',
  },
  {
    title: 'Runner World',
    description: 'Subway Surfer-style endless runner with FBX characters',
    route: 'runner-world',
    color: '#604020',
  },
];

export function Home() {
  return (
    <div style={{
      width: '100vw',
      minHeight: '100dvh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      padding: 32,
      boxSizing: 'border-box',
    }}>
      <h1 style={{
        color: '#8080ff',
        fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
        marginBottom: 48,
        letterSpacing: '0.08em',
        textAlign: 'center',
      }}>
        3D Experiments
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 24,
        width: '100%',
        maxWidth: 900,
      }}>
        {experiments.map((card) => (
          <button
            key={card.route}
            onClick={() => navigate(card.route)}
            style={{
              background: card.color,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '32px 24px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 8px 32px ${card.color}88`;
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div style={{
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              marginBottom: 12,
              letterSpacing: '0.04em',
            }}>
              {card.title}
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              lineHeight: 1.5,
            }}>
              {card.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
