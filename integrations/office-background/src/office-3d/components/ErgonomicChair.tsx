import { useMemo } from 'react';
import * as THREE from 'three';
import { Solid, Rod } from './Geometry';
import { pbrLibrary as M } from '../materials/pbrLibrary';
import { SPATIAL_SPECS as S } from '../config/spatialLayout';
function curvedBack() {
  const g = new THREE.BoxGeometry(.46, .57, .027, 16, 18, 1), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), v = (y + .285) / .57;
    p.setXYZ(i, x * (.91 + .09 * Math.sin(v * Math.PI)), y, p.getZ(i) + .052 * (x / .23) ** 2 - .064 * v ** 2 + .022 * Math.sin(v * 5));
    uv.setXY(i, x + .23, y + .285);
  }
  g.computeVertexNormals(); return g;
}
export function ErgonomicChair() {
  const back = useMemo(curvedBack, []), metal = M.getGraphiteMetal(), plastic = M.getPlastic();
  const { position, rotationY } = S.chair;
  return <group name="ErgonomicChair" position={position} rotation={[0, rotationY, 0]}>
    {Array.from({ length: 5 }, (_, i) => <group key={i} rotation={[0, i * Math.PI * 2 / 5, 0]}>
      <Rod from={[0, .105, 0]} to={[0, .055, .294]} radius={.014} material={M.getAnodizedAluminum()} />
      <Solid size={[.042, .034, .044]} position={[0, .052, .295]} material={plastic} radius={.009} />
      {[-.019, .019].map(x => <mesh key={x} position={[x, .026, .303]} rotation={[0, 0, Math.PI / 2]} castShadow material={plastic}><cylinderGeometry args={[.026, .026, .014, 20]} /></mesh>)}
    </group>)}
    <mesh position={[0, .21, 0]} castShadow material={metal}><cylinderGeometry args={[.028, .032, .27, 24]} /></mesh>
    <mesh position={[0, .37, 0]} castShadow material={M.getAnodizedAluminum()}><cylinderGeometry args={[.015, .015, .15, 24]} /></mesh>
    <Solid size={[.29, .045, .28]} position={[0, .408, -.015]} material={plastic} radius={.015} />
    <Solid size={[.504, .043, .472]} position={[0, .439, .02]} material={plastic} radius={.02} />
    <Solid size={[.494, .058, .468]} position={[0, .466, .025]} material={M.getChairFabric()} radius={.027} />
    <Solid size={[.456, .025, .027]} position={[0, .455, .252]} material={M.getChairFabric()} radius={.012} />
    <Rod from={[.13, .408, -.05]} to={[.25, .415, -.05]} radius={.007} material={metal} />
    <Solid size={[.07, .012, .027]} position={[.252, .418, -.05]} material={plastic} radius={.005} />
    {[-1, 1].map(side => <group key={side}>
      <Rod from={[side * .21, .42, -.06]} to={[side * .274, .57, -.06]} radius={.014} material={metal} />
      <Solid size={[.022, .11, .033]} position={[side * .274, .605, -.06]} material={plastic} radius={.006} />
      <Solid size={[.075, .027, .235]} position={[side * .274, .668, -.015]} material={M.getLeather()} radius={.012} />
    </group>)}
    <Rod from={[0, .415, -.14]} to={[0, .68, -.27]} radius={.022} material={metal} />
    <Rod from={[0, .65, -.27]} to={[-.19, .85, -.24]} radius={.014} material={plastic} />
    <Rod from={[0, .65, -.27]} to={[.19, .85, -.24]} radius={.014} material={plastic} />
    <group position={[0, .809, -.216]}>
      <mesh geometry={back} material={M.getChairFabric()} castShadow receiveShadow />
      <Solid size={[.34, .075, .035]} position={[0, -.18, -.029]} material={plastic} radius={.016} />
      {[-1, 1].map(side => <Rod key={side} from={[side * .17, -.2, -.025]} to={[side * .2, .19, -.058]} radius={.011} material={plastic} />)}
    </group>
    <Rod from={[0, 1.03, -.29]} to={[0, 1.15, -.3]} radius={.014} material={metal} />
    <Solid size={[.26, .12, .055]} position={[0, 1.16, -.285]} rotation={[.13, 0, 0]} material={M.getChairFabric()} radius={.025} />
  </group>;
}
