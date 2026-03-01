import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useModelTestStore } from './modelTestStore';

export function ObstacleViewer() {
  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Group | null>(null);
  const boxHelperRef = useRef<THREE.Box3Helper | null>(null);
  const loadedFile = useRef<string>('');
  const { scene } = useThree();

  const selectedObstacle = useModelTestStore((s) => s.selectedObstacle);

  useEffect(() => {
    if (!groupRef.current || loadedFile.current === selectedObstacle) return;

    // Clean up previous
    if (modelRef.current) {
      groupRef.current.remove(modelRef.current);
      modelRef.current = null;
    }
    if (boxHelperRef.current) {
      scene.remove(boxHelperRef.current);
      boxHelperRef.current = null;
    }

    const loader = new GLTFLoader();
    const url = `/models/obstacles/street/${selectedObstacle}`;

    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // Compute bounding box to center and ground the model
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        // Center horizontally, sit on ground
        model.position.set(-center.x, -box.min.y, -center.z);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).castShadow = true;
            (child as THREE.Mesh).receiveShadow = true;
          }
        });

        groupRef.current.add(model);
        modelRef.current = model;
        loadedFile.current = selectedObstacle;

        // Create bounding box helper
        const worldBox = new THREE.Box3().setFromObject(model);
        const helper = new THREE.Box3Helper(worldBox, new THREE.Color(0x00ff00));
        scene.add(helper);
        boxHelperRef.current = helper;

        // Store dimensions for display
        useModelTestStore.getState().setObstacleLoadError(null);
      },
      undefined,
      (err) => {
        console.error('[ObstacleViewer] Failed to load:', err);
        useModelTestStore.getState().setObstacleLoadError(`Failed to load ${selectedObstacle}`);
        loadedFile.current = '';
      },
    );

    return () => {
      // Cleanup on unmount
      if (boxHelperRef.current) {
        scene.remove(boxHelperRef.current);
        boxHelperRef.current = null;
      }
    };
  }, [selectedObstacle, scene]);

  // Update scale, rotation, and bounding box visibility each frame
  useFrame(() => {
    if (!groupRef.current) return;
    const { obstacleScale, obstacleRotationY, showBoundingBox } = useModelTestStore.getState();
    groupRef.current.scale.setScalar(obstacleScale);
    groupRef.current.rotation.y = obstacleRotationY;

    // Update bounding box
    if (boxHelperRef.current) {
      boxHelperRef.current.visible = showBoundingBox;
      if (showBoundingBox && modelRef.current) {
        boxHelperRef.current.box.setFromObject(groupRef.current);
      }
    }
  });

  return <group ref={groupRef} />;
}
