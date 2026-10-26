import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Environment, Lightformer } from '@react-three/drei';
import { useQualityProfile } from '../config/qualityProfiles';
import { ViewportProfile } from '../types';
import { useFrame } from '@react-three/fiber';
import { WEATHER } from '../weather/WeatherConfig';

export function ArchitecturalLighting({ profile }: { profile: ViewportProfile }) {
  const q = useQualityProfile(profile);
  // Reflection content is static. Retain the initial device-sized cubemap when
  // resizing, avoiding repeated PMREM allocation in Three.js r169.
  const environmentResolution = useRef(q.environment).current;
  const sun = useRef<THREE.DirectionalLight>(null), geometryCount = useRef(-1);
  useEffect(() => {
    geometryCount.current = -1;
    if (sun.current?.shadow.map) { sun.current.shadow.map.dispose(); sun.current.shadow.map = null; }
  }, [profile]);
  useFrame(({ gl }) => {
    // Static furniture does not need another shadow render for each camera frame.
    // An asset arrival or a quality change invalidates the cached map.
    if (sun.current && geometryCount.current !== gl.info.memory.geometries) {
      geometryCount.current = gl.info.memory.geometries;
      sun.current.shadow.needsUpdate = true;
    }
  });
  const sunlightTarget = useMemo(() => { const o = new THREE.Object3D(); o.position.set(.2, .1, -.45); return o; }, []);
  const deskTarget = useMemo(() => { const o = new THREE.Object3D(); o.position.set(0, .75, -.2); return o; }, []);
  return <group name="ArchitecturalLighting">
    <hemisphereLight args={['#c7d8e6', '#887055', .93]} />
    <primitive object={sunlightTarget} />
    <directionalLight ref={sun} position={[-7.8, 4.7, 2.7]} target={sunlightTarget} color="#d1e1ed" intensity={WEATHER.sunIntensity} castShadow shadow-autoUpdate={false} shadow-needsUpdate
      shadow-mapSize={[q.shadowMap, q.shadowMap]} shadow-bias={-.00015} shadow-normalBias={.012}
      shadow-camera-left={-4.5} shadow-camera-right={4.5} shadow-camera-top={4.5} shadow-camera-bottom={-4.5} shadow-camera-near={.1} shadow-camera-far={20} />
    {/* Unshadowed area fill approximates bounced skylight; this is not physical GI. */}
    <rectAreaLight position={[-2.75, 1.95, .3]} rotation={[0, -Math.PI / 2, 0]} width={2.8} height={1.9} intensity={WEATHER.skyFill} color="#c8deee" />
    <rectAreaLight position={[0, 2.92, -.75]} rotation={[-Math.PI / 2, 0, 0]} width={2.8} height={1} intensity={2.6} color="#ffe0b6" />
    <primitive object={deskTarget} />
    <spotLight position={[-.1, 1.27, -.51]} target={deskTarget} color="#fff0d5" intensity={.4} angle={1.03} penumbra={.8} distance={1.4} decay={2} />
    <rectAreaLight position={[2.18, 1.77, -.99]} width={1.15} height={1.9} intensity={1.7} color="#ffd09b" />
    <Environment resolution={environmentResolution} frames={1}>
      <Lightformer form="rect" intensity={2.7} color="#daeaf5" scale={[3.2, 2.2, 1]} position={[-3.2, 1.8, .3]} rotation={[0, Math.PI / 2, 0]} />
      <Lightformer form="rect" intensity={1.1} color="#ffe0ba" scale={[3, 2, 1]} position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <Lightformer form="rect" intensity={.7} color="#e8e7de" scale={[4, 2.6, 1]} position={[1, 2, 4]} rotation={[0, Math.PI, 0]} />
    </Environment>
  </group>;
}
