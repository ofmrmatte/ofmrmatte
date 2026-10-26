import * as THREE from 'three';
import { CameraWaypoint, ViewportProfile } from '../types';
export const STAGE_PROGRESS = [0, .28, .52, .76, 1] as const;
export function getCameraWaypoints(profile: ViewportProfile): CameraWaypoint[] {
  const mobile = profile === 'mobile', tablet = profile === 'tablet';
  const positions: THREE.Vector3Tuple[] = mobile
    ? [[1.6, 1.65, 4.7], [1.35, 1.7, 3.6], [.75, 1.68, 2.65], [.52, 1.65, .85], [0, 1.66, 5.2]]
    : [[2.6, 1.78, 3.7], [2.05, 1.75, 2.7], [1.32, 1.69, 1.82], [.28, 1.55, .92], [0, 1.82, 4.5]];
  const targets: THREE.Vector3Tuple[] = [[-.12, 1.21, -.55], [-.18, 1.09, -.48], [-.25, 1.02, -.4], [-.15, 1.015, -.43], [0, 1.25, -.65]];
  if (mobile) targets[3] = [-.03, 1.02, -.42];
  if (tablet) positions[3] = [.38, 1.62, .82];
  const labels = ['VISÃO GERAL', 'APROXIMAÇÃO', 'ENTRADA', 'ESTAÇÃO DE TRABALHO', 'REVELAÇÃO'];
  return positions.map((p, i) => ({ id: `scene-${i + 1}`, label: labels[i],
    scrollRange: [i === 0 ? 0 : STAGE_PROGRESS[i] - .12, i === 4 ? 1 : STAGE_PROGRESS[i + 1] - .12],
    position: [p[0], p[1], p[2] + (tablet && i !== 3 ? .55 : 0)], target: targets[i], fov: mobile ? (i === 3 ? 60 : 54) : (i === 3 ? tablet ? 50 : 44 : 48),
  }));
}
export function createCameraPath(profile: ViewportProfile) {
  const waypoints = getCameraWaypoints(profile);
  const position = new THREE.CatmullRomCurve3(waypoints.map(w => new THREE.Vector3(...w.position)), false, 'centripetal');
  const target = new THREE.CatmullRomCurve3(waypoints.map(w => new THREE.Vector3(...w.target)), false, 'centripetal');
  return { waypoints, position, target };
}
export function sampleCamera(path: ReturnType<typeof createCameraPath>, progress: number, position: THREE.Vector3, target: THREE.Vector3) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  let i = 0; while (i < 3 && p > STAGE_PROGRESS[i + 1]) i++;
  const local = THREE.MathUtils.smoothstep((p - STAGE_PROGRESS[i]) / (STAGE_PROGRESS[i + 1] - STAGE_PROGRESS[i]), 0, 1);
  const t = (i + local) / 4;
  path.position.getPoint(t, position); path.target.getPoint(t, target);
  return THREE.MathUtils.lerp(path.waypoints[i].fov, path.waypoints[i + 1].fov, local);
}
