import type { CorsiState, CorsiAction } from "./types";
import type { Difficulty } from "@/lib/storage/types";
import { STARTING_SPAN, MIN_SPAN, MAX_SPAN, BLOCK_COUNT, TOTAL_ROUNDS } from "./constants";

// Pure function — caller supplies the rng so the reducer stays free of Math.random.
// Fisher-Yates shuffle ensures no block index repeats anywhere in the sequence
// (standard Corsi task: 9 unique blocks, span ≤ BLOCK_COUNT).
export function generateSequence(span: number, rng: () => number): number[] {
  const indices = Array.from({ length: BLOCK_COUNT }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = tmp;
  }
  return indices.slice(0, span);
}

function initialState(difficulty: Difficulty, showTutorial: boolean): CorsiState {
  const span = STARTING_SPAN[difficulty] ?? STARTING_SPAN["medium"] ?? 4;
  return {
    phase: showTutorial ? "tutorial" : "ready",
    span,
    sequence: [],
    userInput: [],
    consecutiveFailures: 0,
    round: 0,
    correctRounds: 0,
    maxSpan: span,
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    activeBlockIndex: null,
    difficulty,
    showTutorial,
  };
}

export function corsiReducer(state: CorsiState, action: CorsiAction): CorsiState {
  switch (action.type) {
    case "START":
      return initialState(action.difficulty, action.showTutorial);

    case "RESTART":
      return initialState(action.difficulty, action.showTutorial);

    case "TUTORIAL_SKIP":
      return { ...state, phase: "ready" };

    case "READY_COMPLETE":
      return { ...state, phase: "preview", userInput: [], sequence: action.sequence };

    case "BLOCK_ON":
      return { ...state, activeBlockIndex: action.blockIndex };

    case "BLOCK_OFF":
      return { ...state, activeBlockIndex: null };

    case "SEQUENCE_COMPLETE":
      return { ...state, phase: "input", activeBlockIndex: null };

    case "TAP_BLOCK": {
      if (state.phase !== "input") return state;
      const newInput = [...state.userInput, action.blockIndex];
      const expected = state.sequence[newInput.length - 1];

      if (action.blockIndex !== expected) {
        const newFailures = state.consecutiveFailures + 1;
        const newSpan =
          newFailures >= 2 ? Math.max(MIN_SPAN, state.span - 1) : state.span;
        return {
          ...state,
          phase: "feedback",
          userInput: newInput,
          consecutiveFailures: newFailures,
          span: newSpan,
          lastFeedbackCorrect: false,
          round: state.round + 1,
          startedAt: state.startedAt ?? action.now,
        };
      }

      if (newInput.length < state.sequence.length) {
        return {
          ...state,
          userInput: newInput,
          startedAt: state.startedAt ?? action.now,
        };
      }

      const newSpan = Math.min(MAX_SPAN, state.span + 1);
      return {
        ...state,
        phase: "feedback",
        userInput: newInput,
        consecutiveFailures: 0,
        span: newSpan,
        maxSpan: Math.max(state.maxSpan, state.span),
        correctRounds: state.correctRounds + 1,
        lastFeedbackCorrect: true,
        round: state.round + 1,
        startedAt: state.startedAt ?? action.now,
      };
    }

    case "FEEDBACK_COMPLETE": {
      if (state.round >= TOTAL_ROUNDS) {
        return { ...state, phase: "result", finishedAt: action.now };
      }
      return { ...state, phase: "ready", userInput: [], sequence: [] };
    }

    case "PAUSE":
      return state.phase === "ready" ||
        state.phase === "preview" ||
        state.phase === "input" ||
        state.phase === "feedback"
        ? { ...state, phase: "paused" }
        : state;

    case "RESUME":
      return state.phase === "paused" ? { ...state, phase: "ready" } : state;

    case "QUIT":
      return { ...state, phase: "idle" };

    default:
      return state;
  }
}
