import { Canvas } from '@react-three/fiber';
import { BackButton } from '../BackButton';

export default function RunnerWorldPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#1a1a2e', touchAction: 'none' }}>
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </Canvas>
      <BackButton />
    </div>
  );
}
