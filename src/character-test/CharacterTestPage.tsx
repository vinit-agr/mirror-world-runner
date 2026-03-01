import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CharacterScene } from './CharacterScene';
import { ControlsHUD } from './ControlsHUD';
import { BackButton } from '../BackButton';

export default function CharacterTestPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#1a1a2e' }}>
      <Suspense fallback={
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
      }>
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
      <BackButton />
    </div>
  );
}
