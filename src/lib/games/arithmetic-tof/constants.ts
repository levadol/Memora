import type { Difficulty } from "@/lib/storage/types";

export const TOTAL_ITEMS = 30;
export const TRUE_ITEMS = 15;
export const FALSE_ITEMS = 15;
export const FEEDBACK_DURATION_MS = 700;
export const READY_DURATION_MS = 600;
export const FEEDBACK_DURATION_E2E_MS = 100;
export const READY_DURATION_E2E_MS = 100;

// Per-item time limits
export const BASE_TIME_LIMIT_MS: Record<Difficulty, number> = {
  easy: 5000,
  medium: 4000,
  hard: 3000,
};
export const TIME_LIMIT_STEP_MS = 500;
export const TIME_LIMIT_MIN_MS = 1500;
export const TIME_LIMIT_E2E_MS = 300;

// Adaptive thresholds (same as blitz/chain pattern)
export const CONSECUTIVE_CORRECT_ADVANCE = 3;
export const CONSECUTIVE_WRONG_RETREAT = 2;

export function itemTimeLimitMs(
  difficulty: Difficulty,
  subLevel: number,
  isE2E: boolean
): number {
  if (isE2E) return TIME_LIMIT_E2E_MS;
  return Math.max(
    BASE_TIME_LIMIT_MS[difficulty] - subLevel * TIME_LIMIT_STEP_MS,
    TIME_LIMIT_MIN_MS
  );
}
