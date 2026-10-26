import * as THREE from 'three';

// Only independent furniture is compared. Books on shelves, armrests on frames,
// floor/rug and other intentional support contacts are excluded explicitly.
export function validateSceneBounds(scene: THREE.Scene) {
  const names = ['WorkstationDesk', 'ErgonomicChair', 'Bookshelf', 'MainPlant'];
  const boxes = names.map(name => {
    const object = scene.getObjectByName(name);
    return { name, box: object ? new THREE.Box3().setFromObject(object, true) : new THREE.Box3() };
  });
  const overlaps: string[] = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.box.isEmpty() || b.box.isEmpty()) continue;
    const intersection = a.box.clone().intersect(b.box), size = intersection.getSize(new THREE.Vector3());
    if (size.x > .008 && size.y > .008 && size.z > .008) overlaps.push(`${a.name} / ${b.name}`);
  }
  return { overlaps, objects: boxes.map(({ name, box }) => ({ name, min: box.min.toArray(), max: box.max.toArray() })) };
}
