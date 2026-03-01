import { Suspense, lazy } from 'react';
import { useHashRoute } from './router';
import { Home } from './Home';

const CharacterTestPage = lazy(() => import('./character-test/CharacterTestPage'));
const MirrorWorldRunnerPage = lazy(() => import('./game/MirrorWorldRunnerPage'));
const OpenWorldPage = lazy(() => import('./open-world/OpenWorldPage'));
const RunnerWorldPage = lazy(() => import('./runner-world/RunnerWorldPage'));

function LoadingFallback() {
  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a2e',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '1.2rem',
    }}>
      Loading...
    </div>
  );
}

export default function App() {
  const route = useHashRoute();

  if (route === '') return <Home />;

  return (
    <Suspense fallback={<LoadingFallback />}>
      {route === 'character-test' && <CharacterTestPage />}
      {route === 'mirror-world-runner' && <MirrorWorldRunnerPage />}
      {route === 'open-world' && <OpenWorldPage />}
      {route === 'runner-world' && <RunnerWorldPage />}
    </Suspense>
  );
}
