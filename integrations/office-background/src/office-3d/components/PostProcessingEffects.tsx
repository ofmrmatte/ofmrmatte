/// <reference types="vite/client" />
import { EffectComposer, EffectComposerContext, N8AO, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { EffectComposer as Composer, ToneMappingMode } from 'postprocessing';
import { useContext, useEffect } from 'react';
import { ViewportProfile } from '../types';
import { QUALITY_PROFILES } from '../config/qualityProfiles';
import { useThree } from '@react-three/fiber';
const disposals: WeakMap<Composer, ReturnType<typeof setTimeout>> = import.meta.hot?.data.disposals ?? new WeakMap();
if (import.meta.hot) import.meta.hot.data.disposals = disposals;
function ComposerResources() {
  const { composer } = useContext(EffectComposerContext);
  const dpr = useThree(s => s.viewport.dpr);
  const size = useThree(s => s.size);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, dpr, size.width, size.height]);
  useEffect(() => {
    clearTimeout(disposals.get(composer));
    const passes = [...composer.passes];
    return () => {
      disposals.set(composer, setTimeout(() => {
        // v2.19 removes passes on unmount but does not dispose the composer.
        // N8AO's nested fullscreen quads also need explicit cleanup in this version.
        for (const pass of passes) {
          for (const [key, value] of Object.entries(pass)) {
            if (key.endsWith('Quad') && value && typeof value.dispose === 'function') value.dispose();
          }
          pass.dispose();
        }
        composer.dispose(); disposals.delete(composer);
      }, 0));
    };
  }, [composer]);
  return null;
}
export function PostProcessingEffects({ profile }: { profile: ViewportProfile }) {
  const q = QUALITY_PROFILES[profile];
  if (!q.post) return null;
  return <EffectComposer multisampling={q.msaa} enableNormalPass={false}>
    <N8AO aoRadius={.17} distanceFalloff={.7} intensity={1.25} quality={q.ao} halfRes screenSpaceRadius={false} />
    <Bloom luminanceThreshold={1.4} mipmapBlur intensity={.07} radius={.4} />
    <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    <Vignette eskil={false} offset={.3} darkness={.12} />
    <ComposerResources />
  </EffectComposer>;
}
