import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const readGLB = file => {
  const buffer = fs.readFileSync(path.join(root, file));
  assert.equal(buffer.toString('ascii', 0, 4), 'glTF'); assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  return JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
};
const model = readGLB('public/models/plant/plant.glb');
assert.deepEqual(model.scenes[0].nodes, [0, 1, 2]);
assert.equal(model.nodes.length, 3); assert.equal(model.animations, undefined);
for (const image of model.images ?? []) {
  assert.equal(image.uri, undefined, 'All plant images must remain embedded');
  assert.ok(model.bufferViews[image.bufferView]);
}
for (const accessor of model.accessors ?? []) if (accessor.bufferView !== undefined) assert.ok(model.bufferViews[accessor.bufferView]);
for (const buffer of model.buffers ?? []) assert.equal(buffer.uri, undefined);
assert.ok(!model.extensionsUsed.includes('KHR_materials_diffuse_transmission'));
for (const file of ['ASSET_CREDITS.md', 'public/ASSET_CREDITS.md', 'public/models/plant/SOURCE.md', 'assets-source/plant-source.glb']) assert.ok(fs.existsSync(path.join(root, file)), file);
assert.equal(fs.readFileSync(path.join(root, 'ASSET_CREDITS.md'), 'utf8'), fs.readFileSync(path.join(root, 'public/ASSET_CREDITS.md'), 'utf8'));
const walk = folder => fs.readdirSync(folder, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(folder, e.name)) : [path.join(folder, e.name)]);
for (const file of walk(path.join(root, 'src'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const [, uri] of text.matchAll(/(?:url|href)=['"](\/(?:models|textures|hdri)\/[^'"]+)['"]/g)) assert.ok(fs.existsSync(path.join(root, 'public', uri)), `Missing ${uri}`);
}
console.log('PASS: GLB v2 integrity, embedded resources, local asset URLs, asset-specific license and public attribution.');
