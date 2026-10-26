import fs from 'node:fs';
// Source retained alongside this adaptation with its exact asset-specific credits.
const source = fs.readFileSync(new URL('../assets-source/plant-source.glb', import.meta.url));
const jsonSize = source.readUInt32LE(12), json = JSON.parse(source.subarray(20, 20 + jsonSize).toString());
// Keep only the pot, leaves and substrate. Remove animated fireflies, cameras and lights.
json.scenes = [{ name: 'Potted plant — office adaptation', nodes: [0, 1, 2] }]; json.scene = 0;
json.nodes = json.nodes.slice(0, 3); delete json.animations; delete json.cameras; delete json.extensions;
json.extensionsUsed = []; delete json.extensionsRequired;
json.materials.forEach(m => { delete m.extensions; });
// r169 does not support KHR_materials_diffuse_transmission. Its base PBR maps are retained.
json.asset.extras = { adaptation: 'Static pot/leaves/dirt; extension removed for Three.js r169 compatibility.', source: 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DiffuseTransmissionPlant' };
const raw = Buffer.from(JSON.stringify(json)); const padded = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 0x20); raw.copy(padded);
const binaryChunk = source.subarray(20 + jsonSize);
const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(20 + padded.length + binaryChunk.length, 8); header.writeUInt32LE(padded.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
fs.writeFileSync(new URL('../public/models/plant/plant.glb', import.meta.url), Buffer.concat([header, padded, binaryChunk]));
console.log('Prepared plant.glb: three static nodes; embedded PBR textures; no external resource URLs.');
