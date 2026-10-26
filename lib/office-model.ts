import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createHelixGeometry } from "./metal-scene";
import { createStudioScreen } from "./office-screens";

/** A self-contained, meter-scaled studio. No external model/CDN is required. */
export function createOfficeModel(simple = false) {
  const root = new THREE.Group();
  const textures = new Set<THREE.Texture>();
  const screens = [createStudioScreen("code"), createStudioScreen("preview"), createStudioScreen("terminal")];
  const materialCache = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (color: THREE.ColorRepresentation, roughness = .5, metalness = 0) => {
    const id = `${color}/${roughness}/${metalness}`;
    let material = materialCache.get(id);
    if (!material) { material = new THREE.MeshStandardMaterial({ color, roughness, metalness }); materialCache.set(id, material); }
    return material;
  };
  const graphite = mat(0x242a32, .34, .65), black = mat(0x0d1118, .43, .24);
  const metal = mat(0xa8b3c1, .26, .92), fabric = mat(0x303740, .93);
  const wall = mat(0x242932, .98), wood = mat(0x6e4d37, .6), paper = mat(0xc3c5be, .9);
  const softLight = new THREE.MeshBasicMaterial({ color: 0xc6d5eb });
  const warmLight = new THREE.MeshBasicMaterial({ color: 0xf2d8ae });
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#674b37"; ctx.fillRect(0, 0, 512, 512);
  let seed = 42;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 1800; i++) {
    const y = random() * 512, offset = random() * 20;
    ctx.strokeStyle = `rgba(${random() > .5 ? "190,151,111" : "29,18,11"},${random() * .17})`;
    ctx.lineWidth = random() * 2 + .4; ctx.beginPath(); ctx.moveTo(0, y);
    ctx.bezierCurveTo(160, y + offset, 370, y - offset, 512, y + Math.sin(i) * 3); ctx.stroke();
  }
  const grain = new THREE.CanvasTexture(canvas); grain.colorSpace = THREE.SRGBColorSpace;
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping; grain.repeat.set(2, 1); textures.add(grain); wood.map = grain;

  const box = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, radius = .025, parent: THREE.Object3D = root) => {
    const geometry = simple || radius === 0 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3));
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const cylinder = (r1: number, r2: number, height: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root, segments = 20) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, height, simple ? 8 : segments), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const tube = (points: number[][], radius: number, material: THREE.Material, parent: THREE.Object3D = root) => {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number, number, number])));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, simple ? 10 : 24, radius, simple ? 4 : 6, false), material); parent.add(mesh); return mesh;
  };
  const disc = (r: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root) => cylinder(r, r, .025, material, x, y, z, parent);
  const glow = (color: number, intensity: number, distance: number, x: number, y: number, z: number) => {
    const light = new THREE.PointLight(color, intensity, distance, 2); light.position.set(x, y, z); root.add(light); return light;
  };

  // Architectural shell, individual floor boards, window mullions and acoustic wall.
  box(9.3, .15, 7.2, mat(0x383735, .88), 0, -.12, -.25, .025);
  const floorWood = mat(0x625748, .81); floorWood.map = grain;
  for (let i = 0; i < 15; i++) box(.6, .025, 6.9, floorWood, -4.22 + i * .604, -.03, -.25, 0);
  box(9.3, 5.2, .15, wall, 0, 2.52, -3.76, 0);
  box(.15, 5.2, 7.2, mat(0x1b212a, .96), -4.65, 2.52, -.24, 0);
  box(9.15, .11, .06, graphite, 0, .08, -3.65, 0);
  for (let i = 0; i < 27; i++) box(.055, 3.2, .12, mat(i % 2 ? 0x3f352e : 0x514134, .85), -4.12 + i * .115, 2.26, -3.59, 0);
  const skyCanvas = document.createElement("canvas"); skyCanvas.width = 128; skyCanvas.height = 256;
  const skyCtx = skyCanvas.getContext("2d")!;
  const gradient = skyCtx.createLinearGradient(0, 0, 0, 256); gradient.addColorStop(0, "#283b5b"); gradient.addColorStop(.6, "#71849b"); gradient.addColorStop(1, "#b1a796"); skyCtx.fillStyle = gradient; skyCtx.fillRect(0, 0, 128, 256);
  const skyTexture = new THREE.CanvasTexture(skyCanvas); skyTexture.colorSpace = THREE.SRGBColorSpace; textures.add(skyTexture);
  const sky = new THREE.MeshBasicMaterial({ color: 0x889ab5, map: skyTexture });
  box(4.36, 3.22, .06, sky, 1.76, 2.83, -3.61, 0);
  // City silhouettes are deliberately understated, with a few lit windows.
  for (let i = 0; i < 13; i++) {
    const h = .35 + random() * 1.2, x = -.25 + i * .33;
    box(.29, h, .025, mat(0x344151, .95), x, 1.25 + h / 2, -3.55, 0);
    for (let row = 0; row < 5; row++) if (row * .16 < h - .15 && i % 3 === 0) box(.035, .045, .012, warmLight, x + .07, 1.42 + row * .16, -3.52, 0);
  }
  [-.46, 1.03, 2.51, 3.99].forEach(x => box(.065, 3.36, .13, black, x, 2.83, -3.48, 0));
  [1.15, 4.5].forEach(y => box(4.52, .065, .17, black, 1.77, y, -3.46, 0));
  box(4.55, .11, .34, graphite, 1.77, 1.12, -3.38);
  box(4.55, .025, .025, softLight, 1.77, 4.43, -3.34, 0);
  glow(0xb5d0ff, 6, 9, 1.8, 3.2, -2.8);

  // Walnut desktop: slim bevel, steel underframe, adjustable feet and cable tray.
  box(6.05, .16, 2.53, wood, 0, 1.49, -.04, .055);
  box(5.95, .035, 2.4, mat(0x241c18, .6), 0, 1.39, -.04);
  for (const x of [-2.52, 2.52]) {
    box(.12, 1.34, .13, graphite, x, .69, -.11);
    box(.45, .07, 2.01, graphite, x, .045, -.1);
    [-.91, .73].forEach(z => cylinder(.075, .075, .05, black, x, .012, z));
    box(.75, .08, 1.76, graphite, x, 1.34, -.1);
  }
  box(5, .13, .11, graphite, 0, 1.19, -.65);
  box(3.7, .15, .4, black, 0, 1.25, -.87);
  box(3.95, .018, 1.03, mat(0x19232b, .94), .12, 1.585, .43, .075);

  const makeScreen = (index: number, x: number, y: number, z: number, angle: number) => {
    const group = new THREE.Group(); group.position.set(x, y, z); group.rotation.y = angle; root.add(group);
    const w = index === 1 ? 1.68 : 2.23, h = index === 1 ? 1.24 : 1.36;
    box(w + .085, h + .085, .105, black, 0, 0, 0, .04, group);
    box(w + .04, h + .04, .02, graphite, 0, 0, .061, .02, group);
    const display = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: screens[index].texture, toneMapped: false, color: 0xc4d3e8 }));
    display.position.set(0, 0, .076); group.add(display);
    box(.04, .018, .01, softLight, w / 2 - .12, -h / 2 - .015, .079, .002, group);
    cylinder(.05, .05, .51, graphite, x, 1.87, z - .05);
    box(.65, .045, .43, graphite, x, 1.61, z + .02, .035);
    tube([[x, 2.2, z - .08], [x + .2, 1.8, z - .21], [x + .25, 1.46, -.9]], .018, black);
    return group;
  };
  makeScreen(0, -.7, 2.55, -.65, .07);
  makeScreen(1, 1.43, 2.48, -.61, -.23);
  box(.13, .04, .07, graphite, -.7, 3.29, -.63, .015);
  cylinder(.025, .025, .022, black, -.7, 3.29, -.58).rotation.x = Math.PI / 2;

  // Laptop with hinge, individually modeled keys, trackpad and side ports.
  const laptop = new THREE.Group(); laptop.position.set(-1.83, 1.61, .65); laptop.rotation.y = .15; root.add(laptop);
  box(1.36, .065, .91, metal, 0, 0, 0, .038, laptop);
  box(1.25, .014, .53, black, 0, .039, -.1, .025, laptop);
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(.075, .016, .06), mat(0x252b34, .5), 60);
  const keyMatrix = new THREE.Matrix4();
  let key = 0;
  for (let row = 0; row < 5; row++) for (let col = 0; col < 12; col++) { keyMatrix.makeTranslation(-.51 + col * .091, .052, -.3 + row * .084); keys.setMatrixAt(key++, keyMatrix); }
  keys.castShadow = true; laptop.add(keys);
  box(.42, .006, .22, mat(0x8d99a8, .38, .82), 0, .037, .28, .018, laptop);
  for (let i = 0; i < 3; i++) box(.012, .02, .09, black, -.684, -.005, -.2 + i * .18, .003, laptop);
  const lid = new THREE.Group(); lid.position.set(0, .05, -.43); lid.rotation.x = -.18; laptop.add(lid);
  box(1.36, .86, .045, metal, 0, .43, 0, .028, lid);
  box(1.28, .78, .012, black, 0, .43, .026, .015, lid);
  const laptopDisplay = new THREE.Mesh(new THREE.PlaneGeometry(1.21, .72), new THREE.MeshBasicMaterial({ map: screens[2].texture, toneMapped: false, color: 0xd6dfec })); laptopDisplay.position.set(0, .43, .034); lid.add(laptopDisplay);
  cylinder(.013, .013, 1.2, graphite, 0, .05, -.43, laptop).rotation.z = Math.PI / 2;

  // External keyboard, mouse, desk accessories and fabric details.
  box(1.62, .065, .55, mat(0x7c8794, .4, .72), .45, 1.64, .61, .04);
  const desktopKeys = new THREE.InstancedMesh(new THREE.BoxGeometry(.075, .027, .065), mat(0x272e39, .52), 75);
  key = 0;
  for (let row = 0; row < 5; row++) for (let col = 0; col < 15; col++) { keyMatrix.makeTranslation(-.27 + col * .102, 1.69, .4 + row * .09); desktopKeys.setMatrixAt(key++, keyMatrix); }
  root.add(desktopKeys); box(.5, .027, .065, graphite, .46, 1.69, .81, .008);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(1, simple ? 8 : 20, simple ? 6 : 14), graphite); mouse.scale.set(.15, .065, .235); mouse.position.set(1.67, 1.65, .63); root.add(mouse);
  box(.017, .012, .09, black, 1.67, 1.715, .55, .004);
  // Ceramic mug with visible coffee and a separate handle.
  const ceramic = mat(0x9da4a9, .3);
  cylinder(.137, .11, .3, ceramic, 2.37, 1.72, .68); disc(.119, mat(0x21150e, .22), 2.37, 1.874, .68);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.105, .028, simple ? 5 : 10, simple ? 10 : 24), ceramic); handle.position.set(2.53, 1.73, .68); root.add(handle);
  box(.54, .045, .7, mat(0x8d8475, .85), -2.45, 1.6, -.53); box(.48, .023, .63, paper, -2.45, 1.63, -.53);
  cylinder(.014, .014, .6, metal, -2.36, 1.66, -.5).rotation.x = Math.PI / 2;
  tube([[1.8, 1.6, -.9], [2.55, 1.54, -.8], [2.8, 1.1, -.9], [2.7, .1, -1.15]], .017, black);

  // Workstation tower under the desk, with glass, vents and three cooling fans.
  box(.68, 1.13, 1.11, black, 1.88, .62, -.43, .05);
  box(.015, .96, .94, mat(0x30404d, .19, .55), 2.23, .62, -.43, .012);
  for (let i = 0; i < 3; i++) {
    const fan = new THREE.Mesh(new THREE.TorusGeometry(.12, .013, 6, simple ? 12 : 24), mat(0xa3bbd0, .35, .5)); fan.position.set(1.88, .28 + i * .32, .135); root.add(fan);
    cylinder(.085, .085, .018, graphite, 1.88, .28 + i * .32, .137).rotation.x = Math.PI / 2;
    for (let j = 0; j < 5; j++) { const blade = box(.12, .035, .012, mat(0x4f667c, .5), 1.88, .28 + i * .32, .15, 0); blade.rotation.z = j / 5 * Math.PI * 2; }
  }
  for (let i = 0; i < 7; i++) box(.012, .02, .64, graphite, 2.245, .27 + i * .1, -.43, 0);

  // Ergonomic chair: five-star base, casters, mesh back, lumbar bar and arms.
  const chair = new THREE.Group(); chair.position.set(-2.38, 0, 1.9); chair.rotation.y = -.37; root.add(chair);
  cylinder(.058, .08, .7, metal, 0, .43, 0, chair);
  for (let i = 0; i < 5; i++) {
    const angle = i / 5 * Math.PI * 2;
    const leg = box(.76, .055, .07, graphite, Math.cos(angle) * .32, .12, Math.sin(angle) * .32, .02, chair); leg.rotation.y = -angle;
    const wheel = cylinder(.08, .08, .065, black, Math.cos(angle) * .67, .075, Math.sin(angle) * .67, chair); wheel.rotation.z = Math.PI / 2;
  }
  box(.96, .17, .9, fabric, 0, .91, 0, .075, chair);
  box(.87, .98, .11, graphite, 0, 1.56, .4, .075, chair);
  box(.77, .86, .04, fabric, 0, 1.56, .325, .06, chair);
  for (let i = 0; i < (simple ? 9 : 23); i++) box(.76, .009, .012, black, 0, 1.18 + i * (simple ? .087 : .034), .296, 0, chair);
  box(.66, .11, .14, black, 0, 1.21, .29, .04, chair);
  for (const x of [-.61, .61]) { box(.055, .43, .06, graphite, x, 1.08, .17, .02, chair); box(.18, .065, .53, black, x, 1.31, .07, .025, chair); }
  box(.54, .23, .13, fabric, 0, 2.2, .44, .06, chair);

  // Bookcase, storage fronts, books, wall artwork and a living plant.
  box(1.2, 2.5, .55, graphite, -3.65, 1.25, -2.73);
  for (let i = 0; i < 4; i++) box(1.14, .055, .63, wood, -3.65, .25 + i * .7, -2.71);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
    const book = box(.105 + random() * .04, .32 + random() * .17, .34, mat([0x6b6d67, 0x535d69, 0x8b7966, 0xa3a098][i % 4], .9), -4.1 + i * .15, .49 + row * .7, -2.63, .005);
    if (i === 5) book.rotation.z = -.11;
  }
  box(1.14, .43, .6, mat(0x353b43, .75), -3.65, .28, -2.71); box(.24, .035, .025, metal, -3.65, .35, -2.397);
  const pot = mat(0x747b7b, .91), green = mat(0x3f594e, .85);
  cylinder(.3, .21, .64, pot, 3.42, .34, -2.44);
  for (let i = 0; i < 11; i++) {
    const angle = i * 2.4, h = 1.08 + random() * .75;
    const x = 3.42 + Math.sin(angle) * .38, z = -2.44 + Math.cos(angle) * .34;
    tube([[3.42, .56, -2.44], [3.42, 1.03, -2.44], [x, h, z]], .013, green);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, simple ? 6 : 12, simple ? 4 : 8), green); leaf.scale.set(.115, .32, .025); leaf.position.set(x, h, z); leaf.rotation.set(.4, angle, -.5 + i * .07); root.add(leaf);
  }
  // Desk lamp, with a warm pool of light on the walnut surface.
  disc(.25, graphite, 2.47, 1.59, -.82);
  tube([[2.47, 1.62, -.82], [2.47, 2.5, -.82], [2.04, 2.78, -.6]], .028, metal);
  const shade = cylinder(.2, .28, .19, graphite, 2.04, 2.74, -.6); shade.rotation.z = -.25;
  disc(.21, warmLight, 2.04, 2.64, -.6); glow(0xffdbab, 3.3, 4, 2.04, 2.57, -.6);
  // Silver DNA on a small pedestal: both strands rotate together, never overlap.
  cylinder(.23, .25, .045, graphite, -2.56, 1.59, -.93);
  const dna = new THREE.Group(); dna.position.set(-2.56, 2.04, -.93); root.add(dna);
  for (const phase of [0, Math.PI]) {
    const ribbon = new THREE.Mesh(createHelixGeometry(phase, simple ? 36 : 96, simple ? 6 : 12), metal); ribbon.scale.setScalar(.037); dna.add(ribbon);
  }
  // Wall identity uses the existing vector logo as a texture, with no logo motion.
  const signCanvas = document.createElement("canvas"); signCanvas.width = 768; signCanvas.height = 256;
  const signCtx = signCanvas.getContext("2d")!;
  const signTexture = new THREE.CanvasTexture(signCanvas); signTexture.colorSpace = THREE.SRGBColorSpace; textures.add(signTexture);
  const paintSign = (image?: HTMLImageElement) => {
    signCtx.fillStyle = "#1b2029"; signCtx.fillRect(0, 0, 768, 256);
    if (image) signCtx.drawImage(image, 30, 39, 145, 137);
    signCtx.fillStyle = "#d8e0e9"; signCtx.font = "27px sans-serif"; signCtx.fillText("MATHEUS FERREIRA", 211, 112);
    signCtx.fillStyle = "#8797aa"; signCtx.font = "14px sans-serif"; signCtx.fillText("GESTÃO  ·  TECNOLOGIA  ·  SOLUÇÕES", 211, 151); signTexture.needsUpdate = true;
  };
  paintSign(); const logo = new Image(); logo.onload = () => paintSign(logo); logo.src = "/brand/mf-white.svg";
  box(2.8, .94, .055, graphite, -2.6, 3.63, -3.46);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.7, .9), new THREE.MeshBasicMaterial({ map: signTexture, color: 0xadb6c6 })); sign.position.set(-2.6, 3.63, -3.427); root.add(sign);
  // Contact shadows stay visible in the lightweight renderer as well.
  const shadowCanvas = document.createElement("canvas"); shadowCanvas.width = shadowCanvas.height = 128;
  const shadowCtx = shadowCanvas.getContext("2d")!; const shadowGradient = shadowCtx.createRadialGradient(64, 64, 6, 64, 64, 64);
  shadowGradient.addColorStop(0, "rgba(0,0,0,.65)"); shadowGradient.addColorStop(1, "rgba(0,0,0,0)"); shadowCtx.fillStyle = shadowGradient; shadowCtx.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas); textures.add(shadowTexture);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 4.8), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: .7 })); shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, .001, .1); root.add(shadow);

  // Batch static surfaces by material; tiny details do not become hundreds of draw calls.
  if (!simple) {
    root.updateMatrixWorld(true);
    const batches = new Map<THREE.Material, THREE.Mesh[]>();
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || object.parent === dna || Array.isArray(object.material) || object.material.transparent) return;
      const batch = batches.get(object.material) ?? []; batch.push(object); batches.set(object.material, batch);
    });
    for (const [material, meshes] of batches) {
      if (meshes.length < 2) continue;
      const parts = meshes.map(mesh => {
        const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        return geometry.applyMatrix4(mesh.matrixWorld);
      });
      const geometry = mergeGeometries(parts);
      parts.forEach(part => part.dispose());
      if (!geometry) continue;
      const merged = new THREE.Mesh(geometry, material); merged.castShadow = true; merged.receiveShadow = true; root.add(merged);
      meshes.forEach(mesh => { mesh.removeFromParent(); mesh.geometry.dispose(); });
    }
  }

  return {
    root, dna,
    update(seconds: number, chapter: number, still: boolean) {
      dna.rotation.y = still ? .5 : seconds * .55 + chapter * .55;
      screens.forEach(screen => screen.update(seconds, chapter, still));
    },
    dispose() {
      logo.onload = null;
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      root.traverse(object => { if (object instanceof THREE.Mesh) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material)); } });
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); textures.forEach(texture => texture.dispose()); screens.forEach(screen => screen.dispose());
    },
  };
}
