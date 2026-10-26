import { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function physicalBox(size: THREE.Vector3Tuple, radius = .003, vertical = false) {
  const geometry = radius > 0 ? new RoundedBoxGeometry(...size, 1, radius) : new THREE.BoxGeometry(...size);
  const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (vertical) uv.setXY(i, y + size[1] / 2, nx > nz ? z + size[2] / 2 : x + size[0] / 2);
    else if (ny >= nx && ny >= nz) uv.setXY(i, x + size[0] / 2, z + size[2] / 2);
    else uv.setXY(i, nx > nz ? z + size[2] / 2 : x + size[0] / 2, y + size[1] / 2);
  }
  return geometry;
}
type SolidProps = Omit<ThreeElements['mesh'], 'args'> & { size: THREE.Vector3Tuple; radius?: number; vertical?: boolean };
export function Solid({ size, radius = .003, vertical = false, ...props }: SolidProps) {
  const geometry = useMemo(() => physicalBox(size, radius, vertical), [size[0], size[1], size[2], radius, vertical]);
  return <mesh castShadow receiveShadow geometry={geometry} {...props} />;
}
export function Rod({ from, to, radius = .008, material }: { from: THREE.Vector3Tuple; to: THREE.Vector3Tuple; radius?: number; material: THREE.Material }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <mesh position={a.add(b).multiplyScalar(.5)} quaternion={q} castShadow material={material}>
    <cylinderGeometry args={[radius, radius, d.length(), 10]} />
  </mesh>;
}
