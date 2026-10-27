import type { BlitzState, BlitzAction } from "./types";
import type { Difficulty } from "@/lib/storage/types";
import { initialAdaptiveState, nextAdaptiveState } from "@/lib/arithmetic/generate";

function initialState(
  difficulty: Difficulty,
  showTutorial: boolean,
  sessionDurationSeconds: number,
  problem: import("@/lib/arithmetic/generate").Problem
): BlitzState {
  return {
    phase: showTutorial ? "tutorial" : "ready",
    difficulty,
    adaptive: initialAdaptiveState(difficulty),
    currentProblem: problem,
    prevProblemText: null,
    typedInput: "",
    timeRemainingSeconds: sessionDurationSeconds,
    sessionDurationSeconds,
    correctCount: 0,
    incorrectCount: 0,
    responseTimes: [],
    problemStartedAt: null,
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    showTutorial,
  };
}

export function blitzReducer(state: BlitzState, action: BlitzAction): BlitzState {
  switch (action.type) {
    case "START":
      return initialState(action.difficulty, action.showTutorial, action.sessionDurationSeconds, action.problem);

    case "RESTART":
      return initialState(action.difficulty, action.showTutorial, action.sessionDurationSeconds, action.problem);

    case "TUTORIAL_SKIP":
      return { ...state, phase: "ready" };

    case "READY_COMPLETE":
      if (state.phase !== "ready") return state;
      return {
        ...state,
        phase: "playing",
        startedAt: state.startedAt ?? action.now,
        problemStartedAt: action.now,
      };

    case "TICK":
      if (state.phase !== "playing") return state;
      return { ...state, timeRemainingSeconds: state.timeRemainingSeconds - 1 };

    case "TIME_UP":
      if (state.phase !== "playing") return state;
      return { ...state, phase: "result", finishedAt: action.now };

    case "KEY_INPUT":
      if (state.phase !== "playing") return state;
      return { ...state, typedInput: state.typedInput + action.char };

    case "BACKSPACE":
      if (state.phase !== "playing") return state;
      return { ...state, typedInput: state.typedInput.slice(0, -1) };

    case "SUBMIT_ANSWER": {
      if (state.phase !== "playing" || !state.currentProblem) return state;
      const parsed = parseInt(state.typedInput, 10);
      const wasCorrect = !isNaN(parsed) && parsed === state.currentProblem.answer;
      const responseTime = state.problemStartedAt != null ? action.now - state.problemStartedAt : 0;
      const newAdaptive = nextAdaptiveState(state.adaptive, wasCorrect);
      return {
        ...state,
        correctCount: wasCorrect ? state.correctCount + 1 : state.correctCount,
        incorrectCount: wasCorrect ? state.incorrectCount : state.incorrectCount + 1,
        responseTimes: wasCorrect
          ? [...state.responseTimes, responseTime]
          : state.responseTimes,
        adaptive: newAdaptive,
        currentProblem: action.nextProblem,
        prevProblemText: state.currentProblem.text,
        typedInput: "",
        problemStartedAt: action.now,
        lastFeedbackCorrect: wasCorrect,
      };
    }

    case "CLEAR_FEEDBACK":
      return { ...state, lastFeedbackCorrect: null };

    case "PAUSE":
      if (state.phase === "ready" || state.phase === "playing") {
        return { ...state, phase: "paused" };
      }
      return state;

    case "RESUME":
      if (state.phase !== "paused") return state;
      return {
        ...state,
        phase: "ready",
        currentProblem: action.problem,
        typedInput: "",
        lastFeedbackCorrect: null,
      };

    case "QUIT":
      return { ...state, phase: "idle" };

    default:
      return state;
  }
}
