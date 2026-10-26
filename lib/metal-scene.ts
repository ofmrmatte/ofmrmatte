import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type MetalCamera = {
  eyeX: number; eyeY: number; eyeZ: number;
  lookX: number; lookY: number; lookZ: number;
  roll: number; light: number; spin: number;
};

export const HELIX = {height:20,radius:2.15,turns:1.18,halfWidth:.64,halfThickness:.09};

/** Two opposite phases share one exact helix: separation is geometric, not visual. */
export function createHelixGeometry(phase:number,lengthSegments=240,radialSegments=40) {
  const positions:number[]=[],indices:number[]=[];
  const omega=Math.PI*2*HELIX.turns;
  const normal=new THREE.Vector3(),tangent=new THREE.Vector3(),side=new THREE.Vector3();
  for(let i=0;i<=lengthSegments;i++){
    const t=i/lengthSegments,theta=(t-.5)*omega+phase;
    const center=new THREE.Vector3(HELIX.radius*Math.cos(theta),(t-.5)*HELIX.height,HELIX.radius*Math.sin(theta));
    normal.set(Math.cos(theta),0,Math.sin(theta));
    tangent.set(-HELIX.radius*omega*Math.sin(theta),HELIX.height,HELIX.radius*omega*Math.cos(theta)).normalize();
    side.crossVectors(normal,tangent).normalize();
    for(let j=0;j<radialSegments;j++){
      const angle=j/radialSegments*Math.PI*2,ca=Math.cos(angle),sa=Math.sin(angle);
      const u=Math.sign(ca)*Math.pow(Math.abs(ca),.24)*HELIX.halfWidth;
      const v=Math.sign(sa)*Math.pow(Math.abs(sa),.72)*HELIX.halfThickness;
      const vertex=center.clone().addScaledVector(side,u).addScaledVector(normal,v);
      positions.push(vertex.x,vertex.y,vertex.z);
      if(i<lengthSegments){
        const a=i*radialSegments+j,b=(i+1)*radialSegments+j,c=(i+1)*radialSegments+(j+1)%radialSegments,d=i*radialSegments+(j+1)%radialSegments;
        indices.push(a,c,b,a,d,c);
      }
    }
  }
  for(const end of [0,lengthSegments]){
    const t=end/lengthSegments,theta=(t-.5)*omega+phase,id=positions.length/3;
    positions.push(HELIX.radius*Math.cos(theta),(t-.5)*HELIX.height,HELIX.radius*Math.sin(theta));
    for(let j=0;j<radialSegments;j++){
      const a=end*radialSegments+j,b=end*radialSegments+(j+1)%radialSegments;
      if(end===0)indices.push(id,b,a);else indices.push(id,a,b);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
  return geometry;
}

export function createMetalScene(canvas: HTMLCanvasElement, controls: MetalCamera) {
  const context=canvas.getContext("webgl2",{alpha:true,antialias:true,powerPreference:"low-power"});
  if(!context)return createSoftwareMetalScene(canvas,controls);
  canvas.dataset.renderer="webgl";
  const renderer = new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:"low-power"});
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
  const titanium=new THREE.MeshPhysicalMaterial({color:0x9ca9bb,metalness:1,roughness:.34,clearcoat:.12,clearcoatRoughness:.35});
  const mainGeometry=createHelixGeometry(0);
  const rearGeometry=createHelixGeometry(Math.PI);
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
    sculpture.rotation.y=controls.spin;
    // A fixed studio light makes the common-axis rotation readable.
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
    camera.setViewOffset(w,h,-w*(w<768?.29:.30),0,w,h);
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


/** The same sculpted geometry, camera and lighting projected without a GPU. */
function createSoftwareMetalScene(canvas: HTMLCanvasElement, controls: MetalCamera) {
  const ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("No graphics context available");
  canvas.dataset.renderer="software";
  const steps=88,radial=12;
  const geometries=[createHelixGeometry(0,steps,radial),createHelixGeometry(Math.PI,steps,radial)];
  const meshes=geometries.map(geometry=>{
    const position=geometry.getAttribute("position"),normal=geometry.getAttribute("normal");
    return Array.from({length:(steps+1)*radial},(_,i)=>({p:new THREE.Vector3().fromBufferAttribute(position,i),n:new THREE.Vector3().fromBufferAttribute(normal,i)}));
  });
  const camera=new THREE.PerspectiveCamera(37,1,.1,90);
  let width=1,height=1;
  const target=new THREE.Vector3(),light=new THREE.Vector3(),view=new THREE.Vector3(),half=new THREE.Vector3(),projected=new THREE.Vector3(),worldPoint=new THREE.Vector3(),worldNormal=new THREE.Vector3();
  const rotation=new THREE.Matrix4();
  const draw=(px=0,py=0)=>{
    camera.position.set(controls.eyeX+px*.48,controls.eyeY-py*.24,controls.eyeZ);
    target.set(controls.lookX+px*.06,controls.lookY,controls.lookZ);
    camera.up.set(0,1,0);camera.lookAt(target);camera.rotateZ(controls.roll);camera.updateMatrixWorld();
    ctx.clearRect(0,0,width,height);
    rotation.makeRotationY(controls.spin);
    const faces:{p:{x:number;y:number;z:number;shade:number}[];depth:number}[]=[];
    meshes.forEach((vertices,meshIndex)=>{
      const points=vertices.map(({p,n})=>{
        worldPoint.copy(p).applyMatrix4(rotation);worldNormal.copy(n).transformDirection(rotation);
        projected.copy(worldPoint).project(camera);
        light.set(-4+controls.light,6,8).sub(worldPoint).normalize();view.copy(camera.position).sub(worldPoint).normalize();half.copy(light).add(view).normalize();
        const diffuse=Math.max(0,worldNormal.dot(light));
        const specular=Math.pow(Math.max(0,worldNormal.dot(half)),42);
        const fresnel=Math.pow(1-Math.abs(worldNormal.dot(view)),3);
        const shade=Math.min(248,(35+diffuse*98+specular*120+fresnel*60)*(meshIndex===0?1:.84));
        return {x:(projected.x*.5+.5)*width,y:(-.5*projected.y+.5)*height,z:projected.z,shade};
      });
      for(let i=0;i<steps;i++)for(let j=0;j<radial;j++){
        const a=i*radial+j,b=(i+1)*radial+j,c=(i+1)*radial+(j+1)%radial,d=i*radial+(j+1)%radial;
        const p=[points[a],points[b],points[c],points[d]];
        faces.push({p,depth:p.reduce((sum,item)=>sum+item.z,0)/4});
      }
    });
    faces.sort((a,b)=>b.depth-a.depth);
    const color=(s:number)=>`rgb(${Math.round(s*.91)},${Math.round(s*.95)},${Math.round(s)})`;
    for(const {p} of faces){
      ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(let i=1;i<4;i++)ctx.lineTo(p[i].x,p[i].y);ctx.closePath();
      const gradient=ctx.createLinearGradient(p[0].x,p[0].y,p[3].x,p[3].y);
      gradient.addColorStop(0,color((p[0].shade+p[1].shade)*.5));gradient.addColorStop(1,color((p[2].shade+p[3].shade)*.5));
      ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle=gradient;ctx.lineWidth=.6;ctx.stroke();
    }
  };
  const resize=(w:number,h:number)=>{
    width=w;height=h;const dpr=Math.min(window.devicePixelRatio||1,1.25);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    camera.aspect=w/h;camera.setViewOffset(w,h,-w*(w<768?.29:.30),0,w,h);camera.updateProjectionMatrix();draw();
  };
  return {draw,resize,dispose:()=>geometries.forEach(geometry=>geometry.dispose())};
}
