import { RunnerCamera } from './RunnerCamera';
import { RunnerEnvironment } from './RunnerEnvironment';
import { RunnerPlayer } from './RunnerPlayer';
import { RunnerObstacles } from './RunnerObstacles';
import { useRunnerInput } from '../systems/RunnerInput';

export function RunnerScene() {
  useRunnerInput();

  return (
    <>
      <RunnerCamera />
      <RunnerEnvironment />
      <RunnerPlayer />
      <RunnerObstacles />
    </>
  );
}
