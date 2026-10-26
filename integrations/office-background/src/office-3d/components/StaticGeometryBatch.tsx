import { ReactNode, useContext, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BackgroundContext } from '../config/qualityProfiles';

/** Merge static decoration by material, retaining source objects for React cleanup. */
export function StaticGeometryBatch({ children }: { children: ReactNode }) {
  const enabled = useContext(BackgroundContext);
  const root = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const group = root.current;
    if (!enabled || !group) return;
    group.updateWorldMatrix(true, true);
    const inverse = group.matrixWorld.clone().invert();
    const originals: THREE.Mesh[] = [], buckets = new Map<THREE.Material, { parts: THREE.BufferGeometry[]; cast: boolean; receive: boolean }>();
    group.traverse(object => {
      if (!(object instanceof THREE.Mesh) || !object.visible || Array.isArray(object.material) || object instanceof THREE.InstancedMesh) return;
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      const bucket = buckets.get(object.material) ?? { parts: [], cast: false, receive: false };
      bucket.parts.push(geometry); bucket.cast ||= object.castShadow; bucket.receive ||= object.receiveShadow;
      buckets.set(object.material, bucket); originals.push(object);
    });
    const batch = new THREE.Group(); batch.name = 'StaticDecorationBatch';
    for (const [material, bucket] of buckets) {
      const geometry = mergeGeometries(bucket.parts, false);
      bucket.parts.forEach(part => part.dispose());
      if (!geometry) { batch.children.forEach(object => (object as THREE.Mesh).geometry.dispose()); return; }
      const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = bucket.cast; mesh.receiveShadow = bucket.receive; batch.add(mesh);
    }
    originals.forEach(object => { object.visible = false; }); group.add(batch);
    return () => {
      group.remove(batch); originals.forEach(object => { object.visible = true; });
      batch.children.forEach(object => (object as THREE.Mesh).geometry.dispose());
    };
  }, [enabled]);
  return <group ref={root}>{children}</group>;
}
