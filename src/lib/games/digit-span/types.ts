import type { Difficulty } from "@/lib/storage/types";

export type DigitSpanMode = "forward" | "backward";

export type DigitSpanPhase =
  | "idle"
  | "tutorial"
  | "ready"
  | "preview"
  | "input"
  | "feedback"
  | "paused"
  | "result";

export interface DigitSpanState {
  phase: DigitSpanPhase;
  mode: DigitSpanMode;
  span: number;
  sequence: number[];
  userInput: number[];
  currentDigit: number | null;
  digitRevealStep: number;
  consecutiveFailures: number;
  round: number;
  correctRounds: number;
  maxSpan: number;
  startedAt: number | null;
  finishedAt: number | null;
  lastFeedbackCorrect: boolean | null;
  difficulty: Difficulty;
  showTutorial: boolean;
}

export type DigitSpanAction =
  | { type: "START"; difficulty: Difficulty; showTutorial: boolean; mode: DigitSpanMode }
  | { type: "TUTORIAL_SKIP" }
  | { type: "READY_COMPLETE"; sequence: number[] }
  | { type: "DIGIT_ON"; digit: number }
  | { type: "DIGIT_OFF" }
  | { type: "SEQUENCE_COMPLETE" }
  | { type: "TAP_DIGIT"; digit: number; now: number }
  | { type: "FEEDBACK_COMPLETE"; now: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESTART"; difficulty: Difficulty; showTutorial: boolean; mode: DigitSpanMode }
  | { type: "QUIT" };
