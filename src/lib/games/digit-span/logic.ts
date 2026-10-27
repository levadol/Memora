import type { DigitSpanState, DigitSpanAction, DigitSpanMode } from "./types";
import type { Difficulty } from "@/lib/storage/types";
import { STARTING_SPAN, MIN_SPAN, MAX_SPAN, TOTAL_ROUNDS } from "./constants";

// Pure function — caller supplies rng so the reducer stays free of Math.random.
// Generates `span` digits 0–9 with no two identical consecutive digits.
export function generateSequence(span: number, rng: () => number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < span; i++) {
    let d: number;
    do {
      d = Math.floor(rng() * 10);
    } while (i > 0 && seq[i - 1] === d);
    seq.push(d);
  }
  return seq;
}

function initialState(
  difficulty: Difficulty,
  showTutorial: boolean,
  mode: DigitSpanMode
): DigitSpanState {
  const span = STARTING_SPAN[difficulty] ?? STARTING_SPAN["medium"] ?? 4;
  return {
    phase: showTutorial ? "tutorial" : "ready",
    mode,
    span,
    sequence: [],
    userInput: [],
    currentDigit: null,
    digitRevealStep: 0,
    consecutiveFailures: 0,
    round: 0,
    correctRounds: 0,
    maxSpan: span,
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    difficulty,
    showTutorial,
  };
}

export function digitSpanReducer(
  state: DigitSpanState,
  action: DigitSpanAction
): DigitSpanState {
  switch (action.type) {
    case "START":
      return initialState(action.difficulty, action.showTutorial, action.mode);

    case "RESTART":
      return initialState(action.difficulty, action.showTutorial, action.mode);

    case "TUTORIAL_SKIP":
      return { ...state, phase: "ready" };

    case "READY_COMPLETE":
      return {
        ...state,
        phase: "preview",
        sequence: action.sequence,
        userInput: [],
        currentDigit: null,
      };

    case "DIGIT_ON":
      return { ...state, currentDigit: action.digit, digitRevealStep: state.digitRevealStep + 1 };

    case "DIGIT_OFF":
      return { ...state, currentDigit: null };

    case "SEQUENCE_COMPLETE":
      return { ...state, phase: "input", currentDigit: null };

    case "TAP_DIGIT": {
      if (state.phase !== "input") return state;
      const newInput = [...state.userInput, action.digit];
      const newStartedAt = state.startedAt ?? action.now;

      if (newInput.length < state.span) {
        return { ...state, userInput: newInput, startedAt: newStartedAt };
      }

      // Auto-submit when span digits entered
      const expected =
        state.mode === "backward"
          ? [...state.sequence].reverse()
          : state.sequence;
      const correct = expected.every((d, i) => d === newInput[i]);

      const newFailures = correct ? 0 : state.consecutiveFailures + 1;
      const newSpan = correct
        ? Math.min(MAX_SPAN, state.span + 1)
        : newFailures >= 2
          ? Math.max(MIN_SPAN, state.span - 1)
          : state.span;

      return {
        ...state,
        phase: "feedback",
        userInput: newInput,
        consecutiveFailures: newFailures,
        span: newSpan,
        maxSpan: correct ? Math.max(state.maxSpan, state.span) : state.maxSpan,
        correctRounds: correct ? state.correctRounds + 1 : state.correctRounds,
        lastFeedbackCorrect: correct,
        round: state.round + 1,
        startedAt: newStartedAt,
      };
    }

    case "FEEDBACK_COMPLETE":
      if (state.round >= TOTAL_ROUNDS) {
        return { ...state, phase: "result", finishedAt: action.now };
      }
      return { ...state, phase: "ready", sequence: [], userInput: [] };

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
