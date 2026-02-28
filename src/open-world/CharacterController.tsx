import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useWorldStore } from './worldStore';

const MODEL_SCALE = 0.01;
const MOVE_SPEED = 6;
const ROTATION_SPEED = 10;

type AnimEntry = { name: string; file: string };

export function CharacterController() {
  const groupRef = useRef<THREE.Group>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const prevAction = useRef<string>('');
  const keys = useRef(new Set<string>());
  const [ready, setReady] = useState(false);

  const fbx = useFBX('/models/character.fbx');

  // Enable shadows
  useEffect(() => {
    fbx.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        (child as THREE.SkinnedMesh).castShadow = true;
        (child as THREE.SkinnedMesh).receiveShadow = true;
      }
    });
  }, [fbx]);

  // Load animations from manifest
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(fbx);
    mixerRef.current = mixer;

    async function loadAnims() {
      let entries: AnimEntry[];
      try {
        const res = await fetch('/models/anims/manifest.json');
        entries = (await res.json()).animations;
      } catch {
        console.error('[CharacterController] Failed to load manifest');
        return;
      }

      const loader = new FBXLoader();
      const actions: Record<string, THREE.AnimationAction> = {};

      for (const entry of entries) {
        try {
          const anim = await loader.loadAsync(`/models/anims/${entry.file}`);
          if (anim.animations.length > 0) {
            const clip = anim.animations[0];
            clip.name = entry.name;
            actions[entry.name] = mixer.clipAction(clip);
          }
        } catch (err) {
          console.warn(`[CharacterController] Skipping ${entry.file}:`, err);
        }
      }

      actionsRef.current = actions;

      // Start with Idle
      if (actions['Idle']) {
        actions['Idle'].reset().fadeIn(0.3).play();
        prevAction.current = 'Idle';
      }

      setReady(true);
    }

    loadAnims();
    return () => { mixer.stopAllAction(); };
  }, [fbx]);

  // Keyboard tracking
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const { camera } = useThree();

  // Movement + animation per frame
  useFrame((_, delta) => {
    if (!groupRef.current || !mixerRef.current) return;

    const k = keys.current;
    const moveDir = new THREE.Vector3();

    // Camera-relative movement
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

      // Rotate to face movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      const current = groupRef.current.rotation.y;
      let diff = targetAngle - current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      groupRef.current.rotation.y += diff * Math.min(1, ROTATION_SPEED * delta);
    }

    // Update world store
    useWorldStore.getState().setPlayerPosition(
      groupRef.current.position.x,
      groupRef.current.position.z,
    );
    useWorldStore.getState().setMoving(isMoving);

    // Switch animation
    const actions = actionsRef.current;
    const wantedAction = isMoving ? 'Run' : 'Idle';
    if (wantedAction !== prevAction.current && actions[wantedAction]) {
      actions[prevAction.current]?.fadeOut(0.2);
      actions[wantedAction].reset().fadeIn(0.2).play();
      prevAction.current = wantedAction;
    }

    mixerRef.current.update(delta);
  });

  // Suppress unused variable warning for ready; it is set to signal load completion
  void ready;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={fbx} scale={MODEL_SCALE} rotation={[0, Math.PI, 0]} />
    </group>
  );
}
