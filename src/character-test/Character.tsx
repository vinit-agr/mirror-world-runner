import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useCharacterStore } from './characterStore';

// Scale factor: Mixamo characters are ~180 units tall, we want ~1.8 units
const MODEL_SCALE = 0.01;

type AnimEntry = { name: string; file: string };

export function Character() {
  const groupRef = useRef<THREE.Group>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const prevAction = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  // Load the main character mesh
  const fbx = useFBX('/models/character.fbx');

  // Set up shadows on the model
  useEffect(() => {
    fbx.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = child as THREE.SkinnedMesh;
        sm.castShadow = true;
        sm.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(fbx);
    const size = box.getSize(new THREE.Vector3());
    console.log('[Character] Model loaded. BBox size:', size.toArray().map((v) => +v.toFixed(1)));
  }, [fbx]);

  // Dynamically load animations from manifest.json
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(fbx);
    mixerRef.current = mixer;

    async function loadAnimations() {
      // Fetch the manifest
      let entries: AnimEntry[];
      try {
        const res = await fetch('/models/anims/manifest.json');
        const data = await res.json();
        entries = data.animations;
        console.log('[Character] Manifest loaded:', entries.map((e) => e.name));
      } catch (err) {
        console.error('[Character] Failed to load manifest.json:', err);
        return;
      }

      const loader = new FBXLoader();
      const actions: Record<string, THREE.AnimationAction> = {};

      // Load each animation FBX
      for (const entry of entries) {
        try {
          const animFbx = await loader.loadAsync(`/models/anims/${entry.file}`);
          if (animFbx.animations.length > 0) {
            const clip = animFbx.animations[0];
            clip.name = entry.name;
            const action = mixer.clipAction(clip);
            actions[entry.name] = action;
            console.log(`[Character] Animation "${entry.name}": ${clip.duration.toFixed(2)}s, ${clip.tracks.length} tracks`);
          } else {
            console.warn(`[Character] No animations in ${entry.file}`);
          }
        } catch (err) {
          console.error(`[Character] Failed to load ${entry.file}:`, err);
        }
      }

      actionsRef.current = actions;
      const names = Object.keys(actions);
      useCharacterStore.getState().setAvailableActions(names);

      // Auto-play Idle if available, otherwise first
      const defaultAnim = names.includes('Idle') ? 'Idle' : names[0];
      if (defaultAnim && actions[defaultAnim]) {
        actions[defaultAnim].reset().fadeIn(0.3).play();
        useCharacterStore.getState().setCurrentAction(defaultAnim);
        prevAction.current = defaultAnim;
        console.log(`[Character] Default animation: "${defaultAnim}"`);
      }

      setReady(true);
    }

    loadAnimations();

    return () => {
      mixer.stopAllAction();
    };
  }, [fbx]);

  // Handle animation switching from store
  useFrame((_, delta) => {
    if (!mixerRef.current) return;

    const { currentAction } = useCharacterStore.getState();
    const actions = actionsRef.current;

    if (currentAction !== prevAction.current) {
      // Fade out previous
      if (prevAction.current && actions[prevAction.current]) {
        actions[prevAction.current].fadeOut(0.2);
      }
      // Fade in new
      if (currentAction && actions[currentAction]) {
        const action = actions[currentAction];
        // One-shot animations (Jump, Slide) play once then return to previous
        if (currentAction === 'Jump' || currentAction === 'Slide') {
          action.reset().fadeIn(0.2).play();
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        } else {
          action.reset().fadeIn(0.2).play();
        }
      }
      prevAction.current = currentAction;
    }

    mixerRef.current.update(delta);
  });

  // Listen for one-shot animations finishing and return to idle/run
  useEffect(() => {
    if (!mixerRef.current) return;
    const mixer = mixerRef.current;

    const onFinished = (e: { action: THREE.AnimationAction }) => {
      const finishedName = e.action.getClip().name;
      if (finishedName === 'Jump' || finishedName === 'Slide') {
        // Return to whatever the base state should be
        const { isRunning } = useCharacterStore.getState();
        const returnTo = isRunning ? 'Run' : 'Idle';
        useCharacterStore.getState().setCurrentAction(returnTo);
      }
    };

    mixer.addEventListener('finished', onFinished);
    return () => mixer.removeEventListener('finished', onFinished);
  }, [ready]);

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
