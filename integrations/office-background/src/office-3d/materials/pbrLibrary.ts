import * as THREE from 'three';

type Surface = 'walnut' | 'oak' | 'mineral' | 'fabric' | 'rug' | 'ceramic' | 'metal' | 'leather' | 'pages' | 'leaf';
const hash = (x: number, y: number) => {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), fx),
    THREE.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), fx), fy);
}

class MaterialCache {
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private textures = new Set<THREE.Texture>();
  private maps = new Map<Surface, { map: THREE.Texture; roughnessMap: THREE.Texture; normalMap: THREE.Texture }>();
  private users = 0;
  private disposeTimer?: ReturnType<typeof setTimeout>;
  retain() { this.users++; clearTimeout(this.disposeTimer); }
  release() {
    this.users = Math.max(0, this.users - 1);
    this.disposeTimer = setTimeout(() => {
      if (this.users) return;
      this.materials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose());
      this.materials.clear(); this.textures.clear(); this.maps.clear();
    }, 100);
  }
  private surface(kind: Surface) {
    const cached = this.maps.get(kind); if (cached) return cached;
    const wood = kind === 'walnut' || kind === 'oak', size = wood ? 1024 : 512;
    const height = new Float32Array(size * size);
    const albedo = new Uint8Array(size * size * 4), roughness = new Uint8Array(size * size * 4), normals = new Uint8Array(size * size * 4);
    const colors: Record<Surface, [number, number, number]> = {
      walnut: [104, 67, 43], oak: [143, 111, 77], mineral: [181, 177, 164],
      fabric: [66, 73, 70], rug: [151, 145, 127], ceramic: [184, 174, 152],
      metal: [130, 130, 130], leather: [42, 40, 35], pages: [211, 203, 178], leaf: [51, 85, 40],
    };
    const base = colors[kind];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size, fine = noise(x * .38, y * .38);
      let h = .5, variation = 0;
      if (wood) {
        const warp = noise(u * 3, v * 6) * 2.7 + noise(u * 8, v * 5) * .4;
        const cathedral = Math.sin(u * 6.28 + noise(u * 3, v * 2)) * .75;
        const ring = Math.pow(.5 + .5 * Math.sin((v * 31 + warp + cathedral) * 6.283), 15);
        const fibers = noise(u * 45, v * 720), pores = Math.pow(noise(u * 260, v * 490), 9);
        h = .5 - ring * .13 + fibers * .1 - pores * .25;
        variation = -ring * 12 + (noise(u * 4, v * 6) - .5) * 31 + (fibers - .5) * 15 - pores * 19;
      } else if (kind === 'fabric' || kind === 'rug') {
        const weave = Math.sin(x * Math.PI * .5) * Math.sin(y * Math.PI * .5);
        h = .5 + weave * .14 + fine * .05;
        variation = weave * 10 + (noise(u * 22, v * 22) - .5) * 14;
      } else if (kind === 'metal') {
        h = .5 + noise(u * 2, v * 500) * .08; variation = (h - .54) * 45;
      } else if (kind === 'pages') {
        h = .5 + Math.sin(y * 3) * .12; variation = (h - .5) * 40 + (fine - .5) * 6;
      } else if (kind === 'leaf') {
        const spine = Math.exp(-Math.pow((u - .5) * 85, 2));
        const veins = Math.pow(.5 + .5 * Math.cos(v * 110 - Math.abs(u - .5) * 45), 18);
        h = .5 + spine * .15 + veins * .06; variation = spine * 25 + veins * 9 + (noise(u * 10, v * 9) - .5) * 16;
      } else {
        h = .5 + (fine - .5) * .15 + (noise(u * 28, v * 28) - .5) * .2; variation = (h - .5) * 32;
      }
      const index = y * size + x, p = index * 4; height[index] = h;
      for (let c = 0; c < 3; c++) {
        albedo[p + c] = THREE.MathUtils.clamp(base[c] + variation, 0, 255);
        roughness[p + c] = THREE.MathUtils.clamp((wood ? 150 : 220) + (h - .5) * 65, 0, 255);
      }
      albedo[p + 3] = roughness[p + 3] = 255;
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = height[y * size + (x + 1) % size] - height[y * size + (x + size - 1) % size];
      const dy = height[((y + 1) % size) * size + x] - height[((y + size - 1) % size) * size + x];
      const nx = -dx * 1.8, ny = -dy * 1.8, inverseLength = 1 / Math.sqrt(nx * nx + ny * ny + 1), p = (y * size + x) * 4;
      normals[p] = (nx * inverseLength * .5 + .5) * 255; normals[p + 1] = (ny * inverseLength * .5 + .5) * 255;
      normals[p + 2] = (inverseLength * .5 + .5) * 255; normals[p + 3] = 255;
    }
    const texture = (data: Uint8Array, color: boolean) => {
      const tex = new THREE.DataTexture(new Uint8Array(data), size, size, THREE.RGBAFormat);
      tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true; tex.anisotropy = 8; tex.needsUpdate = true;
      // Solid UVs use metres; each wood tile covers 2.4 × .7 m.
      tex.repeat.set(wood ? 1 / 2.4 : kind === 'leaf' ? 1 : 4, wood ? 1 / .7 : kind === 'leaf' ? 1 : 4);
      this.textures.add(tex); return tex;
    };
    const result = { map: texture(albedo, true), roughnessMap: texture(roughness, false), normalMap: texture(normals, false) };
    this.maps.set(kind, result); return result;
  }
  private get(key: string, parameters: THREE.MeshStandardMaterialParameters, surface?: Surface) {
    if (!this.materials.has(key)) this.materials.set(key, new THREE.MeshStandardMaterial({
      ...parameters, ...(surface ? this.surface(surface) : {}),
      normalScale: new THREE.Vector2(surface === 'metal' ? .18 : .4, surface === 'metal' ? .18 : .4),
    }));
    return this.materials.get(key)!;
  }
  getWalnutDesk() { return this.get('walnut', { roughness: .72, metalness: 0, envMapIntensity: .8 }, 'walnut'); }
  getSlattedWood() { return this.get('slats', { color: '#d5bc9c', roughness: .88 }, 'walnut'); }
  getHardwoodFloor() { return this.get('floor', { roughness: .94, metalness: 0 }, 'oak'); }
  getGraphiteMetal() { return this.get('graphite', { color: '#303536', roughness: .36, metalness: .85 }, 'metal'); }
  getAnodizedAluminum() { return this.get('aluminum', { color: '#b4bac0', roughness: .36, metalness: .95 }, 'metal'); }
  getMineralWall() { return this.get('mineral', { roughness: .96 }, 'mineral'); }
  getDeskMatFelt() { return this.get('felt', { roughness: .96, color: '#747d75' }, 'fabric'); }
  getChairFabric() { return this.get('chair', { roughness: .94 }, 'fabric'); }
  getRug() { return this.get('rug', { roughness: 1 }, 'rug'); }
  getLeather() { return this.get('leather', { roughness: .68 }, 'leather'); }
  getCeramic() { return this.get('ceramic', { roughness: .83 }, 'ceramic'); }
  getPlastic() { return this.get('plastic', { color: '#222729', roughness: .6 }); }
  getSoil() { return this.get('soil', { color: '#30291e', roughness: 1 }, 'mineral'); }
  getStem() { return this.get('stem', { color: '#536440', roughness: .85 }); }
  getLeaf() { return this.get('leaf', { side: THREE.DoubleSide, roughness: .52, emissive: '#182b0e', emissiveIntensity: .12 }, 'leaf'); }
  getPages() { return this.get('pages', { roughness: 1 }, 'pages'); }
  getBookCover(color: string) { return this.get(`book-${color}`, { color, roughness: .84 }); }
  getBrass() { return this.get('brass', { color: '#b19461', metalness: .8, roughness: .38 }); }
  getArchitecturalGlass() {
    if (!this.materials.has('glass')) this.materials.set('glass', new THREE.MeshPhysicalMaterial({
      color: '#dae9ec', transparent: true, opacity: .09, roughness: .07, metalness: 0,
      ior: 1.52, reflectivity: .28, clearcoat: 1, clearcoatRoughness: .08,
      side: THREE.DoubleSide, depthWrite: false,
    }));
    return this.materials.get('glass')!;
  }
}
export const pbrLibrary = new MaterialCache();
