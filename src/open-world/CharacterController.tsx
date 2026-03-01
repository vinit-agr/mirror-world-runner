import { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useWorldStore } from './worldStore';
import type { CharacterEntry } from './worldStore';
import { getSkinnedMinY } from '../utils/skinnedBounds';

const MODEL_SCALE = 0.01;
const MOVE_SPEED = 6;
const ROTATION_SPEED = 10;

type AnimEntry = { name: string; file: string };

export function CharacterController() {
  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const prevAction = useRef<string>('');
  const oneShotPlaying = useRef<string | null>(null);
  const keys = useRef(new Set<string>());
  const loadedCharFile = useRef<string>('');
  const groundOffsetsRef = useRef<Record<string, number>>({});

  const { camera } = useThree();

  // Load character manifest on mount
  useEffect(() => {
    async function loadManifest() {
      try {
        const res = await fetch('/models/characters/manifest.json');
        const data = await res.json();
        const chars: CharacterEntry[] = data.characters;
        useWorldStore.getState().setAvailableCharacters(chars);
      } catch (err) {
        console.error('[CharacterController] Failed to load character manifest:', err);
      }
    }
    loadManifest();
  }, []);

  const loadCharacter = useCallback(async (charFile: string) => {
    if (!groupRef.current || loadedCharFile.current === charFile) return;

    // Clean up previous model
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }
    actionsRef.current = {};
    prevAction.current = '';
    oneShotPlaying.current = null;
    groundOffsetsRef.current = {};

    if (modelRef.current) {
      groupRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    // Load new character FBX (encode URI for filenames with spaces)
    const loader = new FBXLoader();
    const charUrl = `/models/characters/${encodeURIComponent(charFile)}`;
    let fbx: THREE.Group;
    try {
      fbx = await loader.loadAsync(charUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[CharacterController] Failed to load "${charFile}":`, msg);
      // Surface error to UI
      if (msg.includes('version not supported')) {
        useWorldStore.getState().setCharacterError(
          `"${charFile.replace('.fbx', '')}" uses FBX 6.x format which isn't supported. Re-export from Mixamo as FBX Binary (7.4).`,
        );
      } else {
        useWorldStore.getState().setCharacterError(`Failed to load: ${msg}`);
      }
      loadedCharFile.current = ''; // Allow retry
      return;
    }

    fbx.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    // NOTE: Do NOT scale or add to scene yet.
    // Scale must be applied AFTER computing ground offsets because
    // FBXLoader computes skeleton boneInverses at the original scale.
    // Adding to scene last prevents a T-pose flash while anims load.

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

    // Set up mixer and load animations
    const mixer = new THREE.AnimationMixer(fbx);
    mixerRef.current = mixer;

    let entries: AnimEntry[];
    try {
      const res = await fetch('/models/anims/manifest.json');
      entries = (await res.json()).animations;
    } catch {
      console.error('[CharacterController] Failed to load animation manifest');
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
          // E.g., animation has "mixamorigHips" but character uses "mixamorig7Hips"
          if (charBonePrefix && charBonePrefix !== 'mixamorig') {
            for (const track of clip.tracks) {
              track.name = track.name.replace(/^mixamorig(?!\d)/, charBonePrefix);
            }
          } else if (!charBonePrefix) {
            // No mixamorig prefix found (non-Mixamo character); animation may not work
          }

          // Strip horizontal root motion from hip/root bone.
          for (const track of clip.tracks) {
            if (track.name.endsWith('.position')) {
              const boneName = track.name.split('.')[0];
              if (/Hips|Root/i.test(boneName)) {
                const values = track.values;
                for (let i = 0; i < values.length; i += 3) {
                  values[i] = 0;     // X
                  values[i + 2] = 0; // Z
                }
              }
            }
          }
          actions[entry.name] = mixer.clipAction(clip);
        }
      } catch (err) {
        console.warn(`[CharacterController] Skipping ${entry.file}:`, err);
      }
    }

    actionsRef.current = actions;

    // Compute per-animation ground offsets at original FBX scale.
    // Each animation positions the skeleton differently, so the lowest
    // vertex Y varies. We sample frame 0 of each animation to find
    // the correct ground offset for that pose.
    const groundOffsets: Record<string, number> = {};
    for (const [name, action] of Object.entries(actions)) {
      mixer.stopAllAction();
      action.reset().play();
      action.setEffectiveWeight(1);
      mixer.update(0);
      fbx.updateMatrixWorld(true);
      groundOffsets[name] = getSkinnedMinY(fbx);
    }
    groundOffsetsRef.current = groundOffsets;

    // Restart Idle for the initial pose
    mixer.stopAllAction();
    if (actions['Idle']) {
      const idle = actions['Idle'];
      idle.reset().play();
      idle.setEffectiveWeight(1);
      prevAction.current = 'Idle';
    }
    mixer.update(0);

    // Apply scale, ground offset, and add to scene in one go
    // so the user never sees T-pose or floating characters.
    const idleOffset = groundOffsets['Idle'] ?? 0;
    fbx.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
    fbx.position.y = -idleOffset * MODEL_SCALE;
    groupRef.current.add(fbx);
    modelRef.current = fbx;
    loadedCharFile.current = charFile;

    // Listen for one-shot animation finish
    mixer.addEventListener('finished', (e: { action: THREE.AnimationAction }) => {
      const name = e.action.getClip().name;
      if (name === oneShotPlaying.current) {
        oneShotPlaying.current = null;
        const locoAction = keys.current.size > 0 ? 'Run' : 'Idle';
        e.action.fadeOut(0.2);
        if (actions[locoAction]) {
          actions[locoAction].reset().fadeIn(0.2).play();
          prevAction.current = locoAction;
        }
        // Update ground offset for the return animation
        if (modelRef.current) {
          const offset = groundOffsetsRef.current[locoAction] ?? 0;
          modelRef.current.position.y = -offset * MODEL_SCALE;
        }
      }
    });
  }, []);

  // Load default character on mount, react to character selection changes
  const selectedCharacter = useWorldStore((s) => s.selectedCharacter);
  useEffect(() => {
    loadCharacter(selectedCharacter);
  }, [selectedCharacter, loadCharacter]);

  // Keyboard tracking + one-shot triggers
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current.add(key);

      if (!oneShotPlaying.current) {
        const actions = actionsRef.current;
        let oneShot: string | null = null;

        if (key === ' ' && actions['Jump']) {
          oneShot = 'Jump';
        } else if ((key === 'control' || key === 'meta') && actions['Slide']) {
          oneShot = 'Slide';
        }

        if (oneShot) {
          e.preventDefault();
          oneShotPlaying.current = oneShot;
          actions[prevAction.current]?.fadeOut(0.2);
          const action = actions[oneShot];
          action.reset().fadeIn(0.2).play();
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
          prevAction.current = oneShot;
          // Update ground offset for the one-shot animation
          if (modelRef.current) {
            const offset = groundOffsetsRef.current[oneShot] ?? 0;
            modelRef.current.position.y = -offset * MODEL_SCALE;
          }
        }
      }
    };
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Movement + animation per frame
  useFrame((_, delta) => {
    if (!groupRef.current || !mixerRef.current) return;

    const k = keys.current;
    const moveDir = new THREE.Vector3();

    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();
    const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

    if (k.has('w') || k.has('arrowup')) moveDir.add(camForward);
    if (k.has('s') || k.has('arrowdown')) moveDir.sub(camForward);
    if (k.has('a') || k.has('arrowleft')) moveDir.sub(camRight);
    if (k.has('d') || k.has('arrowright')) moveDir.add(camRight);

    const isMoving = moveDir.lengthSq() > 0.001;

    if (isMoving) {
      moveDir.normalize();
      groupRef.current.position.x += moveDir.x * MOVE_SPEED * delta;
      groupRef.current.position.z += moveDir.z * MOVE_SPEED * delta;

      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      const current = groupRef.current.rotation.y;
      let diff = targetAngle - current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      groupRef.current.rotation.y += diff * Math.min(1, ROTATION_SPEED * delta);
    }

    useWorldStore.getState().setPlayerPosition(
      groupRef.current.position.x,
      groupRef.current.position.z,
    );
    useWorldStore.getState().setMoving(isMoving);

    // Switch animation (skip if a one-shot like Jump/Slide is playing)
    if (!oneShotPlaying.current) {
      const actions = actionsRef.current;
      const wantedAction = isMoving ? 'Run' : 'Idle';
      if (wantedAction !== prevAction.current && actions[wantedAction]) {
        actions[prevAction.current]?.fadeOut(0.2);
        actions[wantedAction].reset().fadeIn(0.2).play();
        prevAction.current = wantedAction;
        // Update ground offset for the new animation
        if (modelRef.current) {
          const offset = groundOffsetsRef.current[wantedAction] ?? 0;
          modelRef.current.position.y = -offset * MODEL_SCALE;
        }
      }
    }

    mixerRef.current.update(delta);
  });

  return <group ref={groupRef} position={[0, 0, 0]} />;
}
