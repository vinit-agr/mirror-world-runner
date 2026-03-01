import { create } from 'zustand';

export type ModelMode = 'character' | 'obstacle';

export type ObstacleEntry = { name: string; file: string };

const OBSTACLE_MODELS: ObstacleEntry[] = [
  { name: 'Barrel', file: 'barrel.glb' },
  { name: 'Bin (Trash Can)', file: 'bin.glb' },
  { name: 'Cone', file: 'cone.glb' },
  { name: 'Fire Hydrant', file: 'hydrant.glb' },
  { name: 'Concrete Barrier', file: 'concrete-barrier.glb' },
  { name: 'Red Barrier', file: 'red-barrier.glb' },
  { name: 'Metal Barrier 1', file: 'metal-barrier1.glb' },
  { name: 'Metal Barrier 2', file: 'metal-barrier2.glb' },
  { name: 'Metal Barrier Damaged 1', file: 'metal-barrier-damaged1.glb' },
  { name: 'Metal Barrier Damaged 2', file: 'metal-barrier-damaged2.glb' },
  { name: 'Cardboard Box', file: 'cardboard-box.glb' },
  { name: 'Cardboard Box 2', file: 'cube-001.glb' },
  { name: 'Stop Sign', file: 'stop.glb' },
  { name: 'Warning Sign', file: 'warning.glb' },
  { name: 'Give Way Sign', file: 'give-way.glb' },
  { name: 'No Waiting Sign', file: 'no-waiting.glb' },
  { name: 'Trash Bag', file: 'trashbag.glb' },
  { name: 'Trash Bag 2', file: 'trashbag2.glb' },
  { name: 'Pole 1', file: 'pole-1.glb' },
  { name: 'Pole 2', file: 'pole-2.glb' },
];

type ModelTestState = {
  mode: ModelMode;
  setMode: (mode: ModelMode) => void;

  // Obstacle state
  obstacleModels: ObstacleEntry[];
  selectedObstacle: string;
  obstacleScale: number;
  obstacleRotationY: number;
  showBoundingBox: boolean;
  obstacleLoadError: string | null;
  setSelectedObstacle: (file: string) => void;
  setObstacleScale: (s: number) => void;
  setObstacleRotationY: (r: number) => void;
  setShowBoundingBox: (v: boolean) => void;
  setObstacleLoadError: (err: string | null) => void;
};

export const useModelTestStore = create<ModelTestState>((set) => ({
  mode: 'character',
  setMode: (mode) => set({ mode }),

  obstacleModels: OBSTACLE_MODELS,
  selectedObstacle: OBSTACLE_MODELS[0].file,
  obstacleScale: 1.0,
  obstacleRotationY: 0,
  showBoundingBox: true,
  obstacleLoadError: null,
  setSelectedObstacle: (file) => set({ selectedObstacle: file, obstacleLoadError: null }),
  setObstacleScale: (s) => set({ obstacleScale: s }),
  setObstacleRotationY: (r) => set({ obstacleRotationY: r }),
  setShowBoundingBox: (v) => set({ showBoundingBox: v }),
  setObstacleLoadError: (err) => set({ obstacleLoadError: err }),
}));
