import { Canvas } from '@react-three/fiber';
import { GameLoop } from './game/components/GameLoop';
import { HUD } from './game/ui/HUD';
import { TouchControls } from './game/ui/TouchControls';
import { MenuOverlay } from './game/ui/MenuOverlay';

export default function App() {
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
    </div>
  );
}
