import fs from 'fs';

const filePath = process.argv[2] || 'public/models/obstacles/street-asset-pack/Trash.glb';
const data = fs.readFileSync(filePath);

const magic = data.readUInt32LE(0);
console.log('File:', filePath);
console.log('Size:', (data.length / 1024).toFixed(1), 'KB');
console.log('Magic:', magic === 0x46546C67 ? 'valid GLB' : 'INVALID');
console.log('');

const jsonChunkLen = data.readUInt32LE(12);
const jsonStr = data.toString('utf8', 20, 20 + jsonChunkLen);
const gltf = JSON.parse(jsonStr);

console.log('Nodes:', gltf.nodes?.length || 0);
console.log('Meshes:', gltf.meshes?.length || 0);
console.log('Materials:', gltf.materials?.length || 0);
console.log('Textures:', gltf.textures?.length || 0);
console.log('Images:', gltf.images?.length || 0);
console.log('');

if (gltf.nodes) {
  console.log('=== Nodes ===');
  for (const n of gltf.nodes) {
    console.log(`  ${n.name}${n.mesh !== undefined ? ` (mesh ${n.mesh})` : ''}`);
  }
  console.log('');
}

if (gltf.materials) {
  console.log('=== Materials ===');
  for (const m of gltf.materials) {
    const pbr = m.pbrMetallicRoughness || {};
    const hasBCT = !!pbr.baseColorTexture;
    const hasNormal = !!m.normalTexture;
    const hasMR = !!pbr.metallicRoughnessTexture;
    const baseColor = pbr.baseColorFactor
      ? `[${pbr.baseColorFactor.map(v => v.toFixed(2)).join(', ')}]`
      : 'default';
    console.log(`  ${m.name}: baseColorTex=${hasBCT} normal=${hasNormal} metalRough=${hasMR} factor=${baseColor}`);
  }
  console.log('');
}

if (gltf.images) {
  console.log('=== Images ===');
  for (let i = 0; i < gltf.images.length; i++) {
    const img = gltf.images[i];
    if (img.uri) {
      console.log(`  [${i}] EXTERNAL: ${img.uri.substring(0, 80)}`);
    } else if (img.bufferView !== undefined) {
      const bv = gltf.bufferViews[img.bufferView];
      console.log(`  [${i}] EMBEDDED: mime=${img.mimeType} size=${(bv.byteLength / 1024).toFixed(1)}KB`);
    } else {
      console.log(`  [${i}] EMPTY/MISSING`);
    }
  }
}
