import {
  TOTAL_BLOCKS,
  TOTAL_BLOCKS_SHORT,
  MIN_N,
  MAX_N,
  STARTING_N,
  HIT_RATE_UP,
  FA_RATE_UP,
  HIT_RATE_DOWN,
  FA_RATE_DOWN,
} from "./constants";
import type {
  NBackState,
  NBackAction,
  NBackTrial,
  NBackBlockResult,
  NBackMode,
} from "./types";
import type { Difficulty } from "@/lib/storage/types";

export function generateNBackSequence(
  n: number,
  totalTrials: number,
  targetRate: number,
  alphabet: (number | string)[],
  rng: () => number
): NBackTrial[] {
  const values: (number | string)[] = [];
  const isTargetArr: boolean[] = [];

  for (let i = 0; i < totalTrials; i++) {
    if (i < n) {
      let v: number | string;
      let attempts = 0;
      do {
        v = alphabet[Math.floor(rng() * alphabet.length)]!;
        attempts++;
      } while (i > 0 && values[i - 1] === v && attempts < 20);
      values.push(v);
      isTargetArr.push(false);
    } else {
      const shouldBeTarget = rng() < targetRate;
      if (shouldBeTarget) {
        values.push(values[i - n]!);
        isTargetArr.push(true);
      } else {
        const forbidden = values[i - n];
        let v: number | string;
        let attempts = 0;
        do {
          v = alphabet[Math.floor(rng() * alphabet.length)]!;
          attempts++;
        } while (v === forbidden && attempts < 20);
        values.push(v);
        isTargetArr.push(false);
      }
    }
  }

  return values.map((value, i) => ({
    value,
    isTarget: isTargetArr[i]!,
    responded: false,
  }));
}

function calcAccuracy(
  hits: number,
  misses: number,
  falseAlarms: number,
  correctRejections: number
): number {
  const total = hits + misses + falseAlarms + correctRejections;
  return total > 0 ? (hits + correctRejections) / total : 0;
}

function adjustN(
  n: number,
  hits: number,
  misses: number,
  falseAlarms: number,
  nonTargets: number
): number {
  const targets = hits + misses;
  const hitRate = targets > 0 ? hits / targets : 0;
  const faRate = nonTargets > 0 ? falseAlarms / nonTargets : 0;
  if (hitRate >= HIT_RATE_UP && faRate <= FA_RATE_UP) return Math.min(n + 1, MAX_N);
  if (hitRate < HIT_RATE_DOWN || faRate > FA_RATE_DOWN) return Math.max(n - 1, MIN_N);
  return n;
}

function makeInitialState(
  n: number,
  mode: NBackMode,
  difficulty: Difficulty,
  showTutorial: boolean,
  shortSession?: boolean
): NBackState {
  return {
    phase: showTutorial ? "tutorial" : "ready",
    n: STARTING_N[difficulty] ?? n,
    mode,
    sequence: [],
    currentIndex: -1,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    round: 0,
    totalRounds: shortSession ? TOTAL_BLOCKS_SHORT : TOTAL_BLOCKS,
    correctRounds: 0,
    maxN: STARTING_N[difficulty] ?? n,
    blockHistory: [],
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    difficulty,
    showTutorial,
    shortSession,
  };
}

const PAUSEABLE = new Set<NBackState["phase"]>(["ready", "stimulus", "feedback"]);

export function nBackReducer(
  state: NBackState,
  action: NBackAction
): NBackState {
  switch (action.type) {
    case "START":
      return makeInitialState(
        action.n,
        action.mode,
        action.difficulty,
        action.showTutorial,
        action.shortSession
      );

    case "TUTORIAL_SKIP":
      if (state.phase !== "tutorial") return state;
      return { ...state, phase: "ready" };

    case "READY_COMPLETE":
      if (state.phase !== "ready") return state;
      return {
        ...state,
        phase: "stimulus",
        sequence: action.sequence,
        currentIndex: -1,
        hits: 0,
        misses: 0,
        falseAlarms: 0,
        correctRejections: 0,
        startedAt: state.startedAt ?? action.now,
      };

    case "STIMULUS_ON": {
      if (state.phase !== "stimulus") return state;
      return { ...state, currentIndex: action.index };
    }

    case "STIMULUS_OFF": {
      if (state.phase !== "stimulus") return state;
      const trial = state.sequence[action.index];
      if (!trial) return state;
      const scorable = action.index >= state.n;
      let { hits, misses, falseAlarms, correctRejections } = state;
      if (scorable) {
        if (trial.isTarget && trial.responded) hits++;
        else if (trial.isTarget && !trial.responded) misses++;
        else if (!trial.isTarget && trial.responded) falseAlarms++;
        else correctRejections++;
      }
      return { ...state, hits, misses, falseAlarms, correctRejections };
    }

    case "BLOCK_COMPLETE": {
      if (state.phase !== "stimulus") return state;
      const { hits, misses, falseAlarms, correctRejections, n } = state;
      const nonTargets = falseAlarms + correctRejections;
      const accuracy = calcAccuracy(hits, misses, falseAlarms, correctRejections);
      const blockResult: NBackBlockResult = {
        n,
        hits,
        misses,
        falseAlarms,
        correctRejections,
        accuracy,
      };
      const newN = adjustN(n, hits, misses, falseAlarms, nonTargets);
      const isGoodBlock = accuracy >= 0.7;
      const newRound = state.round + 1;
      return {
        ...state,
        phase: "feedback",
        n: newN,
        maxN: Math.max(state.maxN, newN),
        round: newRound,
        correctRounds: state.correctRounds + (isGoodBlock ? 1 : 0),
        blockHistory: [...state.blockHistory, blockResult],
        lastFeedbackCorrect: isGoodBlock,
        currentIndex: -1,
      };
    }

    case "RESPOND": {
      if (state.phase !== "stimulus") return state;
      const idx = state.currentIndex;
      if (idx < 0) return state;
      const trial = state.sequence[idx];
      if (!trial || trial.responded) return state;
      return {
        ...state,
        sequence: state.sequence.map((t, i) =>
          i === idx ? { ...t, responded: true } : t
        ),
      };
    }

    case "FEEDBACK_COMPLETE": {
      if (state.phase !== "feedback") return state;
      if (state.round >= state.totalRounds) {
        return { ...state, phase: "result", finishedAt: action.now };
      }
      return {
        ...state,
        phase: "ready",
        sequence: [],
        currentIndex: -1,
        lastFeedbackCorrect: null,
      };
    }

    case "PAUSE":
      if (!PAUSEABLE.has(state.phase)) return state;
      return { ...state, phase: "paused" };

    case "RESUME":
      if (state.phase !== "paused") return state;
      return {
        ...state,
        phase: "ready",
        sequence: [],
        currentIndex: -1,
        lastFeedbackCorrect: null,
      };

    case "RESTART":
      return makeInitialState(
        action.n,
        action.mode,
        action.difficulty,
        action.showTutorial,
        action.shortSession
      );

    case "QUIT":
      return { ...state, phase: "idle" };

    default:
      return state;
  }
}
