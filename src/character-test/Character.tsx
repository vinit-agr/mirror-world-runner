import { useEffect, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useCharacterStore } from './characterStore';
import type { CharacterEntry } from './characterStore';
import { getSkinnedMinY } from '../utils/skinnedBounds';

const MODEL_SCALE = 0.01;

type AnimEntry = { name: string; file: string };

export function Character() {
  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const prevAction = useRef<string | null>(null);
  const loadedCharFile = useRef<string>('');

  // Load character manifest on mount
  useEffect(() => {
    async function loadManifest() {
      try {
        const res = await fetch('/models/characters/manifest.json');
        const data = await res.json();
        const chars: CharacterEntry[] = data.characters;
        useCharacterStore.getState().setAvailableCharacters(chars);
      } catch (err) {
        console.error('[Character] Failed to load character manifest:', err);
      }
    }
    loadManifest();
  }, []);

  const loadCharacter = useCallback(async (charFile: string) => {
    if (!groupRef.current || loadedCharFile.current === charFile) return;

    // Clean up previous
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }
    actionsRef.current = {};
    prevAction.current = null;

    if (modelRef.current) {
      groupRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    const loader = new FBXLoader();
    let fbx: THREE.Group;
    try {
      fbx = await loader.loadAsync(`/models/characters/${encodeURIComponent(charFile)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Character] Failed to load "${charFile}":`, msg);
      if (msg.includes('version not supported')) {
        useCharacterStore.getState().setLoadError(
          `"${charFile.replace('.fbx', '')}" uses FBX 6.x format. Re-export from Mixamo as FBX Binary (7.4).`,
        );
      } else {
        useCharacterStore.getState().setLoadError(`Failed to load: ${msg}`);
      }
      loadedCharFile.current = '';
      return;
    }

    useCharacterStore.getState().setLoadError(null);

    fbx.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
    fbx.rotation.set(0, Math.PI, 0);
    fbx.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    groupRef.current.add(fbx);
    modelRef.current = fbx;
    loadedCharFile.current = charFile;

    // Detect the character's Mixamo bone prefix.
    // Animations use "mixamorigHips" etc. but some characters use
    // "mixamorig7Hips", "mixamorig1Hips", etc.
    let charBonePrefix = '';
    fbx.traverse((child) => {
      if (charBonePrefix) return;
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const sm = child as THREE.SkinnedMesh;
        for (const bone of sm.skeleton?.bones || []) {
          const match = bone.name.match(/^(mixamorig\d*)/);
          if (match) {
            charBonePrefix = match[1];
            return;
          }
        }
      }
    });
    console.log(`[Character] "${charFile}" bone prefix: "${charBonePrefix}"`);

    // Set up mixer and load animations
    const mixer = new THREE.AnimationMixer(fbx);
    mixerRef.current = mixer;

    let entries: AnimEntry[];
    try {
      const res = await fetch('/models/anims/manifest.json');
      entries = (await res.json()).animations;
    } catch {
      console.error('[Character] Failed to load animation manifest');
      return;
    }

    const actions: Record<string, THREE.AnimationAction> = {};
    for (const entry of entries) {
      try {
        const anim = await loader.loadAsync(`/models/anims/${entry.file}`);
        if (anim.animations.length > 0) {
          const clip = anim.animations[0];
          clip.name = entry.name;

          // Remap animation bone names to match this character's prefix.
          if (charBonePrefix && charBonePrefix !== 'mixamorig') {
            for (const track of clip.tracks) {
              track.name = track.name.replace(/^mixamorig(?!\d)/, charBonePrefix);
            }
          }

          actions[entry.name] = mixer.clipAction(clip);
        }
      } catch (err) {
        console.warn(`[Character] Skipping ${entry.file}:`, err);
      }
    }

    actionsRef.current = actions;
    const names = Object.keys(actions);
    useCharacterStore.getState().setAvailableActions(names);

    const defaultAnim = names.includes('Idle') ? 'Idle' : names[0];
    if (defaultAnim && actions[defaultAnim]) {
      actions[defaultAnim].reset().fadeIn(0.3).play();
      useCharacterStore.getState().setCurrentAction(defaultAnim);
      prevAction.current = defaultAnim;
    }

    // Compute ground offset using actual skinned vertex positions.
    mixer.update(0);
    groupRef.current.updateMatrixWorld(true);
    const minY = getSkinnedMinY(fbx);
    fbx.position.y = -minY;

    // Listen for one-shot animations finishing
    mixer.addEventListener('finished', (e: { action: THREE.AnimationAction }) => {
      const finishedName = e.action.getClip().name;
      if (finishedName === 'Jump' || finishedName === 'Slide') {
        const { isRunning } = useCharacterStore.getState();
        const returnTo = isRunning ? 'Run' : 'Idle';
        useCharacterStore.getState().setCurrentAction(returnTo);
      }
    });
  }, []);

  // React to character selection changes
  const selectedCharacter = useCharacterStore((s) => s.selectedCharacter);
  useEffect(() => {
    loadCharacter(selectedCharacter);
  }, [selectedCharacter, loadCharacter]);

  // Handle animation switching from store
  useFrame((_, delta) => {
    if (!mixerRef.current) return;

    const { currentAction } = useCharacterStore.getState();
    const actions = actionsRef.current;

    if (currentAction !== prevAction.current) {
      if (prevAction.current && actions[prevAction.current]) {
        actions[prevAction.current].fadeOut(0.2);
      }
      if (currentAction && actions[currentAction]) {
        const action = actions[currentAction];
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

  return <group ref={groupRef} position={[0, 0, 0]} />;
}
