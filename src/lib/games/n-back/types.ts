import type { Difficulty } from "@/lib/storage/types";

export type NBackMode = "position" | "letter";

export type NBackPhase =
  | "idle"
  | "tutorial"
  | "ready"
  | "stimulus"
  | "feedback"
  | "paused"
  | "result";

export interface NBackTrial {
  value: number | string;
  isTarget: boolean;
  responded: boolean;
}

export interface NBackBlockResult {
  n: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  accuracy: number;
}

export interface NBackState {
  phase: NBackPhase;
  n: number;
  mode: NBackMode;
  sequence: NBackTrial[];
  currentIndex: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  round: number;
  totalRounds: number;
  correctRounds: number;
  maxN: number;
  blockHistory: NBackBlockResult[];
  startedAt: number | null;
  finishedAt: number | null;
  lastFeedbackCorrect: boolean | null;
  difficulty: Difficulty;
  showTutorial: boolean;
}

export type NBackAction =
  | {
      type: "START";
      n: number;
      mode: NBackMode;
      difficulty: Difficulty;
      showTutorial: boolean;
    }
  | { type: "TUTORIAL_SKIP" }
  | { type: "READY_COMPLETE"; sequence: NBackTrial[]; now: number }
  | { type: "STIMULUS_ON"; index: number }
  | { type: "STIMULUS_OFF"; index: number }
  | { type: "BLOCK_COMPLETE"; now: number }
  | { type: "RESPOND" }
  | { type: "FEEDBACK_COMPLETE"; now: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | {
      type: "RESTART";
      n: number;
      mode: NBackMode;
      difficulty: Difficulty;
      showTutorial: boolean;
    }
  | { type: "QUIT" };
