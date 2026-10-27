import type { Difficulty } from "@/lib/storage/types";

export type CorsiPhase =
  | "idle"
  | "tutorial"
  | "ready"
  | "preview"
  | "input"
  | "feedback"
  | "paused"
  | "result";

export interface CorsiState {
  phase: CorsiPhase;
  span: number;
  sequence: number[];
  userInput: number[];
  consecutiveFailures: number;
  round: number;
  correctRounds: number;
  maxSpan: number;
  startedAt: number | null;
  finishedAt: number | null;
  lastFeedbackCorrect: boolean | null;
  activeBlockIndex: number | null;
  difficulty: Difficulty;
  showTutorial: boolean;
}

export type CorsiAction =
  | { type: "START"; difficulty: Difficulty; showTutorial: boolean }
  | { type: "TUTORIAL_SKIP" }
  | { type: "READY_COMPLETE"; sequence: number[] }
  | { type: "BLOCK_ON"; blockIndex: number }
  | { type: "BLOCK_OFF" }
  | { type: "SEQUENCE_COMPLETE" }
  | { type: "TAP_BLOCK"; blockIndex: number; now: number }
  | { type: "FEEDBACK_COMPLETE"; now: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESTART"; difficulty: Difficulty; showTutorial: boolean }
  | { type: "QUIT" };
