import type { ChainState, ChainAction, ChainProblem } from "./types";
import type { Difficulty } from "@/lib/storage/types";
import {
  TOTAL_ROUNDS,
  STARTING_CHAIN_LENGTH,
  MIN_CHAIN_LENGTH,
  MAX_CHAIN_LENGTH,
} from "./constants";

function initialState(
  difficulty: Difficulty,
  showTutorial: boolean,
  problem: ChainProblem
): ChainState {
  return {
    phase: showTutorial ? "tutorial" : "ready",
    difficulty,
    chainLength: STARTING_CHAIN_LENGTH,
    maxChainLength: STARTING_CHAIN_LENGTH,
    consecutiveErrors: 0,
    round: 0,
    currentProblem: problem,
    typedInput: "",
    lastFeedbackCorrect: null,
    startedAt: null,
    finishedAt: null,
    roundResponseTimes: [],
    roundStartedAt: null,
    correctRounds: 0,
    showTutorial,
  };
}

export function chainReducer(state: ChainState, action: ChainAction): ChainState {
  switch (action.type) {
    case "START":
    case "RESTART":
      return initialState(action.difficulty, action.showTutorial, action.problem);

    case "TUTORIAL_SKIP":
      return { ...state, phase: "ready" };

    case "READY_COMPLETE":
      if (state.phase !== "ready") return state;
      return {
        ...state,
        phase: "showing",
        roundStartedAt: null,
        startedAt: state.startedAt ?? action.now,
      };

    case "CHAIN_COMPLETE":
      if (state.phase !== "showing") return state;
      return { ...state, phase: "input", roundStartedAt: action.now };

    case "KEY_INPUT":
      if (state.phase !== "input") return state;
      return { ...state, typedInput: state.typedInput + action.char };

    case "BACKSPACE":
      if (state.phase !== "input") return state;
      return { ...state, typedInput: state.typedInput.slice(0, -1) };

    case "SUBMIT_ANSWER": {
      if (state.phase !== "input" || !state.currentProblem) return state;
      const isCorrect = parseInt(state.typedInput) === state.currentProblem.answer;
      const responseTime = state.roundStartedAt != null
        ? action.now - state.roundStartedAt
        : 0;
      const newRound = state.round + 1;

      let newChainLength = state.chainLength;
      let newConsecutiveErrors = state.consecutiveErrors;
      const newRoundTimes = isCorrect
        ? [...state.roundResponseTimes, responseTime]
        : state.roundResponseTimes;

      if (isCorrect) {
        newChainLength = Math.min(state.chainLength + 1, MAX_CHAIN_LENGTH);
        newConsecutiveErrors = 0;
      } else {
        newConsecutiveErrors = state.consecutiveErrors + 1;
        if (newConsecutiveErrors >= 2) {
          newChainLength = Math.max(state.chainLength - 1, MIN_CHAIN_LENGTH);
          newConsecutiveErrors = 0;
        }
      }

      return {
        ...state,
        phase: "feedback",
        round: newRound,
        chainLength: newChainLength,
        maxChainLength: Math.max(state.maxChainLength, newChainLength),
        consecutiveErrors: newConsecutiveErrors,
        lastFeedbackCorrect: isCorrect,
        typedInput: "",
        roundResponseTimes: newRoundTimes,
        correctRounds: isCorrect ? state.correctRounds + 1 : state.correctRounds,
        currentProblem: action.nextProblem ?? state.currentProblem,
      };
    }

    case "FEEDBACK_COMPLETE": {
      if (state.phase !== "feedback") return state;
      if (state.round >= TOTAL_ROUNDS) {
        return {
          ...state,
          phase: "result",
          finishedAt: action.now,
        };
      }
      return {
        ...state,
        phase: "ready",
        currentProblem: action.nextProblem ?? state.currentProblem,
      };
    }

    case "PAUSE": {
      const pauseable: ChainState["phase"][] = ["ready", "showing", "input", "feedback"];
      if (!pauseable.includes(state.phase)) return state;
      return { ...state, phase: "paused" };
    }

    case "RESUME":
      if (state.phase !== "paused") return state;
      return {
        ...state,
        phase: "ready",
        currentProblem: action.problem,
        typedInput: "",
      };

    case "QUIT":
      return { ...state, phase: "idle" };

    default:
      return state;
  }
}
