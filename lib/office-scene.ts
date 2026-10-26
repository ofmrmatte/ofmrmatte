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
  let w = 1, h = 1;
  let pixels: ImageData, depthBuffer: Float32Array;
  const textureCache = new Map<THREE.Texture, {version:number; width:number; height:number; data:Uint8ClampedArray}>();
  const getTexture = (texture: THREE.Texture | null) => {
    if (!texture) return;
    const cached=textureCache.get(texture);
    if(cached?.version===texture.version)return cached;
    const source=texture.image as HTMLCanvasElement;
    if(!source?.getContext)return;
    const context=source.getContext("2d");
    if(!context)return;
    const entry={version:texture.version,width:source.width,height:source.height,data:context.getImageData(0,0,source.width,source.height).data};
    textureCache.set(texture,entry);return entry;
  };
  return {
    resize(width: number, height: number) {
      const scale=Math.min(.7,800/width,600/height);
      w=Math.max(1,Math.round(width*scale));h=Math.max(1,Math.round(height*scale));
      canvas.width=w;canvas.height=h;pixels=ctx.createImageData(w,h);depthBuffer=new Float32Array(w*h);
    },
    draw(camera: THREE.PerspectiveCamera) {
      moving.updateMatrixWorld(true);
      const movingFaces: Face[] = []; movingMeshes.forEach(mesh => gather(mesh, movingFaces, mesh.matrixWorld));
      const projected: { face: Face; points: THREE.Vector3[]; inverseW: number[]; depth: number }[] = [];
      for (const face of [...staticFaces, ...movingFaces]) {
        viewDirection.subVectors(camera.position, face.center);
        if (face.normal.dot(viewDirection) < 0 && face.material.side !== THREE.DoubleSide) continue;
        const points = face.vertices.map(vertex => vertex.point.clone().project(camera));
        if (points.some(point => point.z < -1 || point.z > 1)) continue;
        if (points.every(point => point.x < -1) || points.every(point => point.x > 1) || points.every(point => point.y < -1) || points.every(point => point.y > 1)) continue;
        const depth = (points[0].z + points[1].z + points[2].z) / 3;
        const inverseW=face.vertices.map(vertex=>-1/vertex.point.clone().applyMatrix4(camera.matrixWorldInverse).z);
        points.forEach(point => { point.x = (point.x + 1) * w / 2; point.y = (1 - point.y) * h / 2; });
        projected.push({ face, points, inverseW, depth });
      }
      // A real depth buffer prevents walls, floor boards and desktops crossing one another.
      projected.sort((a, b) => a.depth - b.depth);
      depthBuffer.fill(Infinity);pixels.data.fill(0);
      for (const { face, points, inverseW } of projected) {
        const [p,q,r]=points;
        const denominator=(q.y-r.y)*(p.x-r.x)+(r.x-q.x)*(p.y-r.y);
        if(Math.abs(denominator)<.01)continue;
        const minX=Math.max(0,Math.floor(Math.min(p.x,q.x,r.x))),maxX=Math.min(w-1,Math.ceil(Math.max(p.x,q.x,r.x)));
        const minY=Math.max(0,Math.floor(Math.min(p.y,q.y,r.y))),maxY=Math.min(h-1,Math.ceil(Math.max(p.y,q.y,r.y)));
        const intensity=.27+Math.max(0,face.normal.dot(keyDirection))*.67+Math.max(0,face.normal.dot(rimDirection))*.18;
        const isBasic=face.material instanceof THREE.MeshBasicMaterial;
        color.copy(face.material.color).multiplyScalar(isBasic?1:intensity);
        if(!isBasic&&face.material instanceof THREE.MeshStandardMaterial&&face.material.metalness>.4){
          viewDirection.subVectors(camera.position,face.center).normalize();reflected.copy(keyDirection).reflect(face.normal).negate();
          color.addScalar(Math.pow(Math.max(0,reflected.dot(viewDirection)),24)*.22);
        }
        color.convertLinearToSRGB();
        const red=Math.min(1,color.r),green=Math.min(1,color.g),blue=Math.min(1,color.b);
        const texture=getTexture(face.material.map),map=face.material.map;
        const uv=face.vertices.map((vertex,i)=>({u:vertex.uv.x*inverseW[i],v:vertex.uv.y*inverseW[i]}));
        for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
          const a=((q.y-r.y)*(x+.5-r.x)+(r.x-q.x)*(y+.5-r.y))/denominator;
          const b=((r.y-p.y)*(x+.5-r.x)+(p.x-r.x)*(y+.5-r.y))/denominator;
          const c=1-a-b;
          if(a<-.0001||b<-.0001||c<-.0001)continue;
          const depth=a*p.z+b*q.z+c*r.z,index=y*w+x;
          if(depth>=depthBuffer[index])continue;
          depthBuffer[index]=depth;
          const offset=index*4;
          if(texture&&map){
            const divisor=a*inverseW[0]+b*inverseW[1]+c*inverseW[2];
            let u=(a*uv[0].u+b*uv[1].u+c*uv[2].u)/divisor*map.repeat.x+map.offset.x;
            let v=(a*uv[0].v+b*uv[1].v+c*uv[2].v)/divisor*map.repeat.y+map.offset.y;
            u=map.wrapS===THREE.RepeatWrapping?u-Math.floor(u):Math.min(1,Math.max(0,u));
            v=map.wrapT===THREE.RepeatWrapping?v-Math.floor(v):Math.min(1,Math.max(0,v));
            const tx=Math.min(texture.width-1,Math.floor(u*texture.width)),ty=Math.min(texture.height-1,Math.floor((1-v)*texture.height));
            const source=(ty*texture.width+tx)*4;
            pixels.data[offset]=texture.data[source]*red;pixels.data[offset+1]=texture.data[source+1]*green;pixels.data[offset+2]=texture.data[source+2]*blue;
          }else{pixels.data[offset]=red*255;pixels.data[offset+1]=green*255;pixels.data[offset+2]=blue*255;}
          pixels.data[offset+3]=255;
        }
      }
      ctx.putImageData(pixels,0,0);canvas.dataset.faces=String(projected.length);
    },
    dispose() { staticFaces.length=0;movingMeshes.length=0;textureCache.clear(); },
  };
}
