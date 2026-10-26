import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createOfficeModel } from "./office-model";

export type OfficeCamera = {
  eyeX: number; eyeY: number; eyeZ: number;
  lookX: number; lookY: number; lookZ: number;
  chapter: number;
};

export function createOfficeScene(canvas: HTMLCanvasElement, controls: OfficeCamera) {
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
  const renderer = context ? new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: "low-power" }) : null;
  const model = createOfficeModel(!renderer);
  const scene = new THREE.Scene(); scene.add(model.root);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 70);
  const target = new THREE.Vector3();
  let environment: THREE.WebGLRenderTarget | undefined;
  let w = 1, h = 1, narrow = false, stopped = false;
  canvas.dataset.renderer = renderer ? "webgl" : "software";
  if (renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x08090b, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const room = new RoomEnvironment(), generator = new THREE.PMREMGenerator(renderer);
    environment = generator.fromScene(room, .04); scene.environment = environment.texture; scene.environmentIntensity = .48;
    generator.dispose(); room.dispose();
  }
  scene.add(new THREE.HemisphereLight(0xd7e6ff, 0x4c3c31, 1.25));
  const key = new THREE.DirectionalLight(0xe3ecff, 3.6); key.position.set(1, 7, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6; key.shadow.normalBias = .025; key.shadow.bias = -.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9ac, 1.2); rim.position.set(-4, 3, 1); scene.add(rim);
  const software = renderer ? null : createSoftwareRenderer(canvas, model.root, model.dna);
  const draw = (seconds = 0, px = 0, py = 0, still = false) => {
    if (stopped) return;
    model.update(seconds, Math.round(controls.chapter), still);
    camera.position.set(controls.eyeX + px * .2, controls.eyeY - py * .13, controls.eyeZ);
    target.set(controls.lookX, controls.lookY, controls.lookZ); camera.lookAt(target); camera.updateMatrixWorld();
    if (renderer) renderer.render(scene, camera); else software?.draw(camera);
    // Observable canvas state helps verify motion without reading renderer internals.
    canvas.dataset.camera = [controls.eyeX, controls.eyeY, controls.eyeZ].map(value => value.toFixed(2)).join(",");
    canvas.dataset.chapter = String(Math.round(controls.chapter));
    canvas.dataset.frame = String(Math.floor(seconds * 6));
  };
  const resize = (width: number, height: number) => {
    w = Math.max(1, width); h = Math.max(1, height); narrow = w < 901;
    camera.aspect = w / h;
    // Frame the room on the right desktop column, below the copy on small screens.
    camera.setViewOffset(w, h, -w * (narrow ? 0 : .255), 0, w, h);
    camera.updateProjectionMatrix();
    if (renderer) { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.15 : 1.5)); renderer.setSize(w, h, false); }
    else software?.resize(w, h);
  };
  const lost = (event: Event) => { event.preventDefault(); stopped = true; canvas.dataset.ready = "false"; };
  const restored = () => { stopped = false; resize(w, h); canvas.dataset.ready = "true"; };
  canvas.addEventListener("webglcontextlost", lost); canvas.addEventListener("webglcontextrestored", restored);
  return {
    draw, resize, fps: renderer ? 32 : 10,
    dispose() {
      stopped = true; canvas.removeEventListener("webglcontextlost", lost); canvas.removeEventListener("webglcontextrestored", restored);
      software?.dispose(); model.dispose(); environment?.dispose(); renderer?.dispose(); renderer?.forceContextLoss();
    },
  };
}

type Vertex = { point: THREE.Vector3; uv: THREE.Vector2 };
type Face = { vertices: [Vertex, Vertex, Vertex]; normal: THREE.Vector3; center: THREE.Vector3; material: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial };

