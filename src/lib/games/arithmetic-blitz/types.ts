import type { Difficulty } from "@/lib/storage/types";
import type { Problem, AdaptiveState } from "@/lib/arithmetic/generate";

export type BlitzPhase =
  | "idle"
  | "tutorial"
  | "ready"
  | "playing"
  | "paused"
  | "result";

export interface BlitzState {
  phase: BlitzPhase;
  difficulty: Difficulty;
  adaptive: AdaptiveState;
  currentProblem: Problem | null;
  prevProblemText: string | null;
  typedInput: string;
  timeRemainingSeconds: number;
  sessionDurationSeconds: number;
  correctCount: number;
  incorrectCount: number;
  responseTimes: number[];
  problemStartedAt: number | null;
  startedAt: number | null;
  finishedAt: number | null;
  lastFeedbackCorrect: boolean | null;
  showTutorial: boolean;
}

export type BlitzAction =
  | { type: "START"; difficulty: Difficulty; showTutorial: boolean; sessionDurationSeconds: number; problem: Problem }
  | { type: "TUTORIAL_SKIP" }
  | { type: "READY_COMPLETE"; now: number }
  | { type: "TICK" }
  | { type: "TIME_UP"; now: number }
  | { type: "KEY_INPUT"; char: string }
  | { type: "BACKSPACE" }
  | { type: "SUBMIT_ANSWER"; now: number; nextProblem: Problem }
  | { type: "CLEAR_FEEDBACK" }
  | { type: "PAUSE" }
  | { type: "RESUME"; problem: Problem }
  | { type: "RESTART"; difficulty: Difficulty; showTutorial: boolean; sessionDurationSeconds: number; problem: Problem }
  | { type: "QUIT" };
