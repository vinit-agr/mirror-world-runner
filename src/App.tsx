import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CharacterScene } from './character-test/CharacterScene';
import { ControlsHUD } from './character-test/ControlsHUD';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#1a1a2e' }}>
      <Suspense fallback={<LoadingUI />}>
        <Canvas
          shadows
          camera={{ position: [0, 2, 5], fov: 50 }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%' }}
        >
          <CharacterScene />
        </Canvas>
      </Suspense>
      <ControlsHUD />
    </div>
  );
}

function LoadingUI() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '1.2rem',
    }}>
      Loading character model...
    </div>
  );
}
