import type { Difficulty } from "@/lib/storage/types";
import type { Op } from "@/lib/arithmetic/constants";

export type ChainPhase =
  | "idle"
  | "tutorial"
  | "ready"
  | "showing"
  | "input"
  | "feedback"
  | "paused"
  | "result";

export interface ChainStep {
  op: Op;
  operand: number;
  intermediate: number;
}

export interface ChainProblem {
  startingNumber: number;
  steps: ChainStep[];
  answer: number;
}

export interface ChainState {
  phase: ChainPhase;
  difficulty: Difficulty;
  chainLength: number;
  maxChainLength: number;
  consecutiveErrors: number;
  round: number;
  currentProblem: ChainProblem | null;
  typedInput: string;
  lastFeedbackCorrect: boolean | null;
  startedAt: number | null;
  finishedAt: number | null;
  roundResponseTimes: number[];
  roundStartedAt: number | null;
  correctRounds: number;
  showTutorial: boolean;
}

export type ChainAction =
  | { type: "START"; difficulty: Difficulty; showTutorial: boolean; problem: ChainProblem }
  | { type: "TUTORIAL_SKIP" }
  | { type: "READY_COMPLETE"; now: number }
  | { type: "CHAIN_COMPLETE"; now: number }
  | { type: "KEY_INPUT"; char: string }
  | { type: "BACKSPACE" }
  | { type: "SUBMIT_ANSWER"; now: number; nextProblem: ChainProblem | null }
  | { type: "FEEDBACK_COMPLETE"; now: number; nextProblem: ChainProblem | null }
  | { type: "PAUSE" }
  | { type: "RESUME"; problem: ChainProblem }
  | { type: "RESTART"; difficulty: Difficulty; showTutorial: boolean; problem: ChainProblem }
  | { type: "QUIT" };
