/**
 * Reads the geometry-only GLB (exported by assimp) and patches in
 * the PBR textures from the textures/ folder by matching filenames.
 *
 * Outputs individual GLB files per obstacle object, each with
 * embedded textures.
 *
 * Usage: node scripts/patch-glb-textures.mjs
 */
import fs from 'fs';
import path from 'path';

const PACK_DIR = 'public/models/obstacles/street-asset-pack';
const INPUT_GLB = 'public/models/obstacles/street/full-pack.glb';
const OUTPUT_DIR = 'public/models/obstacles/street';
const TEX_DIR = path.join(PACK_DIR, 'textures');

// ── Parse the GLB ──────────────────────────────────────────────
const glbData = fs.readFileSync(INPUT_GLB);
const jsonChunkLen = glbData.readUInt32LE(12);
const jsonStr = glbData.toString('utf8', 20, 20 + jsonChunkLen);
const gltf = JSON.parse(jsonStr);

// Binary chunk starts after JSON chunk header (8 bytes) + JSON data
const binChunkOffset = 20 + jsonChunkLen;
const binChunkHeaderLen = 8; // 4 bytes length + 4 bytes type
const binChunkLen = glbData.readUInt32LE(binChunkOffset);
const binData = glbData.subarray(
  binChunkOffset + binChunkHeaderLen,
  binChunkOffset + binChunkHeaderLen + binChunkLen,
);

// ── Index available texture files ──────────────────────────────
const texFiles = fs.readdirSync(TEX_DIR).filter(f => f.endsWith('.png'));

// Build lookup: normalized filename (lowercase) → full path
const texLookup = new Map();
for (const f of texFiles) {
  texLookup.set(f.toLowerCase(), path.join(TEX_DIR, f));
}

// ── Map material names → texture files ─────────────────────────
// The image URIs in the GLB look like:
//   D:\Blender Projects 2\Street Props\Textures\Red_Barrier\Red_Barrier_Barrier_BaseColor.png
// We extract the filename and find it in our textures folder.

function findTexturePath(uri) {
  if (!uri) return null;
  // Extract just the filename from the Windows path
  const filename = uri.split('\\').pop().split('/').pop();
  const key = filename.toLowerCase();
  // Exact match first
  if (texLookup.has(key)) return texLookup.get(key);
  // Fuzzy match: some filenames were truncated in the Sketchfab download
  // e.g. "Concrete_Barrier_Concrete_Barrier_BaseColor.png" → "Concrete_Barrier_Concrete_Barrier_BaseColo.png"
  const noExt = key.replace('.png', '');
  for (const [k, v] of texLookup) {
    const kNoExt = k.replace('.png', '');
    if (noExt.startsWith(kNoExt) || kNoExt.startsWith(noExt)) return v;
  }
  return null;
}

// ── Embed textures into GLTF structure ─────────────────────────
// We'll append PNG data to the binary buffer and create proper
// bufferViews and image entries.

const extraBuffers = []; // PNG file buffers to append
let extraOffset = binData.length;

function embedImage(imageIndex) {
  const img = gltf.images[imageIndex];
  if (!img || !img.uri) return false;

  const texPath = findTexturePath(img.uri);
  if (!texPath) {
    console.warn(`  MISS: ${img.uri.split('\\').pop()}`);
    return false;
  }

  const pngData = fs.readFileSync(texPath);

  // Create a new bufferView for this image
  const bvIndex = gltf.bufferViews.length;
  gltf.bufferViews.push({
    buffer: 0,
    byteOffset: extraOffset,
    byteLength: pngData.length,
  });

  // Update the image to reference the embedded bufferView
  delete img.uri;
  img.bufferView = bvIndex;
  img.mimeType = 'image/png';

  extraBuffers.push(pngData);
  extraOffset += pngData.length;
  // Align to 4 bytes
  const pad = (4 - (pngData.length % 4)) % 4;
  if (pad > 0) {
    extraBuffers.push(Buffer.alloc(pad, 0));
    extraOffset += pad;
  }

  return true;
}

console.log('Embedding textures...');
let embedded = 0;
let missed = 0;
for (let i = 0; i < (gltf.images?.length || 0); i++) {
  if (embedImage(i)) {
    embedded++;
  } else {
    missed++;
  }
}
console.log(`  Embedded: ${embedded}, Missed: ${missed}`);

// Update the buffer size
gltf.buffers[0].byteLength = extraOffset;

// ── Remove extensions that might cause issues ──────────────────
delete gltf.extensionsUsed;
delete gltf.extensionsRequired;
// Clean up materials — remove KHR_materials_specular/volume extensions
for (const mat of gltf.materials || []) {
  delete mat.extensions;
}

