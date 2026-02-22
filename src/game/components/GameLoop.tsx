// Top-level game scene that wires everything together

import { Player } from './Player';
import { Obstacles } from './Obstacles';
import { Environment } from './Environment';
import { GameCamera } from './GameCamera';
import { PostFX } from './PostFX';
import { usePlayerInput } from '../systems/PlayerController';

export function GameLoop() {
  // Wire up input system
  usePlayerInput();

  return (
    <>
      <GameCamera />
      <Environment />
      <Player />
      <Obstacles />
      <PostFX />
    </>
  );
}
