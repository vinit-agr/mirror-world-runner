import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { THEME } from '../config/ThemeConfig';

export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={THEME.bloom.intensity}
        luminanceThreshold={THEME.bloom.luminanceThreshold}
        luminanceSmoothing={THEME.bloom.luminanceSmoothing}
        mipmapBlur
      />
    </EffectComposer>
  );
}