// ── Write the full textured GLB ────────────────────────────────
function writeGlb(gltfObj, binChunks, outputPath) {
  const jsonBuf = Buffer.from(JSON.stringify(gltfObj));
  // Pad JSON to 4-byte alignment
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
  const jsonPadded = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]); // space padding

  const binBuf = Buffer.concat(binChunks);
  const binPad = (4 - (binBuf.length % 4)) % 4;
  const binPadded = Buffer.concat([binBuf, Buffer.alloc(binPad, 0)]);

  const totalLen = 12 + 8 + jsonPadded.length + 8 + binPadded.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0); // magic: glTF
  header.writeUInt32LE(2, 4);          // version
  header.writeUInt32LE(totalLen, 8);   // total length

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonPadded.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // JSON

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binPadded.length, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4); // BIN

  const out = Buffer.concat([header, jsonChunkHeader, jsonPadded, binChunkHeader, binPadded]);
  fs.writeFileSync(outputPath, out);
  console.log(`  Wrote: ${outputPath} (${(out.length / 1024).toFixed(0)} KB)`);
}

// Write the full pack with textures
const fullOutput = path.join(OUTPUT_DIR, 'full-pack-textured.glb');
writeGlb(gltf, [binData, ...extraBuffers], fullOutput);

// ── Now split into individual GLBs per obstacle ────────────────
// We'll define which objects we want as obstacles
const OBSTACLE_OBJECTS = [
  'Barrel',
  'Bin',
  'Cone',
  'Hydrant',
  'concrete_barrier',
  'red_barrier',
  'metal_barrier1',
  'metal_barrier2',
  'metal_barrier_damaged1',
  'metal_barrier_damaged2',
  'Cardboard_Box',
  'Cube.001',       // second cardboard box
  'stop',
  'warning',
  'give_way',
  'no_waiting',
  'trashbag',
  'trashbag2',
  'pole_1',
  'pole_2',
];

console.log('\nSplitting into individual GLBs...');

