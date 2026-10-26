import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Solid, physicalBox } from './Geometry';
import { ArchitecturalWindow } from './architecture/Window';
import { Bookshelf } from './furniture/Bookshelf';
import { Plants } from './decoration/Plants';
import { SPATIAL_SPECS as S } from '../config/spatialLayout';
import { pbrLibrary as M } from '../materials/pbrLibrary';
import { ViewportProfile } from '../types';

function Floor() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => physicalBox([1.548, .025, .198], .001), []);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D(), c = new THREE.Color();
    let i = 0;
    for (let row = 0; row < 25; row++) {
      let x = -3.1, col = 0;
      while (x < 3.099) {
        const length = Math.min(3.1 - x, col === 0 ? .48 + (row * 7 % 11) * .1 : 1.32 + ((row + col * 3) % 5) * .12);
        dummy.position.set(x + length / 2, .0075, S.room.backZ + .1 + row * .2);
        dummy.scale.set((length - .002) / 1.548, 1, 1);
        dummy.rotation.y = (row + col) % 2 ? Math.PI : 0; dummy.updateMatrix();
        ref.current!.setMatrixAt(i, dummy.matrix);
        c.setScalar(.83 + ((i * 23) % 13) * .012); ref.current!.setColorAt(i, c);
        x += length; i++; col++;
      }
    }
    ref.current!.count = i;
    ref.current!.instanceMatrix.needsUpdate = true; ref.current!.instanceColor!.needsUpdate = true;
  }, []);
  return <group name="Floor">
    <Solid size={[6.2, .09, 5]} position={[0, -.05, .68]} material={M.getBookCover('#554332')} radius={0} />
    <instancedMesh ref={ref} args={[geo, M.getHardwoodFloor(), 150]} receiveShadow />
  </group>;
}
function Slats() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { width, height, z, count } = S.slats;
  const geometry = useMemo(() => physicalBox([.048, height, .052], .003, true), [height]);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D(), c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      dummy.position.set(-width / 2 + .04 + i * (width - .08) / (count - 1), height / 2 + .075, z);
      dummy.updateMatrix(); ref.current!.setMatrixAt(i, dummy.matrix);
      c.setScalar(.81 + ((i * 7) % 13) * .015); ref.current!.setColorAt(i, c);
    }
    ref.current!.instanceMatrix.needsUpdate = true; ref.current!.instanceColor!.needsUpdate = true;
  }, [width, height, z, count]);
  return <group name="SlattedWall">
    <Solid size={[width + .08, height, .04]} position={[0, height / 2 + .075, z - .046]} material={M.getPlastic()} />
    <instancedMesh ref={ref} args={[geometry, M.getSlattedWood(), count]} castShadow receiveShadow />
    <Solid size={[width, .018, .06]} position={[0, 3.012, z]} material={M.getBrass()} />
    <mesh position={[0, 2.995, z + .025]}><boxGeometry args={[width - .1, .009, .012]} /><meshBasicMaterial color="#ffcc98" toneMapped={false} /></mesh>
  </group>;
}
export function ArchitecturalRoom({ profile }: { profile: ViewportProfile }) {
  const mineral = M.getMineralWall(), metal = M.getGraphiteMetal();
  const { x, centerZ, width, bottom, top } = S.window;
  return <group name="Architecture">
    <Floor />
    <Solid size={[S.rug.width, .015, S.rug.depth]} position={[0, .0275, S.rug.z]} radius={.007} material={M.getRug()} castShadow={false} />
    {/* Subtle woven border, resting on the boards. */}
    {[-1, 1].map(side => <Solid key={side} size={[.012, .001, S.rug.depth - .025]} position={[side * (S.rug.width / 2 - .025), .0355, S.rug.z]} material={M.getDeskMatFelt()} castShadow={false} radius={0} />)}
    <Solid size={[6.2, 3.1, .18]} position={[0, 1.55, S.room.backZ]} material={mineral} radius={0} />
    {/* Left wall is built around a real opening: no opaque wall behind the glass. */}
    <Solid size={[.18, bottom, 5]} position={[x - .03, bottom / 2, .68]} material={mineral} radius={0} />
    <Solid size={[.18, 3.1 - top, 5]} position={[x - .03, (top + 3.1) / 2, .68]} material={mineral} radius={0} />
    <Solid size={[.18, top - bottom, .57]} position={[x - .03, (bottom + top) / 2, -1.535]} material={mineral} radius={0} />
    <Solid size={[.18, top - bottom, 1.28]} position={[x - .03, (bottom + top) / 2, 2.54]} material={mineral} radius={0} />
    <Solid size={[.18, 3.1, 2.5]} position={[3.04, 1.55, -.57]} material={mineral} radius={0} />
    <Solid size={[6.2, .12, 3.45]} position={[0, 3.16, -.1]} material={mineral} radius={0} />
    <Solid size={[6.05, .085, .026]} position={[0, .063, -1.712]} material={metal} />
    <Solid size={[.026, .085, 5]} position={[-2.925, .063, .68]} material={metal} />
    <Slats />
    <ArchitecturalWindow profile={profile} />
    <Bookshelf profile={profile} />
    <Plants profile={profile} />
    <Solid size={[.16, .08, .014]} position={[1.15, .26, -1.715]} material={M.getCeramic()} />
    {[-.035, .035].map(dx => <Solid key={dx} size={[.022, .03, .004]} position={[1.15 + dx, .26, -1.705]} material={M.getPlastic()} radius={.001} />)}
    {/* Recessed architectural linear fitting. */}
    <Solid size={[1.2, .025, .045]} position={[0, 3.086, .15]} material={metal} />
    <mesh position={[0, 3.071, .15]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[1.15, .025]} /><meshBasicMaterial color="#fff1d9" toneMapped={false} /></mesh>
  </group>;
}
