import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { Solid } from '../Geometry';
import { SPATIAL_SPECS as S } from '../../config/spatialLayout';
import { pbrLibrary as M } from '../../materials/pbrLibrary';
import { AnimatedClouds } from '../../weather/AnimatedClouds';
import { RainParticles } from '../../weather/RainParticles';
import { useWetWindowMaterial } from '../../weather/WindowRainEffect';
import { ViewportProfile } from '../../types';

function Exterior() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const windows = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const object = new THREE.Object3D(), color = new THREE.Color();
    let windowCount = 0;
    for (let i = 0; i < 30; i++) {
      const row = Math.floor(i / 10), h = 3 + ((i * 13) % 11) * .65;
      const x = -12 - row * 12, z = -22 + (i % 10) * 5.5, width = 2.4 + i % 3, depth = 2.1 + i % 4;
      object.position.set(x, h / 2 - 5.8, z);
      object.scale.set(width, h, depth);
      object.updateMatrix(); ref.current!.setMatrixAt(i, object.matrix);
      color.set(row === 0 ? '#8e9d9c' : row === 1 ? '#a7b5b5' : '#bdc8c6'); ref.current!.setColorAt(i, color);
      for (let floor = 0; floor < Math.floor(h / .78); floor++) for (let col = 0; col < 3; col++) {
        object.position.set(x + width / 2 + .012, -5.3 + floor * .78, z - depth / 2 + .42 + col * (depth - .84) / 2);
        object.scale.set(.025, .49, (depth - 1.1) / 3);
        object.updateMatrix(); windows.current!.setMatrixAt(windowCount, object.matrix);
        color.set((i + floor + col) % 9 === 0 ? '#afbdba' : '#536f78').lerp(new THREE.Color('#c1cdcd'), row * .23);
        windows.current!.setColorAt(windowCount++, color);
      }
    }
    windows.current!.count = windowCount; windows.current!.instanceMatrix.needsUpdate = true; windows.current!.instanceColor!.needsUpdate = true;
    ref.current!.instanceMatrix.needsUpdate = true; ref.current!.instanceColor!.needsUpdate = true;
  }, []);
  return <group name="Exterior-depth-12-to-40-metres">
    <instancedMesh ref={ref} args={[undefined, undefined, 30]}>
      <boxGeometry /><meshStandardMaterial roughness={1} fog />
    </instancedMesh>
    <instancedMesh ref={windows} args={[undefined, undefined, 1200]}><boxGeometry /><meshStandardMaterial roughness={.5} metalness={.15} fog /></instancedMesh>
    {/* Actual facade slabs give parallax through every pane. */}
    {Array.from({ length: 9 }, (_, i) => <Solid key={i} size={[.18, .1, 5.3]} position={[-10.7, -4.9 + i * .72, 1.5]} material={M.getBookCover('#a2b2b3')} castShadow={false} />)}
  </group>;
}

export function ArchitecturalWindow({ profile }: { profile: ViewportProfile }) {
  const wetGlass = useWetWindowMaterial();
  const { x, centerZ, width, bottom, top } = S.window;
  const height = top - bottom, mid = (bottom + top) / 2;
  const metal = M.getGraphiteMetal(), seal = M.getPlastic();
  return <>
    <Exterior />
    <AnimatedClouds profile={profile} />
    <RainParticles profile={profile} />
    <group name="ArchitecturalWindow" position={[x, 0, centerZ]}>
      {/* Reveal, insulated outer profiles and inner seals. */}
      {[-width / 2, width / 2].map(z => <group key={z}>
        <Solid size={[.24, height + .16, .11]} position={[0, mid, z]} material={metal} />
        <Solid size={[.026, height, .016]} position={[.126, mid, z + (z < 0 ? .06 : -.06)]} material={seal} radius={.001} />
      </group>)}
      {[bottom, top].map(y => <Solid key={y} size={[.25, .09, width]} position={[0, y, 0]} material={metal} />)}
      {[-width / 6, width / 6].map(z => <group key={z}>
        <Solid size={[.11, height, .048]} position={[.03, mid, z]} material={metal} />
        <Solid size={[.012, height, .012]} position={[.092, mid, z + .029]} material={seal} radius={.001} />
      </group>)}
      <Solid size={[.09, .04, width - .1]} position={[.03, 1.17, 0]} material={metal} />
      {[-1, 0, 1].map(i => <mesh key={i} name={`WetWindowPane-${i}`} position={[.005, mid, i * width / 3]} rotation={[0, Math.PI / 2, 0]} material={wetGlass}>
        <planeGeometry args={[width / 3 - .05, height - .1]} />
      </mesh>)}
      <Solid size={[.4, .045, width + .17]} position={[.06, bottom - .045, 0]} material={M.getWalnutDesk()} radius={.008} />
      <Solid size={[.16, .025, .13]} position={[.15, 1.52, .48]} material={metal} />
      <Solid size={[.025, .14, .025]} position={[.23, 1.47, .48]} material={M.getAnodizedAluminum()} radius={.007} />
      <Solid size={[.22, .11, width + .04]} position={[.09, top - .06, 0]} material={metal} />
      {Array.from({ length: 12 }, (_, i) => <Solid key={i} size={[.11, .012, width - .12]} position={[.14, top - .17 - i * .028, 0]} rotation={[0, 0, -.24]} material={M.getAnodizedAluminum()} radius={.002} />)}
      {[-1.12, 1.12].map(z => <Solid key={z} size={[.006, .4, .009]} position={[.19, top - .33, z]} material={seal} radius={.001} />)}
    </group>
  </>;
}
