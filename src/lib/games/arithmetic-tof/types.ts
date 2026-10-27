import type { Difficulty } from "@/lib/storage/types";

export type TofPhase =
  | "idle"
  | "tutorial"
  | "ready"
  | "showing"
  | "feedback"
  | "paused"
  | "result";

export interface TofItem {
  text: string; // full equation displayed, e.g. "5 + 3 = 8"
  isTrue: boolean;
  correctAnswer: number;
  displayedAnswer: number;
}

export interface TofState {
  phase: TofPhase;
  difficulty: Difficulty;
  subLevel: number; // 0-2 — controls time limit only
  consecutiveCorrect: number;
  consecutiveWrong: number;
  items: TofItem[];
  currentIndex: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  responseTimes: number[];
  itemStartedAt: number | null;
  startedAt: number | null;
  finishedAt: number | null;
  lastFeedbackCorrect: boolean | null;
  showTutorial: boolean;
}

export type TofAction =
  | { type: "START"; difficulty: Difficulty; showTutorial: boolean; items: TofItem[] }
  | { type: "TUTORIAL_SKIP" }
  | { type: "READY_COMPLETE"; now: number }
  | { type: "ANSWER"; choice: boolean; now: number }
  | { type: "TIMEOUT"; now: number }
  | { type: "FEEDBACK_COMPLETE"; now: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESTART"; difficulty: Difficulty; showTutorial: boolean; items: TofItem[] }
  | { type: "QUIT" };
