import * as THREE from 'three';

/**
 * Compute the minimum Y of all vertices in the current (skinned) pose.
 * Uses boneTransform() for SkinnedMesh to get actual post-skeleton positions.
 * Also checks regular Meshes as a fallback for non-skinned characters.
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
        try {
          (child as THREE.SkinnedMesh).boneTransform(i, v);
        } catch {
          // Fall through with raw position if boneTransform fails
        }
      }

      v.applyMatrix4(mesh.matrixWorld);
      if (v.y < minY) minY = v.y;
    }
  });

  return minY === Infinity ? 0 : minY;
}
