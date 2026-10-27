import type { Difficulty } from "@/lib/storage/types";

export type PatternPhase =
  | "idle"
  | "tutorial"
  | "ready"
  | "preview"
  | "input"
  | "feedback"
  | "paused"
  | "result";

export interface PatternState {
  phase: PatternPhase;
  /** Index into LEVELS — determines both gridSize and cellCount. */
  level: number;
  /** Highest level index reached this session. */
  maxLevel: number;
  /** LEVELS[level].gridSize */
  gridSize: number;
  /** LEVELS[level].cellCount */
  cellCount: number;
  pattern: number[];
  /** Toggle-selectable cells during input phase. */
  userInput: number[];
  consecutiveFailures: number;
  round: number;
  correctRounds: number;
  startedAt: number | null;
  finishedAt: number | null;
  lastFeedbackCorrect: boolean | null;
  difficulty: Difficulty;
  showTutorial: boolean;
}

export type PatternAction =
  | { type: "START"; difficulty: Difficulty; showTutorial: boolean }
  | { type: "TUTORIAL_SKIP" }
  | { type: "READY_COMPLETE"; pattern: number[] }
  | { type: "PREVIEW_COMPLETE" }
  | { type: "TAP_CELL"; index: number; now: number }
  | { type: "FEEDBACK_COMPLETE"; now: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESTART"; difficulty: Difficulty; showTutorial: boolean }
  | { type: "QUIT" };
