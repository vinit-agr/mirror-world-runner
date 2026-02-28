import { Canvas } from '@react-three/fiber';
import { GameLoop } from './components/GameLoop';
import { HUD } from './ui/HUD';
import { TouchControls } from './ui/TouchControls';
import { MenuOverlay } from './ui/MenuOverlay';
import { BackButton } from '../BackButton';

export default function MirrorWorldRunnerPage() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#000011', touchAction: 'none' }}>
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <GameLoop />
      </Canvas>
      <HUD />
      <TouchControls />
      <MenuOverlay />
      <BackButton />
    </div>
  );
}
