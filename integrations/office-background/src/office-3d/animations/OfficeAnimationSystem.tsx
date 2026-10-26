import { MutableRefObject, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ScreenTextureEngine } from '../screens/ScreenTextureEngine';
import { ScrollStateRef, ViewportProfile } from '../types';
import { BACKGROUND_PROFILES } from '../config/qualityProfiles';
import { FrameBudget } from './FrameBudget';

export function OfficeAnimationSystem({ engine, scrollState, profile, background = false, active = true, reducedMotion = false }: { engine: ScreenTextureEngine; scrollState: MutableRefObject<ScrollStateRef>; profile: ViewportProfile; background?: boolean; active?: boolean; reducedMotion?: boolean }) {
  const setFrameloop = useThree(s => s.setFrameloop);
  const advance = useThree(s => s.advance), get = useThree(s => s.get);
  const setDpr = useThree(s => s.setDpr);
  const performanceWindow = useRef({ seconds: 0, frames: 0 });
  useEffect(() => {
    if (background) return;
    const visibility = () => { setFrameloop(document.hidden || !active ? 'never' : 'always'); if (!document.hidden) engine.clock.sync(); };
    visibility(); document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('visibilitychange', visibility); };
  }, [engine, setFrameloop, background, active]);
  useEffect(() => {
    if (!background) return;
    const budget = new FrameBudget(get().clock.elapsedTime);
    const fps = reducedMotion ? 1 : BACKGROUND_PROFILES[profile].frameFPS;
    let frame = 0;
    if (!active) { if (!document.hidden) advance(get().clock.elapsedTime, false); return; }
    engine.clock.sync();
    const render = (now: number) => {
      const time = budget.tick(now, fps);
      if (time !== null) advance(time, false);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [background, active, reducedMotion, profile, advance, get, engine]);
  useFrame(({ viewport }, delta) => {
    engine.update(delta, scrollState.current.progress, profile, scrollState.current.reducedMotion);
    if (document.hidden || !active) return;
    const sample = performanceWindow.current; sample.seconds += delta; sample.frames++;
    const detail = !background && scrollState.current.progress >= .58 && scrollState.current.progress <= .84;
    const detailDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (detail && viewport.dpr < detailDpr - .01) setDpr(detailDpr);
    if (sample.seconds >= 4) {
      const fps = sample.frames / sample.seconds;
      const threshold = background ? BACKGROUND_PROFILES[profile].frameFPS * .7 : 27;
      const minimumDpr = background ? 1 : .8;
      if (!reducedMotion && !detail && fps < threshold && viewport.dpr > minimumDpr + .02) setDpr(Math.max(minimumDpr, viewport.dpr * .85));
      sample.seconds = 0; sample.frames = 0;
    }
  }, -1);
  return null;
}
