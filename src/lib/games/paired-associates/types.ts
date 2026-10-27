import type { Difficulty } from "@/lib/storage/types";

export type PAPhase =
  | "idle"
  | "tutorial"
  | "study"
  | "test"
  | "feedback"
  | "paused"
  | "result";

export interface PAPair {
  id: string;
  iconId: string;
  word: string;
}

export interface PATestTrial {
  pairId: string;
  iconId: string;
  correctWord: string;
  options: string[];
  answered: string | null;
  responseTimeMs: number | null;
  startedAt: number | null;
}

export interface PAState {
  phase: PAPhase;
  pairs: PAPair[];
  studyIndex: number;
  testTrials: PATestTrial[];
  testIndex: number;
  pairCount: number;
  round: number;
  correctRounds: number;
  consecutiveFailures: number;
  lastFeedbackCorrect: boolean | null;
  startedAt: number | null;
  finishedAt: number | null;
  difficulty: Difficulty;
  showTutorial: boolean;
  usedIconIds: string[];
  usedWords: string[];
}

export type PAAction =
  | {
      type: "START";
      words: string[];
      pairCount: number;
      difficulty: Difficulty;
      showTutorial: boolean;
      now: number;
    }
  | { type: "TUTORIAL_SKIP" }
  | { type: "STUDY_ADVANCE" }
  | { type: "STUDY_COMPLETE" }
  | { type: "SET_TEST_TRIALS"; trials: PATestTrial[] }
  | { type: "ANSWER"; word: string; now: number }
  | { type: "FEEDBACK_COMPLETE"; now: number }
  | { type: "ROUND_READY"; words: string[]; now: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | {
      type: "RESTART";
      words: string[];
      difficulty: Difficulty;
      showTutorial: boolean;
      now: number;
    }
  | { type: "QUIT" };
