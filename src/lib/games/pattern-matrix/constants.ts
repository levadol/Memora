import type { Difficulty } from "@/lib/storage/types";

export const MIN_GRID_SIZE = 3;
export const MAX_GRID_SIZE = 5;
export const TOTAL_ROUNDS = 10;

/** Base preview display time (ms). */
export const PREVIEW_BASE_MS = 1500;
/** Additional ms per cell in the pattern. */
export const PREVIEW_PER_CELL_MS = 200;

/**
 * Linear level table — both grid size and cell count grow with the player's level.
 * On success: level + 1. On two consecutive failures: level - 1. Clamped to [0, len-1].
 */
export const LEVELS: ReadonlyArray<{ gridSize: number; cellCount: number }> = [
  { gridSize: 3, cellCount: 2 },  // 0
  { gridSize: 3, cellCount: 3 },  // 1
  { gridSize: 3, cellCount: 4 },  // 2
  { gridSize: 3, cellCount: 5 },  // 3
  { gridSize: 4, cellCount: 4 },  // 4
  { gridSize: 4, cellCount: 5 },  // 5
  { gridSize: 4, cellCount: 6 },  // 6
  { gridSize: 4, cellCount: 7 },  // 7
  { gridSize: 4, cellCount: 8 },  // 8
  { gridSize: 5, cellCount: 5 },  // 9
  { gridSize: 5, cellCount: 6 },  // 10
  { gridSize: 5, cellCount: 7 },  // 11
  { gridSize: 5, cellCount: 8 },  // 12
  { gridSize: 5, cellCount: 9 },  // 13
  { gridSize: 5, cellCount: 10 }, // 14
  { gridSize: 5, cellCount: 11 }, // 15
  { gridSize: 5, cellCount: 12 }, // 16
] as const;

/** Starting level index per difficulty. */
export const STARTING_LEVEL: Record<Difficulty, number> = {
  easy: 0,   // 3×3, 2 cells
  medium: 4, // 4×4, 4 cells
  hard: 9,   // 5×5, 5 cells
};
