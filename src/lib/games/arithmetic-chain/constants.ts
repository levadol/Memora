import type { Difficulty } from "@/lib/storage/types";

export const TOTAL_ROUNDS = 10;
export const STARTING_CHAIN_LENGTH = 3;
export const MIN_CHAIN_LENGTH = 2;
export const MAX_CHAIN_LENGTH = 8;
export const FEEDBACK_DURATION_MS = 900;
export const READY_DURATION_MS = 600;

export const STEP_DISPLAY_MS: Record<Difficulty, number> = {
  easy: 2000,
  medium: 1500,
  hard: 1100,
};

export const STEP_DISPLAY_E2E_MS: Record<Difficulty, number> = {
  easy: 200,
  medium: 150,
  hard: 110,
};
