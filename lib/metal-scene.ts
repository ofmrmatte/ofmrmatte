import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type MetalCamera = {
  eyeX: number; eyeY: number; eyeZ: number;
  lookX: number; lookY: number; lookZ: number;
  roll: number; light: number;
};

/** A closed, softly bevelled metal strip swept along an authored spatial curve. */
function sculptedRibbon(points: number[][], breadth: number, twist: number) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, "centripetal");
  const lengthSegments = 240, radialSegments = 40;
  const frames = curve.computeFrenetFrames(lengthSegments, false);
  const positions: number[] = [], indices: number[] = [];
  const side = new THREE.Vector3(), normal = new THREE.Vector3();
  for (let i = 0; i <= lengthSegments; i++) {
    const t = i / lengthSegments;
    const center = curve.getPointAt(t);
    const rotation = twist + Math.sin(t * Math.PI * 1.5) * .65 + t * .85;
    side.copy(frames.normals[i]).multiplyScalar(Math.cos(rotation)).addScaledVector(frames.binormals[i], Math.sin(rotation));
    normal.copy(frames.binormals[i]).multiplyScalar(Math.cos(rotation)).addScaledVector(frames.normals[i], -Math.sin(rotation));
    const halfWidth = breadth * (.76 + Math.sin(t * Math.PI) * .24);
    for (let j = 0; j < radialSegments; j++) {
      const angle = j / radialSegments * Math.PI * 2;
      const ca = Math.cos(angle), sa = Math.sin(angle);
      // A superellipse section gives a broad face, shallow crown and rounded edges.
      const u = Math.sign(ca) * Math.pow(Math.abs(ca), .24) * halfWidth;
      const v = Math.sign(sa) * Math.pow(Math.abs(sa), .72) * .095;
      const vertex = center.clone().addScaledVector(side, u).addScaledVector(normal, v);
      positions.push(vertex.x, vertex.y, vertex.z);
      if (i < lengthSegments) {
        const a = i * radialSegments + j;
        const b = (i + 1) * radialSegments + j;
        const c = (i + 1) * radialSegments + (j + 1) % radialSegments;
        const d = i * radialSegments + (j + 1) % radialSegments;
        indices.push(a,b,c,a,c,d);
      }
    }
  }
  // End caps are outside most compositions but remain finished during camera moves.
  for (const end of [0, lengthSegments]) {
    const center = curve.getPointAt(end / lengthSegments);
    const id = positions.length / 3;
    positions.push(center.x, center.y, center.z);
    for (let j=0;j<radialSegments;j++) {
      const a=end*radialSegments+j, b=end*radialSegments+(j+1)%radialSegments;
      if(end===0)indices.push(id,b,a);else indices.push(id,a,b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createMetalScene(canvas: HTMLCanvasElement, controls: MetalCamera) {
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
  renderer.setClearColor(0x08090b,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(37,1,.1,90);
  const sculpture=new THREE.Group();
  scene.add(sculpture);

  const room=new RoomEnvironment();
  const generator=new THREE.PMREMGenerator(renderer);
  const environment=generator.fromScene(room,.035);
  scene.environment=environment.texture;
  scene.environmentIntensity=1.25;
  room.dispose();generator.dispose();

  const silver=new THREE.MeshPhysicalMaterial({color:0xc5ccd7,metalness:1,roughness:.27,clearcoat:.16,clearcoatRoughness:.3});
  const titanium=new THREE.MeshPhysicalMaterial({color:0x5f6c7e,metalness:1,roughness:.34,clearcoat:.12,clearcoatRoughness:.35});
  const mainGeometry=sculptedRibbon([
    [-1.4,-9,0],[-2.1,-5.8,.8],[.3,-2.8,1.7],
    [1.35,.1,.25],[-.7,3.15,-.95],[-2,6.2,-.1],[-.8,9,1.1]
  ],1.62,-.25);
  const rearGeometry=sculptedRibbon([
    [1.1,-9,-2.5],[2.8,-5.8,-2],[1,-2.2,-3.1],
    [.8,1.6,-2.65],[3,5.1,-1.6],[2,9,-2.3]
  ],1.12,1.4);
  sculpture.add(new THREE.Mesh(mainGeometry,silver),new THREE.Mesh(rearGeometry,titanium));

  // Local studio lights add a readable rim; PMREM supplies smooth metal reflections.
  const key=new THREE.DirectionalLight(0xe4ebff,3.3);key.position.set(-4,6,8);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffffff,4);rim.position.set(5,1,-3);scene.add(rim);
  const fill=new THREE.DirectionalLight(0x9aabc9,1.1);fill.position.set(-3,-4,4);scene.add(fill);
  const target=new THREE.Vector3();
  let w=1,h=1;
  const draw=(px=0,py=0)=>{
    camera.position.set(controls.eyeX+px*.48,controls.eyeY-py*.24,controls.eyeZ);
    target.set(controls.lookX+px*.06,controls.lookY,controls.lookZ);
    camera.up.set(0,1,0);
    camera.lookAt(target);
    camera.rotateZ(controls.roll);
    // Light moves gently with the camera chapter, revealing curved surfaces.
    key.position.x=-4+controls.light;
    scene.environmentRotation.set(0,controls.light*.12,0);
    renderer.render(scene,camera);
  };
  const resize=(width:number,height:number)=>{
    w=width;h=height;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,width<768?1.25:1.5));
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    // Shift the composition right while preserving a real perspective frustum.
    camera.setViewOffset(w,h,-w*(w<768?.26:.245),0,w,h);
    camera.updateProjectionMatrix();
    draw();
  };
  const lost=(event:Event)=>{event.preventDefault();canvas.dataset.ready="false";};
  const restored=()=>{resize(w,h);canvas.dataset.ready="true";};
  canvas.addEventListener("webglcontextlost",lost);
  canvas.addEventListener("webglcontextrestored",restored);
  return {draw,resize,dispose:()=>{
    canvas.removeEventListener("webglcontextlost",lost);canvas.removeEventListener("webglcontextrestored",restored);
    mainGeometry.dispose();rearGeometry.dispose();silver.dispose();titanium.dispose();environment.dispose();renderer.dispose();renderer.forceContextLoss();
  }};
}