/** Projects the same 3D model when WebGL is disabled; screens remain animated. */
function createSoftwareRenderer(canvas: HTMLCanvasElement, root: THREE.Group, moving: THREE.Group) {
  const ctx = canvas.getContext("2d", { alpha: true })!;
  const staticFaces: Face[] = [], movingMeshes: THREE.Mesh[] = [];
  const transform = new THREE.Matrix4(), instance = new THREE.Matrix4(), normalMatrix = new THREE.Matrix3();
  const gather = (mesh: THREE.Mesh, output: Face[], matrix: THREE.Matrix4) => {
    const geometry = mesh.geometry, position = geometry.getAttribute("position"), uv = geometry.getAttribute("uv"), normals = geometry.getAttribute("normal"), indices = geometry.index;
    const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as Face["material"];
    if (material.transparent) return;
    normalMatrix.getNormalMatrix(matrix);
    const count = indices ? indices.count : position.count;
    for (let i = 0; i < count; i += 3) {
      const vertices: Vertex[] = []; const normal = new THREE.Vector3();
      for (let j = 0; j < 3; j++) {
        const id = indices ? indices.getX(i + j) : i + j;
        vertices.push({ point: new THREE.Vector3().fromBufferAttribute(position, id).applyMatrix4(matrix), uv: uv ? new THREE.Vector2(uv.getX(id), uv.getY(id)) : new THREE.Vector2() });
        if (normals) normal.add(new THREE.Vector3().fromBufferAttribute(normals, id));
      }
      normal.applyMatrix3(normalMatrix).normalize();
      const center = vertices[0].point.clone().add(vertices[1].point).add(vertices[2].point).multiplyScalar(1 / 3);
      output.push({ vertices: vertices as Face["vertices"], normal, center, material });
    }
  };
  root.updateMatrixWorld(true);
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    let ancestor: THREE.Object3D | null = object;
    while (ancestor && ancestor !== moving) ancestor = ancestor.parent;
    if (ancestor === moving) { movingMeshes.push(object); return; }
    if (object instanceof THREE.InstancedMesh) {
      for (let i = 0; i < object.count; i++) { object.getMatrixAt(i, instance); transform.multiplyMatrices(object.matrixWorld, instance); gather(object, staticFaces, transform); }
    } else gather(object, staticFaces, object.matrixWorld);
  });
  const keyDirection = new THREE.Vector3(.3, .9, .8).normalize(), rimDirection = new THREE.Vector3(-.8, .4, .3).normalize();
  const viewDirection = new THREE.Vector3(), reflected = new THREE.Vector3(), color = new THREE.Color();
  let w = 1, h = 1, dpr = 1;
  function texturedTriangle(image: CanvasImageSource, face: Face, points: THREE.Vector3[]) {
    const source = image as HTMLCanvasElement;
    const uv = face.vertices.map(vertex => ({ x: vertex.uv.x * source.width, y: (1 - vertex.uv.y) * source.height }));
    const [a, b, c] = uv, [p, q, r] = points;
    const det = a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y);
    if (Math.abs(det) < .001) return false;
    const ax = (p.x * (b.y - c.y) + q.x * (c.y - a.y) + r.x * (a.y - b.y)) / det;
    const bx = (p.x * (c.x - b.x) + q.x * (a.x - c.x) + r.x * (b.x - a.x)) / det;
    const cx = (p.x * (b.x * c.y - c.x * b.y) + q.x * (c.x * a.y - a.x * c.y) + r.x * (a.x * b.y - b.x * a.y)) / det;
    const ay = (p.y * (b.y - c.y) + q.y * (c.y - a.y) + r.y * (a.y - b.y)) / det;
    const by = (p.y * (c.x - b.x) + q.y * (a.x - c.x) + r.y * (b.x - a.x)) / det;
    const cy = (p.y * (b.x * c.y - c.x * b.y) + q.y * (c.x * a.y - a.x * c.y) + r.y * (a.x * b.y - b.x * a.y)) / det;
    ctx.save(); ctx.clip(); ctx.transform(ax, ay, bx, by, cx, cy); ctx.drawImage(image, 0, 0); ctx.restore(); return true;
  }
  return {
    resize(width: number, height: number) { w = width; h = height; dpr = Math.min(window.devicePixelRatio || 1, 1.15); canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); },
    draw(camera: THREE.PerspectiveCamera) {
      moving.updateMatrixWorld(true);
      const movingFaces: Face[] = []; movingMeshes.forEach(mesh => gather(mesh, movingFaces, mesh.matrixWorld));
      const projected: { face: Face; points: THREE.Vector3[]; depth: number }[] = [];
      for (const face of [...staticFaces, ...movingFaces]) {
        viewDirection.subVectors(camera.position, face.center);
        if (face.normal.dot(viewDirection) < 0 && face.material.side !== THREE.DoubleSide) continue;
        const points = face.vertices.map(vertex => vertex.point.clone().project(camera));
        if (points.some(point => point.z < -1 || point.z > 1)) continue;
        if (points.every(point => point.x < -1) || points.every(point => point.x > 1) || points.every(point => point.y < -1) || points.every(point => point.y > 1)) continue;
        const depth = (points[0].z + points[1].z + points[2].z) / 3;
        points.forEach(point => { point.x = (point.x + 1) * w / 2; point.y = (1 - point.y) * h / 2; });
        projected.push({ face, points, depth });
      }
      projected.sort((a, b) => b.depth - a.depth);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      for (const { face, points } of projected) {
        const [p, q, r] = points; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.lineTo(r.x, r.y); ctx.closePath();
        const image = face.material.map?.image as HTMLCanvasElement | undefined;
        if (image && (image.width >= 768 || image.width === 128) && texturedTriangle(image, face, points)) continue;
        const intensity = .27 + Math.max(0, face.normal.dot(keyDirection)) * .67 + Math.max(0, face.normal.dot(rimDirection)) * .18;
        const isBasic = face.material instanceof THREE.MeshBasicMaterial;
        color.copy(face.material.color).multiplyScalar(isBasic ? 1 : intensity);
        if (!isBasic && face.material instanceof THREE.MeshStandardMaterial && face.material.metalness > .4) {
          viewDirection.subVectors(camera.position, face.center).normalize(); reflected.copy(keyDirection).reflect(face.normal).negate();
          const specular = Math.pow(Math.max(0, reflected.dot(viewDirection)), 24) * .22; color.addScalar(specular);
        }
        const style = color.getStyle(THREE.SRGBColorSpace); ctx.fillStyle = style; ctx.strokeStyle = style; ctx.lineWidth = .45; ctx.fill(); ctx.stroke();
      }
      canvas.dataset.faces = String(projected.length);
    },
    dispose() { staticFaces.length = 0; movingMeshes.length = 0; },
  };
}
