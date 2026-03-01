import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OpenWorldScene } from './OpenWorldScene';
import { CharacterSelector } from './CharacterSelector';
import { BackButton } from '../BackButton';

export default function OpenWorldPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#87ceeb' }}>
      <Suspense fallback={
        <div style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: '#1a1a2e', color: '#888', fontFamily: 'monospace',
        }}>
          Loading world...
        </div>
      }>
        <Canvas
          shadows
          camera={{ position: [0, 4, 8], fov: 55 }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%' }}
        >
          <OpenWorldScene />
        </Canvas>
      </Suspense>
      <BackButton />
      <CharacterSelector />
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.6)',
        background: 'rgba(0,0,0,0.4)',
        padding: '8px 16px',
        borderRadius: 8,
        textAlign: 'center',
      }}>
        WASD to move | Space to jump | Ctrl/Cmd to slide | Mouse drag to orbit | Scroll to zoom
      </div>
    </div>
  );
}
