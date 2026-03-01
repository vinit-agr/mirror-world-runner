import { useEffect, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useRunnerStore } from '../core/RunnerState';
import { RUNNER } from '../config/RunnerConfig';
import { getSkinnedMinY } from '../../utils/skinnedBounds';
import { checkRunnerCollision } from '../systems/RunnerObstacleSystem';
import { PlayerDebugWireframe } from './RunnerObstacles';

const MODEL_SCALE = 0.01;

type AnimEntry = { name: string; file: string };

export function RunnerPlayer() {
  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const prevAction = useRef<string>('');
  const oneShotPlaying = useRef<string | null>(null);
  const loadedCharFile = useRef<string>('');
  const groundOffsetsRef = useRef<Record<string, number>>({});

  // Smooth lane position
  const currentX = useRef<number>(RUNNER.lanePositions[1]);
  // Jump arc
  const jumpT = useRef(0);
  // Track current player Y for collision/debug
  const playerY = useRef(0.5);

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

    const loader = new FBXLoader();
    const charUrl = `/models/characters/${encodeURIComponent(charFile)}`;
    let fbx: THREE.Group;
    try {
      fbx = await loader.loadAsync(charUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[RunnerPlayer] Failed to load "${charFile}":`, msg);
      if (msg.includes('version not supported')) {
        useRunnerStore.getState().setCharacterError(
          `"${charFile.replace('.fbx', '')}" uses FBX 6.x format which isn't supported. Re-export from Mixamo as FBX Binary (7.4).`,
        );
      } else {
        useRunnerStore.getState().setCharacterError(`Failed to load: ${msg}`);
      }
      loadedCharFile.current = '';
      return;
    }

    fbx.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    // Detect bone prefix (mixamorig, mixamorig7, etc.)
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
      console.error('[RunnerPlayer] Failed to load animation manifest');
      return;
    }

    const actions: Record<string, THREE.AnimationAction> = {};
    for (const entry of entries) {
      try {
        const anim = await loader.loadAsync(`/models/anims/${entry.file}`);
        if (anim.animations.length > 0) {
          const clip = anim.animations[0];
          clip.name = entry.name;

          // Remap bone names
          if (charBonePrefix && charBonePrefix !== 'mixamorig') {
            for (const track of clip.tracks) {
              track.name = track.name.replace(/^mixamorig(?!\d)/, charBonePrefix);
            }
          }

          // Strip horizontal root motion
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
        console.warn(`[RunnerPlayer] Skipping ${entry.file}:`, err);
      }
    }

    actionsRef.current = actions;

    // Compute per-animation ground offsets (same pattern as CharacterController)
    const GROUND_SAMPLES = 5;
    const groundOffsets: Record<string, number> = {};
    for (const [name, action] of Object.entries(actions)) {
      mixer.stopAllAction();
      action.reset().play();
      action.setEffectiveWeight(1);

      const duration = action.getClip().duration;
      let worst = Infinity;
      for (let s = 0; s <= GROUND_SAMPLES; s++) {
        mixer.setTime((s / GROUND_SAMPLES) * duration);
        fbx.updateMatrixWorld(true);
        const y = getSkinnedMinY(fbx);
        if (y < worst) worst = y;
      }
      groundOffsets[name] = worst === Infinity ? 0 : worst;
    }
    groundOffsetsRef.current = groundOffsets;

    // Start with Run animation (character is always running)
    mixer.stopAllAction();
    const startAnim = actions['Run'] ?? actions['Idle'];
    const startName = actions['Run'] ? 'Run' : 'Idle';
    if (startAnim) {
      startAnim.reset().play();
      startAnim.setEffectiveWeight(1);
      prevAction.current = startName;
    }
    mixer.update(0);

    // Apply scale + ground offset, add to scene
    const runOffset = groundOffsets[startName] ?? 0;
    fbx.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
    fbx.position.y = -runOffset * MODEL_SCALE;

    // Face forward (negative Z)
    fbx.rotation.y = Math.PI;

    groupRef.current.add(fbx);
    modelRef.current = fbx;
    loadedCharFile.current = charFile;

    // Handle one-shot animation finish
    mixer.addEventListener('finished', (e: { action: THREE.AnimationAction }) => {
      const name = e.action.getClip().name;
      if (name === oneShotPlaying.current) {
        oneShotPlaying.current = null;
        // Return to Run
        e.action.fadeOut(0.2);
        if (actions['Run']) {
          actions['Run'].reset().fadeIn(0.2).play();
          prevAction.current = 'Run';
        }
        // Update ground offset
        if (modelRef.current) {
          const offset = groundOffsetsRef.current['Run'] ?? 0;
          modelRef.current.position.y = -offset * MODEL_SCALE;
        }
      }
    });
  }, []);

  // Load character on selection change
  const selectedCharacter = useRunnerStore((s) => s.selectedCharacter);
  useEffect(() => {
    // Fetch character manifest
    fetch('/models/characters/manifest.json')
      .then((res) => res.json())
      .then((data) => {
        const chars = data.characters;
        // Use first available if selectedCharacter not found
        const found = chars.find((c: { file: string }) => c.file === selectedCharacter);
        if (!found && chars.length > 0) {
          useRunnerStore.getState().setSelectedCharacter(chars[0].file);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadCharacter(selectedCharacter);
  }, [selectedCharacter, loadCharacter]);

  useFrame((_, delta) => {
    if (!groupRef.current || !mixerRef.current) return;

    const state = useRunnerStore.getState();

    // Lane lerp
    const targetX = RUNNER.lanePositions[state.lane] ?? 0;
    currentX.current = MathUtils.lerp(currentX.current, targetX, Math.min(1, delta / RUNNER.laneSwitchDuration));
    groupRef.current.position.x = currentX.current;

    // Jump arc
    let jumpOffset = 0;
    if (state.isJumping) {
      jumpT.current = Math.min(jumpT.current + delta / RUNNER.jumpDuration, 1);
      jumpOffset = Math.sin(jumpT.current * Math.PI) * 2.0; // jump height in world units
    } else {
      jumpT.current = 0;
    }

    groupRef.current.position.y = jumpOffset;
    playerY.current = jumpOffset + 0.5; // approximate center Y for collision

    // Trigger one-shot animations
    const actions = actionsRef.current;
    if (!oneShotPlaying.current) {
      if (state.isJumping && actions['Jump'] && prevAction.current !== 'Jump') {
        oneShotPlaying.current = 'Jump';
        actions[prevAction.current]?.fadeOut(0.15);
        const action = actions['Jump'];
        action.reset().fadeIn(0.15).play();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        prevAction.current = 'Jump';
        if (modelRef.current) {
          const offset = groundOffsetsRef.current['Jump'] ?? 0;
          modelRef.current.position.y = -offset * MODEL_SCALE;
        }
      } else if (state.isSliding && actions['Slide'] && prevAction.current !== 'Slide') {
        oneShotPlaying.current = 'Slide';
        actions[prevAction.current]?.fadeOut(0.15);
        const action = actions['Slide'];
        action.reset().fadeIn(0.15).play();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        prevAction.current = 'Slide';
        if (modelRef.current) {
          const offset = groundOffsetsRef.current['Slide'] ?? 0;
          modelRef.current.position.y = -offset * MODEL_SCALE;
        }
      }
    }

    // Collision check
    const collisions = checkRunnerCollision(state.lane, playerY.current, state.isSliding);
    if (collisions > 0 && state.collisionCount === 0) {
      console.log(`[RunnerWorld] Collision detected! (${collisions} overlaps)`);
    }
    if (collisions !== state.collisionCount) {
      state.setCollisionCount(collisions);
    }

    mixerRef.current.update(delta);
  });

  return (
    <>
      <group ref={groupRef} position={[RUNNER.lanePositions[1], 0, 0]} />
      <PlayerDebugWireframe
        playerXRef={currentX}
        playerYRef={playerY}
      />
    </>
  );
}
