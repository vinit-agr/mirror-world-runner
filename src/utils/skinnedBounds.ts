import * as THREE from 'three';

/**
 * Compute the minimum Y of all skinned vertices in the current pose.
 * Box3.setFromObject does NOT apply bone transforms for SkinnedMesh,
 * so we manually use boneTransform() to get the actual vertex positions.
 */
export function getSkinnedMinY(root: THREE.Object3D): number {
  let minY = Infinity;
  const v = new THREE.Vector3();

  root.updateMatrixWorld(true);

  root.traverse((child) => {
    if (!(child as THREE.SkinnedMesh).isSkinnedMesh) return;
    const mesh = child as THREE.SkinnedMesh;
    const pos = mesh.geometry.attributes.position;

    // Update skeleton so bone matrices are current
    mesh.skeleton.update();

    // Sample vertices (every Nth for performance; still accurate for min Y)
    const step = Math.max(1, Math.floor(pos.count / 500));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i);
      mesh.boneTransform(i, v);
      // Transform from mesh-local to world space (includes parent scale)
      v.applyMatrix4(mesh.matrixWorld);
      if (v.y < minY) minY = v.y;
    }
  });

  return minY === Infinity ? 0 : minY;
}
