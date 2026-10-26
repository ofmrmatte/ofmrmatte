'use client';

import { Component, ReactNode, Suspense, lazy, memo, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OfficeExperienceProps, ScrollStateRef, ViewportProfile } from './types';
import { getCameraWaypoints, STAGE_PROGRESS } from './config/cameraKeyframes';
import { BackgroundContext, getQualityProfile, viewportProfile } from './config/qualityProfiles';
import { ScreenTextureEngine } from './screens/ScreenTextureEngine';
import { pbrLibrary } from './materials/pbrLibrary';
import { ArchitecturalRoom } from './components/ArchitecturalRoom';
import { WorkstationDesk } from './components/WorkstationDesk';
import { Peripherals } from './components/Peripherals';
import { ErgonomicChair } from './components/ErgonomicChair';
import { ArchitecturalLighting } from './components/ArchitecturalLighting';
import { CinematicCameraRig } from './components/CinematicCameraRig';
import { AnimationContext } from './animations/AnimationCoordinator';
import { OfficeAnimationSystem } from './animations/OfficeAnimationSystem';
import './office.css';

const PostProcessingEffects = lazy(() => import('./components/PostProcessingEffects').then(m => ({ default: m.PostProcessingEffects })));
const SceneContent = memo(function SceneContent({ profile, engine, scrollState, background, debug }: { profile: ViewportProfile; engine: ScreenTextureEngine; scrollState: React.MutableRefObject<ScrollStateRef>; background: boolean; debug: boolean }) {
  return <>
    <ArchitecturalLighting profile={profile} />
    <ArchitecturalRoom profile={profile} />
    <WorkstationDesk screenEngine={engine} />
    <Peripherals screenEngine={engine} />
    <ErgonomicChair />
    <CinematicCameraRig scrollState={scrollState} profile={profile} screenEngine={engine} background={background} debug={debug} />
    {getQualityProfile(profile, background).post && <Suspense fallback={null}><PostProcessingEffects key={profile} profile={profile} /></Suspense>}
  </>;
});
const clamp = (value: number) => Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;
class SceneBoundary extends Component<{ children: ReactNode; background?: boolean }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.background ? <div className="office-background-fallback" /> : <div className="office-fallback"><p>A visualização 3D não pôde iniciar.</p><button onClick={() => location.reload()}>Recarregar escritório</button></div> : this.props.children; }
}
const OfficeCanvas = memo(function OfficeCanvas({ engine, profile, scrollState, background, active, reducedMotion, debug }: { engine: ScreenTextureEngine; profile: ViewportProfile; scrollState: React.MutableRefObject<ScrollStateRef>; background: boolean; active: boolean; reducedMotion: boolean; debug: boolean }) {
  const quality = getQualityProfile(profile, background), initial = getCameraWaypoints(profile)[0];
  return <SceneBoundary background={background}><Canvas shadows="soft" dpr={[quality.dpr[0], quality.dpr[1]]} frameloop={background ? 'never' : 'always'}
    aria-hidden={background || undefined} tabIndex={background ? -1 : undefined}
    gl={{ antialias: true, powerPreference: background ? 'low-power' : 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12, outputColorSpace: THREE.SRGBColorSpace }}
    camera={{ position: initial.position, fov: initial.fov, near: .035, far: 120 }}
    onCreated={({ gl }) => { gl.setClearColor('#c1cdcd'); gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
    fallback={background ? <div className="office-background-fallback" /> : <div className="office-fallback">Este navegador precisa de WebGL para exibir o escritório.</div>}>
    <fog attach="fog" args={['#a8bac6', 18, 65]} />
    <BackgroundContext.Provider value={background}><AnimationContext.Provider value={engine.coordinator}>
      <OfficeAnimationSystem engine={engine} scrollState={scrollState} profile={profile} background={background} active={active} reducedMotion={reducedMotion} />
      <Suspense fallback={null}><SceneContent profile={profile} engine={engine} scrollState={scrollState} background={background} debug={debug} /></Suspense>
    </AnimationContext.Provider></BackgroundContext.Provider>
  </Canvas></SceneBoundary>;
});
export function OfficeExperience({ debugHUD = false, externalScrollProgress, mode = 'experience', paused = false, className = '', style, overlayOpacity = .22 }: OfficeExperienceProps) {
  const background = mode === 'background';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<ViewportProfile>(() => viewportProfile(typeof window === 'undefined' ? 1200 : window.innerWidth));
  const [engine, setEngine] = useState<ScreenTextureEngine | null>(null);
  const [hud, setHud] = useState({ progress: 0, scene: 0 });
  const [visible, setVisible] = useState(true), [inView, setInView] = useState(true), [reducedMotion, setReducedMotion] = useState(false);
  const refreshScroll = useRef<() => void>(() => {});
  const scrollState = useRef<ScrollStateRef>({ progress: 0, velocity: 0, activeSceneIndex: 0, reducedMotion: false });
  const external = typeof externalScrollProgress === 'number';

  useEffect(() => {
    pbrLibrary.retain(); const instance = new ScreenTextureEngine(background); setEngine(instance);
    return () => { instance.dispose(); pbrLibrary.release(); delete window.__officeDiagnostics; };
  }, [background]);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => { scrollState.current.reducedMotion = motion.matches; setReducedMotion(motion.matches); };
    const updateVisibility = () => setVisible(!document.hidden);
    const resize = () => { setProfile(viewportProfile(background ? scrollContainerRef.current?.clientWidth || window.innerWidth : window.innerWidth)); refreshScroll.current(); };
    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (scrollContainerRef.current) { resizeObserver.observe(scrollContainerRef.current); intersection.observe(scrollContainerRef.current); }
    updateMotion(); updateVisibility(); resize(); motion.addEventListener('change', updateMotion); document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('resize', resize);
    return () => { resizeObserver.disconnect(); intersection.disconnect(); motion.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', updateVisibility); window.removeEventListener('resize', resize); };
  }, [background]);
  const updateProgress = (value: number, velocity = 0) => {
    const progress = clamp(value); scrollState.current.progress = progress; scrollState.current.velocity = velocity;
    const scene = STAGE_PROGRESS.reduce<number>((a, p, i) => Math.abs(p - progress) < Math.abs(STAGE_PROGRESS[a] - progress) ? i : a, 0);
    if (!background || debugHUD) setHud(previous => Math.round(previous.progress * 100) === Math.round(progress * 100) && previous.scene === scene ? previous : { progress, scene });
  };
  useEffect(() => { if (external) updateProgress(externalScrollProgress!); }, [externalScrollProgress]);
  useEffect(() => {
    if (external || background) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        ScrollTrigger.create({ trigger: scrollContainerRef.current, start: 'top top', end: 'bottom bottom', onUpdate: self => updateProgress(self.progress, self.getVelocity()) });
      }, scrollContainerRef);
      refreshScroll.current = () => ScrollTrigger.refresh();
      cleanup = () => ctx.revert();
    });
    return () => { cancelled = true; cleanup?.(); refreshScroll.current = () => {}; };
  }, [external, background]);
  const jump = (progress: number) => {
    if (external) { window.dispatchEvent(new CustomEvent('office:request-progress', { detail: progress })); return; }
    const el = scrollContainerRef.current!;
    window.scrollTo({ top: el.offsetTop + (el.offsetHeight - window.innerHeight) * progress, behavior: scrollState.current.reducedMotion ? 'instant' : 'smooth' });
  };
  const stages = getCameraWaypoints(profile);
  const active = visible && !paused && (!background || inView);
  if (background) return <div ref={scrollContainerRef} className={`office-background ${className}`} style={style} data-active={active} data-reduced-motion={reducedMotion}>
    <div className="office-background-scene" aria-hidden="true">
      {engine && <OfficeCanvas engine={engine} profile={profile} scrollState={scrollState} background active={active} reducedMotion={reducedMotion} debug={debugHUD} />}
      <div className="office-background-overlay" style={{ opacity: clamp(overlayOpacity) }} />
    </div>
    <a className="office-background-credit" href={`${import.meta.env.BASE_URL}ASSET_CREDITS.md`} target="_blank" rel="noreferrer" aria-label="Créditos e licença dos elementos 3D">Créditos 3D ↗</a>
    {debugHUD && <output className="office-debug">FUNDO · {profile.toUpperCase()} · {active ? reducedMotion ? 'ESTÁTICO' : 'ATIVO' : 'PAUSADO'}</output>}
  </div>;
  return <main ref={scrollContainerRef} className={`office-scroll ${className}`} style={{ height: external ? '100svh' : '600svh', ...style }} aria-label="Escritório 3D: experiência arquitetônica em cinco estágios">
    <div className="office-viewport">
      {engine && <OfficeCanvas engine={engine} profile={profile} scrollState={scrollState} background={false} active={active} reducedMotion={reducedMotion} debug={debugHUD} />}
      <header className="office-header">
        <div className="office-wordmark"><span className="office-mark">a<span>.</span></span><span>ATELIER<span className="office-wordmark-small">DEVELOPER OFFICE</span></span></div>
        <div className="office-edition"><span className="office-dot" /> CHUVA SUAVE <span className="office-divider">/</span> ESTUDO Nº 01 <a className="office-credit" href={`${import.meta.env.BASE_URL}ASSET_CREDITS.md`} target="_blank" rel="noreferrer">CRÉDITOS ↗</a></div>
      </header>
      <footer className="office-footer">
        <div className="office-caption"><span className="office-eyebrow">UM ESPAÇO PARA CRIAR</span><h1>Madeira, luz e código.</h1><p>Um olhar sobre o lugar onde as ideias ganham forma.</p></div>
        <nav className="office-stages" aria-label="Estágios da câmera">
          {stages.map((stage, i) => <button key={stage.id} aria-label={`Cena ${i + 1}: ${stage.label}`} aria-current={hud.scene === i ? 'step' : undefined} onClick={() => jump(STAGE_PROGRESS[i])}><span>{String(i + 1).padStart(2, '0')}</span><span className="office-stage-dot" /></button>)}
          <span className="office-stage-label">{stages[hud.scene].label}</span>
        </nav>
        <div className="office-scroll-hint"><span>ROLE PARA EXPLORAR</span><span className="office-arrow">↓</span></div>
      </footer>
      <div className="office-progress" style={{ transform: `scaleX(${hud.progress})` }} />
      {debugHUD && <output className="office-debug">CENA {hud.scene + 1} · {Math.round(hud.progress * 100)}% · {profile.toUpperCase()}</output>}
    </div>
  </main>;
}
