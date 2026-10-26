import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Solid, physicalBox } from '../Geometry';
import { pbrLibrary as M } from '../../materials/pbrLibrary';
import { SPATIAL_SPECS as S } from '../../config/spatialLayout';
import { ViewportProfile } from '../../types';
import { StaticGeometryBatch } from '../StaticGeometryBatch';

const palette = ['#334b4b', '#a18d70', '#6d5142', '#393e3d', '#aeb0a1', '#716c5c', '#69534e', '#233a40'];
export function Book({ width = .045, height = .27, depth = .19, color = '#716c5c', index = 0 }: { width?: number; height?: number; depth?: number; color?: string; index?: number }) {
  const cover = useMemo(() => {
    const parts = [
      physicalBox([.0025, height, depth], .0007).translate(-width / 2 + .00125, height / 2, 0),
      physicalBox([.0025, height, depth], .0007).translate(width / 2 - .00125, height / 2, 0),
      physicalBox([width, height, .006], .001).translate(0, height / 2, depth / 2 - .003),
    ];
    const g = mergeGeometries(parts)!; parts.forEach(p => p.dispose()); return g;
  }, [width, height, depth]);
  const detail = useMemo(() => {
    const parts = [.2, .8].map(r => physicalBox([width * .66, .002, .001], 0).translate(0, height * r, depth / 2 + .0006));
    for (let i = 0; i < 2 + index % 3; i++) parts.push(physicalBox([width * .62, .0035, .0008], 0).translate(0, height * .57 - i * .009, depth / 2 + .0007));
    const g = mergeGeometries(parts)!; parts.forEach(p => p.dispose()); return g;
  }, [width, height, depth, index]);
  useEffect(() => () => { cover.dispose(); detail.dispose(); }, [cover, detail]);
  return <group>
    <mesh geometry={cover} castShadow receiveShadow material={M.getBookCover(color)} />
    <Solid size={[width - .006, height - .008, depth - .009]} position={[0, height / 2, -.002]} radius={.001} material={M.getPages()} />
    <mesh geometry={detail} material={M.getPages()} />
  </group>;
}
export function CeramicVase({ position, scale = 1 }: { position: THREE.Vector3Tuple; scale?: number }) {
  const points = useMemo(() => [new THREE.Vector2(0, 0), new THREE.Vector2(.062, 0), new THREE.Vector2(.082, .02), new THREE.Vector2(.087, .1), new THREE.Vector2(.059, .18), new THREE.Vector2(.036, .22), new THREE.Vector2(.036, .255), new THREE.Vector2(.031, .258), new THREE.Vector2(.029, .25), new THREE.Vector2(.03, .218), new THREE.Vector2(.052, .17), new THREE.Vector2(.076, .1), new THREE.Vector2(.071, .02), new THREE.Vector2(0, .012)], []);
  return <mesh position={position} scale={scale} material={M.getCeramic()} castShadow receiveShadow><latheGeometry args={[points, 40]} /></mesh>;
}
export function Bookshelf({ profile }: { profile: ViewportProfile }) {
  const { x, z, width, height, depth, levels } = S.shelf;
  const metal = M.getGraphiteMetal(), wood = M.getWalnutDesk();
  return <group name="Bookshelf" position={[x, S.room.floorY, z]}>
    <StaticGeometryBatch key={profile}>
    {/* Four independent 25 mm steel uprights, fixed to a low walnut credenza. */}
    {[-1, 1].flatMap(side => [-1, 1].map(front => <Solid key={`${side}-${front}`} size={[.025, height, .025]} position={[side * (width / 2 - .022), height / 2, front * (depth / 2 - .022)]} material={metal} />))}
    <Solid size={[width - .07, .37, depth - .01]} position={[0, .215, 0]} radius={.008} material={wood} />
    {[-1, 1].map(side => <group key={side}>
      <Solid size={[width / 2 - .05, .325, .018]} position={[side * (width / 4 - .008), .22, depth / 2 + .007]} material={wood} radius={.004} />
      <Solid size={[.082, .009, .013]} position={[side * .12, .32, depth / 2 + .025]} material={M.getBrass()} radius={.003} />
    </group>)}
    {[.43, ...levels.slice(1), 2.59].map((y, i) => <group key={y}>
      <Solid size={[width, .028, depth]} position={[0, y, 0]} material={wood} radius={.004} />
      {[-1, 1].map(side => <mesh key={side} position={[side * (width / 2 - .04), y - .02, depth / 2 + .001]} rotation={[Math.PI / 2, 0, 0]} material={M.getAnodizedAluminum()}><cylinderGeometry args={[.004, .004, .002, 8]} /></mesh>)}
      {i > 0 && <mesh position={[0, y - .018, .12]}><boxGeometry args={[width - .12, .005, .012]} /><meshBasicMaterial color="#ffcc91" toneMapped={false} /></mesh>}
    </group>)}
    {/* Deliberately varied groups, each resting on its shelf's top surface. */}
    {[{ y: .444, start: -.52, count: 6 }, { y: 1.094, start: -.09, count: 8 }, { y: 1.594, start: -.54, count: 5 }, { y: 2.094, start: -.15, count: 7 }].map((row, r) => <group key={r} position={[row.start, row.y, .025]}>
      {Array.from({ length: row.count }, (_, i) => <group key={i} position={[i * .055, 0, -((i * 7) % 3) * .011]}>
        <Book width={.031 + i % 3 * .009} height={.205 + ((i * 7 + r * 3) % 6) * .025} depth={.155 + i % 4 * .015} color={palette[(i + r * 2) % palette.length]} index={i + r} />
      </group>)}
      <Solid size={[.014, .115, .16]} position={[-.04, .0575, .01]} material={metal} />
    </group>)}
    <CeramicVase position={[.36, .444, .015]} scale={1.25} />
    <CeramicVase position={[-.4, 1.094, .02]} scale={.83} />
    {/* Horizontal folios with a small bronze study above. */}
    {[0, 1, 2].map(i => <group key={i} position={[.34 + (i % 2) * .009, 1.617 + i * .046, .03]} rotation={[0, (i - 1) * .07, -Math.PI / 2]}><Book width={.046} height={.265} depth={.19} color={palette[i + 1]} index={i} /></group>)}
    <mesh position={[.47, 1.81, .03]} rotation={[0, .4, .3]} castShadow material={M.getBrass()}><torusKnotGeometry args={[.064, .014, profile === 'mobile' ? 32 : 64, 8, 2, 3]} /></mesh>
    <Solid size={[.3, .13, .26]} position={[-.39, 2.159, -.015]} material={M.getLeather()} radius={.008} />
    <Solid size={[.078, .019, .002]} position={[-.39, 2.17, .118]} material={M.getBrass()} radius={.003} />
    <Solid size={[.2, .009, .21]} position={[-.39, 2.229, -.015]} material={M.getLeather()} radius={.002} />
    </StaticGeometryBatch>
  </group>;
}
