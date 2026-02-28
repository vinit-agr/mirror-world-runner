import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useCharacterStore } from './characterStore';

// Scale factor: Mixamo characters are ~180 units tall, we want ~1.8 units
const MODEL_SCALE = 0.01;

export function Character() {
  const groupRef = useRef<THREE.Group>(null!);

  // Load the main character FBX
  const fbx = useFBX('/models/character.fbx');

  // Log model info on first load
  useEffect(() => {
    console.log('[Character] FBX loaded:', {
      children: fbx.children.length,
      animations: fbx.animations.map((a) => `${a.name} (${a.duration.toFixed(2)}s)`),
    });

    // Walk the scene tree to understand what we have
    fbx.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = child as THREE.SkinnedMesh;
        console.log(`[Character] SkinnedMesh: "${sm.name}"`, {
          boneCount: sm.skeleton?.bones?.length ?? 0,
          visible: sm.visible,
        });
        // Enable shadows
        sm.castShadow = true;
        sm.receiveShadow = true;
      }
    });

    // Compute and log bounding box
    const box = new THREE.Box3().setFromObject(fbx);
    const size = box.getSize(new THREE.Vector3());
    console.log('[Character] BBox:', {
      min: box.min.toArray().map((v) => +v.toFixed(2)),
      max: box.max.toArray().map((v) => +v.toFixed(2)),
      size: size.toArray().map((v) => +v.toFixed(2)),
    });
  }, [fbx]);

  // Set up animations — the FBX might have embedded animations
  const { actions, mixer, names } = useAnimations(fbx.animations, groupRef);

  // Register available animations in the store
  useEffect(() => {
    const playableNames = names.filter((n) => {
      const clip = actions[n]?.getClip();
      return clip && clip.duration > 0;
    });

    console.log('[Character] Available actions:', names);
    console.log('[Character] Playable actions:', playableNames);
    useCharacterStore.getState().setAvailableActions(names);

    // Auto-play the first playable animation
    if (playableNames.length > 0) {
      const first = playableNames[0];
      actions[first]!.reset().fadeIn(0.3).play();
      useCharacterStore.getState().setCurrentAction(first);
      console.log(`[Character] Auto-playing: "${first}"`);
    } else if (names.length > 0) {
      // Even if duration is 0 (T-pose), register it
      console.log(`[Character] No playable animations (all duration 0). Character will show T-pose.`);
    }
  }, [actions, names]);

  // Subscribe to action changes from keyboard input
  const prevAction = useRef<string | null>(null);

  useFrame((_, delta) => {
    const { currentAction } = useCharacterStore.getState();

    // Switch animation if action changed
    if (currentAction !== prevAction.current) {
      // Fade out previous
      if (prevAction.current && actions[prevAction.current]) {
        actions[prevAction.current]!.fadeOut(0.2);
      }
      // Fade in new
      if (currentAction && actions[currentAction]) {
        actions[currentAction]!.reset().fadeIn(0.2).play();
      }
      prevAction.current = currentAction;
    }

    // Update mixer
    mixer.update(delta);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive
        object={fbx}
        scale={MODEL_SCALE}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}