for (const objName of OBSTACLE_OBJECTS) {
  const nodeIdx = gltf.nodes.findIndex(n => n.name === objName);
  if (nodeIdx < 0) {
    console.warn(`  SKIP: node "${objName}" not found`);
    continue;
  }

  const node = gltf.nodes[nodeIdx];
  if (node.mesh === undefined) {
    console.warn(`  SKIP: node "${objName}" has no mesh`);
    continue;
  }

  const mesh = gltf.meshes[node.mesh];

  // Collect all materials and accessors used by this mesh
  const usedMaterials = new Set();
  const usedAccessors = new Set();
  const usedBufferViews = new Set();
  const usedTextures = new Set();
  const usedImages = new Set();

  for (const prim of mesh.primitives) {
    if (prim.material !== undefined) usedMaterials.add(prim.material);
    if (prim.indices !== undefined) usedAccessors.add(prim.indices);
    for (const acc of Object.values(prim.attributes || {})) {
      usedAccessors.add(acc);
    }
  }

  // Collect bufferViews from accessors
  for (const accIdx of usedAccessors) {
    const acc = gltf.accessors[accIdx];
    if (acc.bufferView !== undefined) usedBufferViews.add(acc.bufferView);
  }

  // Collect textures from materials
  for (const matIdx of usedMaterials) {
    const mat = gltf.materials[matIdx];
    const pbr = mat.pbrMetallicRoughness || {};
    if (pbr.baseColorTexture) usedTextures.add(pbr.baseColorTexture.index);
    if (pbr.metallicRoughnessTexture) usedTextures.add(pbr.metallicRoughnessTexture.index);
    if (mat.normalTexture) usedTextures.add(mat.normalTexture.index);
    if (mat.occlusionTexture) usedTextures.add(mat.occlusionTexture.index);
    if (mat.emissiveTexture) usedTextures.add(mat.emissiveTexture.index);
  }

  // Collect images from textures
  for (const texIdx of usedTextures) {
    const tex = gltf.textures[texIdx];
    if (tex.source !== undefined) usedImages.add(tex.source);
  }

  // Collect bufferViews from images
  for (const imgIdx of usedImages) {
    const img = gltf.images[imgIdx];
    if (img.bufferView !== undefined) usedBufferViews.add(img.bufferView);
  }

  // Build remapping tables
  const bvList = [...usedBufferViews].sort((a, b) => a - b);
  const bvRemap = new Map(bvList.map((old, i) => [old, i]));

  const accList = [...usedAccessors].sort((a, b) => a - b);
  const accRemap = new Map(accList.map((old, i) => [old, i]));

  const matList = [...usedMaterials].sort((a, b) => a - b);
  const matRemap = new Map(matList.map((old, i) => [old, i]));

  const texList = [...usedTextures].sort((a, b) => a - b);
  const texRemap = new Map(texList.map((old, i) => [old, i]));

  const imgList = [...usedImages].sort((a, b) => a - b);
  const imgRemap = new Map(imgList.map((old, i) => [old, i]));

  // Build new binary buffer — copy only needed bufferViews
  const newBvChunks = [];
  const newBvDefs = [];
  let offset = 0;

  for (const bvIdx of bvList) {
    const bv = gltf.bufferViews[bvIdx];
    // Determine source: original bin or extra buffers
    let srcBuf;
    if (bv.byteOffset < binData.length) {
      srcBuf = binData.subarray(bv.byteOffset, bv.byteOffset + bv.byteLength);
    } else {
      // It's in the extra buffers region
      let extraStart = bv.byteOffset - binData.length;
      let found = false;
      let cumOffset = 0;
      for (const eb of extraBuffers) {
        if (cumOffset <= extraStart && extraStart < cumOffset + eb.length) {
          const localStart = extraStart - cumOffset;
          srcBuf = eb.subarray(localStart, localStart + bv.byteLength);
          found = true;
          break;
        }
        cumOffset += eb.length;
      }
      if (!found) {
        // Fallback: read from concatenated buffer
        const allBin = Buffer.concat([binData, ...extraBuffers]);
        srcBuf = allBin.subarray(bv.byteOffset, bv.byteOffset + bv.byteLength);
      }
    }

    newBvChunks.push(srcBuf);
    const newBvDef = { buffer: 0, byteOffset: offset, byteLength: bv.byteLength };
    if (bv.target) newBvDef.target = bv.target;
    if (bv.byteStride) newBvDef.byteStride = bv.byteStride;
    newBvDefs.push(newBvDef);
    offset += bv.byteLength;
    // Align to 4 bytes
    const pad = (4 - (bv.byteLength % 4)) % 4;
    if (pad > 0) {
      newBvChunks.push(Buffer.alloc(pad, 0));
      offset += pad;
    }
  }

  // Build new GLTF
  // Node 0 is a root that applies Z-up → Y-up rotation (-90° around X)
  // Node 1 is the actual mesh
  const ROT_X_NEG90 = [-0.7071068, 0, 0, 0.7071068];
  const newGltf = {
    asset: { version: '2.0', generator: 'patch-glb-textures' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      {
        name: objName,
        rotation: ROT_X_NEG90,
        children: [1],
      },
      {
        name: objName + '_mesh',
        mesh: 0,
      },
    ],
    meshes: [{
      name: mesh.name,
      primitives: mesh.primitives.map(p => {
        const np = {};
        if (p.attributes) {
          np.attributes = {};
          for (const [key, val] of Object.entries(p.attributes)) {
            np.attributes[key] = accRemap.get(val);
          }
        }
        if (p.indices !== undefined) np.indices = accRemap.get(p.indices);
        if (p.material !== undefined) np.material = matRemap.get(p.material);
        if (p.mode !== undefined) np.mode = p.mode;
        return np;
      }),
    }],
    accessors: accList.map(idx => {
      const acc = { ...gltf.accessors[idx] };
      if (acc.bufferView !== undefined) acc.bufferView = bvRemap.get(acc.bufferView);
      return acc;
    }),
    bufferViews: newBvDefs,
    buffers: [{ byteLength: offset }],
    materials: matList.map(idx => {
      const mat = JSON.parse(JSON.stringify(gltf.materials[idx]));
      delete mat.extensions;
      const pbr = mat.pbrMetallicRoughness;
      if (pbr?.baseColorTexture) pbr.baseColorTexture.index = texRemap.get(pbr.baseColorTexture.index);
      if (pbr?.metallicRoughnessTexture) pbr.metallicRoughnessTexture.index = texRemap.get(pbr.metallicRoughnessTexture.index);
      if (mat.normalTexture) mat.normalTexture.index = texRemap.get(mat.normalTexture.index);
      if (mat.occlusionTexture) mat.occlusionTexture.index = texRemap.get(mat.occlusionTexture.index);
      if (mat.emissiveTexture) mat.emissiveTexture.index = texRemap.get(mat.emissiveTexture.index);
      return mat;
    }),
    textures: texList.map(idx => {
      const tex = { ...gltf.textures[idx] };
      if (tex.source !== undefined) tex.source = imgRemap.get(tex.source);
      return tex;
    }),
    images: imgList.map(idx => ({ ...gltf.images[idx], bufferView: bvRemap.get(gltf.images[idx].bufferView) })),
  };

  // Add samplers if present
  if (gltf.samplers) newGltf.samplers = gltf.samplers;

  const slug = objName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  const outPath = path.join(OUTPUT_DIR, `${slug}.glb`);
  writeGlb(newGltf, newBvChunks, outPath);
}

console.log('\nDone!');
