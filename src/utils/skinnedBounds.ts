import * as THREE from 'three';

/**
 * Compute the minimum Y of all vertices in the current (skinned) pose.
 *
 * IMPORTANT: Call this BEFORE applying any external scale (MODEL_SCALE) to
 * the root object.  The FBXLoader computes skeleton boneInverses and
 * bindMatrix at load-time scale.  If you scale the root first, bone
 * world-matrices will include that scale while boneInverses won't,
 * producing wrong skinned positions.
 *
 * The returned value is in the root's original (unscaled) coordinate space.
 * Multiply by MODEL_SCALE when using it as a position offset.
 */
export function getSkinnedMinY(root: THREE.Object3D): number {
  let minY = Infinity;
  const v = new THREE.Vector3();

  root.traverse((child) => {
    const isSkinned = (child as THREE.SkinnedMesh).isSkinnedMesh;
    const isMesh = (child as THREE.Mesh).isMesh;

    if (!isSkinned && !isMesh) return;

    const mesh = child as THREE.Mesh;
    const pos = mesh.geometry?.attributes?.position;
    if (!pos) return;

    if (isSkinned) {
      const sm = child as THREE.SkinnedMesh;
      try {
        sm.skeleton.update();
      } catch {
        // Some skeletons may fail to update
      }
    }

    // Sample every Nth vertex for performance
    const step = Math.max(1, Math.floor(pos.count / 500));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i);

      if (isSkinned) {
        // Three.js ≥ r152 renamed boneTransform → applyBoneTransform
        (child as THREE.SkinnedMesh).applyBoneTransform(i, v);
      }

      v.applyMatrix4(mesh.matrixWorld);
      if (v.y < minY) minY = v.y;
    }
  });

  return minY === Infinity ? 0 : minY;
}
