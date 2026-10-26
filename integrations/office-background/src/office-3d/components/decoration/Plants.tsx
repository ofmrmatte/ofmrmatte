import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RealModel } from '../RealModel';
import { pbrLibrary as M } from '../../materials/pbrLibrary';
import { SPATIAL_SPECS as S } from '../../config/spatialLayout';
import { useQualityProfile } from '../../config/qualityProfiles';
import { ViewportProfile } from '../../types';

// Closed, curved leaf surface with a fine central ridge, rather than ellipsoids.
function leafGeometry() {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const rows = 16, cols = 8;
  for (let side = 0; side < 2; side++) for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) {
    const v = y / rows, u = x / cols * 2 - 1;
    const breadth = Math.pow(Math.sin(v * Math.PI), .72) * .098 * (1 + .09 * Math.sin(v * 21));
    positions.push(u * breadth, v * .38, Math.sin(v * Math.PI) * .07 + u * u * .029 - side * .0007);
    uvs.push(x / cols, v);
  }
  const layer = (rows + 1) * (cols + 1);
  for (let side = 0; side < 2; side++) for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const a = side * layer + y * (cols + 1) + x, b = a + cols + 1;
    if (!side) indices.push(a, a + 1, b, b, a + 1, b + 1); else indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals(); return g;
}
export function ProceduralPlant({ count = 20, scale = 1 }: { count?: number; scale?: number }) {
  const leaf = useMemo(leafGeometry, []);
  const pot = useMemo(() => [new THREE.Vector2(0, 0), new THREE.Vector2(.13, 0), new THREE.Vector2(.146, .02), new THREE.Vector2(.185, .35), new THREE.Vector2(.185, .37), new THREE.Vector2(.175, .375), new THREE.Vector2(.166, .36), new THREE.Vector2(.13, .028), new THREE.Vector2(0, .028)], []);
  const branches = useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle = i * 2.39996, r = .15 + i % 5 * .035, y = .68 + (i % 7) * .075;
    const end = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, .34, 0), new THREE.Vector3(end.x * .3, y * .85, end.z * .3), end);
    return { angle, end, geometry: new THREE.TubeGeometry(curve, 12, .003, 5, false) };
  }), [count]);
  useEffect(() => () => branches.forEach(branch => branch.geometry.dispose()), [branches]);
  useEffect(() => () => leaf.dispose(), [leaf]);
  return <group scale={scale}>
    <mesh material={M.getCeramic()} castShadow receiveShadow><latheGeometry args={[pot, 40]} /></mesh>
    <mesh position={[0, .346, 0]} material={M.getSoil()}><cylinderGeometry args={[.166, .166, .012, 32]} /></mesh>
    {branches.map(({ angle, end, geometry }, i) => <group key={i}>
      <mesh geometry={geometry} material={M.getStem()} castShadow />
      <mesh geometry={leaf} position={end} rotation={[.35 + i % 4 * .13, -angle, -.52]} scale={.7 + i % 5 * .09} material={M.getLeaf()} castShadow receiveShadow />
    </group>)}
  </group>;
}
export function Plants({ profile }: { profile: ViewportProfile }) {
  const quality = useQualityProfile(profile);
  return <group name="Plants">
    <group name="MainPlant">
      <RealModel url={`${import.meta.env.BASE_URL}models/plant/plant.glb`} position={S.plant.position} height={S.plant.height} rotationY={.6} fallback={<ProceduralPlant count={quality.leafCount} scale={1.15} />} />
    </group>
    <group name="SmallPlant" position={[2.66, 2.114, -1.3]}><ProceduralPlant count={profile === 'mobile' ? 7 : 11} scale={.24} /></group>
  </group>;
}
