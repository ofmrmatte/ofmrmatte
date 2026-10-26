import { Component, ReactNode, Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

interface RealModelProps { url: string; position: THREE.Vector3Tuple; height: number; rotationY?: number; fallback: ReactNode }
class AssetBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function LoadedModel({ url, height }: Pick<RealModelProps, 'url' | 'height'>) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.updateMatrixWorld(true);
    const original = new THREE.Box3().setFromObject(cloned), size = original.getSize(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error(`Invalid physical bounds: ${url}`);
    cloned.scale.setScalar(height / size.y); cloned.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(cloned), center = box.getCenter(new THREE.Vector3());
    cloned.position.set(-center.x, -box.min.y, -center.z);
    cloned.traverse(object => {
      if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; }
    });
    cloned.userData.physicalHeight = height;
    return cloned;
  }, [scene, height, url]);
  // GLTF cache owns shared geometry and textures; a clone must not dispose them.
  return <primitive object={model} dispose={null} />;
}
export function RealModel({ position, rotationY = 0, fallback, ...props }: RealModelProps) {
  return <group position={position} rotation={[0, rotationY, 0]}>
    <AssetBoundary key={props.url} fallback={fallback}><Suspense fallback={fallback}><LoadedModel {...props} /></Suspense></AssetBoundary>
  </group>;
}
