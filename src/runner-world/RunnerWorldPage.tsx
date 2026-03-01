import { Canvas } from '@react-three/fiber';
import { RunnerScene } from './components/RunnerScene';
import { RunnerHUD } from './ui/RunnerHUD';
import { BackButton } from '../BackButton';

export default function RunnerWorldPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#87ceeb', touchAction: 'none' }}>
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <RunnerScene />
      </Canvas>
      <RunnerHUD />
      <BackButton />
    </div>
  );
}
