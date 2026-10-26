import { MutableRefObject, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ScrollStateRef, ViewportProfile } from '../types';
import { createCameraPath, sampleCamera, STAGE_PROGRESS } from '../config/cameraKeyframes';
import { ScreenTextureEngine } from '../screens/ScreenTextureEngine';
import { validateSceneBounds } from '../utils/bounds';
import { BACKGROUND_PROFILES } from '../config/qualityProfiles';

export function CinematicCameraRig({ scrollState, profile, screenEngine, background = false, debug = false }: { scrollState: MutableRefObject<ScrollStateRef>; profile: ViewportProfile; screenEngine: ScreenTextureEngine; background?: boolean; debug?: boolean }) {
  const { camera, gl, scene } = useThree();
  const path = useMemo(() => createCameraPath(profile), [profile]);
  const desired = useMemo(() => new THREE.Vector3(), []), target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(...path.waypoints[0].target), [path]);
  const first = useRef(true), elapsed = useRef(0), frames = useRef(0), lastReport = useRef(0);
  const boundsCache = useRef({ geometries: -1, value: { overlaps: [], objects: [] } as ReturnType<typeof validateSceneBounds> });
  useFrame((_, delta) => {
    const progress = THREE.MathUtils.clamp(scrollState.current.progress, 0, 1);
    scrollState.current.activeSceneIndex = STAGE_PROGRESS.reduce<number>((best, p, i) => Math.abs(p - progress) < Math.abs(STAGE_PROGRESS[best] - progress) ? i : best, 0);
    const fov = sampleCamera(path, scrollState.current.reducedMotion && !background ? 0 : progress, desired, target);
    if (background && !scrollState.current.reducedMotion) {
      const time = screenEngine.coordinator.elapsed;
      desired.x += Math.sin(time * .045) * .035;
      desired.y += Math.sin(time * .031) * .015;
      target.x += Math.sin(time * .035) * .012;
    }
    const damp = first.current || scrollState.current.reducedMotion ? 1 : 1 - Math.exp(-(background ? 2.2 : 5) * Math.min(delta, .1));
    first.current = false; camera.position.lerp(desired, damp); look.lerp(target, damp); camera.lookAt(look);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, damp); camera.updateProjectionMatrix();
    }
    elapsed.current += delta; frames.current++;
    if ((!background || debug) && elapsed.current - lastReport.current > 1) {
      if (boundsCache.current.geometries !== gl.info.memory.geometries) {
        boundsCache.current = { geometries: gl.info.memory.geometries, value: validateSceneBounds(scene) };
      }
      window.__officeDiagnostics = {
        profile, progress, activeScene: scrollState.current.activeSceneIndex + 1, reducedMotion: scrollState.current.reducedMotion,
        plantLoaded: Boolean(scene.getObjectByName('pot')),
        camera: camera.position.toArray(), fov: (camera as THREE.PerspectiveCamera).fov,
        measuredFPS: frames.current / (elapsed.current - lastReport.current),
        memory: { geometries: gl.info.memory.geometries, textures: gl.info.memory.textures },
        screenVersions: [screenEngine.ideTexture.version, screenEngine.previewTexture.version, screenEngine.terminalTexture.version],
        animation: screenEngine.diagnostics(),
        weather: { time: screenEngine.coordinator.weatherUniforms.uTime.value, rain: scene.getObjectByName('ExteriorRainGPU')?.userData },
        dpr: gl.getPixelRatio(),
        bounds: boundsCache.current.value,
        mode: background ? 'background' : 'experience', targetFPS: background ? (scrollState.current.reducedMotion ? 1 : BACKGROUND_PROFILES[profile].frameFPS) : undefined,
      };
      frames.current = 0; lastReport.current = elapsed.current;
    }
  });
  return null;
}
