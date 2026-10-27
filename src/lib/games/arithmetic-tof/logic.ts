import type { TofState, TofAction, TofPhase } from "./types";
import type { Difficulty } from "@/lib/storage/types";
import {
  TOTAL_ITEMS,
  CONSECUTIVE_CORRECT_ADVANCE,
  CONSECUTIVE_WRONG_RETREAT,
} from "./constants";
import type { TofItem } from "./types";

function initialState(
  difficulty: Difficulty,
  showTutorial: boolean,
  items: TofItem[]
): TofState {
  return {
    phase: showTutorial ? "tutorial" : "ready",
    difficulty,
    subLevel: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    items,
    currentIndex: 0,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    responseTimes: [],
    itemStartedAt: null,
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    showTutorial,
  };
}

function adaptSubLevel(
  subLevel: number,
  consecutiveCorrect: number,
  consecutiveWrong: number,
  isCorrect: boolean
): { subLevel: number; consecutiveCorrect: number; consecutiveWrong: number } {
  if (isCorrect) {
    const cc = consecutiveCorrect + 1;
    if (cc >= CONSECUTIVE_CORRECT_ADVANCE) {
      return { subLevel: Math.min(subLevel + 1, 2), consecutiveCorrect: 0, consecutiveWrong: 0 };
    }
    return { subLevel, consecutiveCorrect: cc, consecutiveWrong: 0 };
  } else {
    const cw = consecutiveWrong + 1;
    if (cw >= CONSECUTIVE_WRONG_RETREAT) {
      return { subLevel: Math.max(subLevel - 1, 0), consecutiveCorrect: 0, consecutiveWrong: 0 };
    }
    return { subLevel, consecutiveCorrect: 0, consecutiveWrong: cw };
  }
}

export function tofReducer(state: TofState, action: TofAction): TofState {
  switch (action.type) {
    case "START":
    case "RESTART":
      return initialState(action.difficulty, action.showTutorial, action.items);

    case "TUTORIAL_SKIP":
      return { ...state, phase: "ready" };

    case "READY_COMPLETE":
      if (state.phase !== "ready") return state;
      return {
        ...state,
        phase: "showing",
        itemStartedAt: action.now,
        startedAt: state.startedAt ?? action.now,
      };

    case "ANSWER": {
      if (state.phase !== "showing") return state;
      const item = state.items[state.currentIndex];
      if (!item) return state;

      const rt = state.itemStartedAt != null ? action.now - state.itemStartedAt : 0;
      const userSaysTrue = action.choice;
      const isCorrect = userSaysTrue === item.isTrue;

      let { hits, misses, falseAlarms, correctRejections } = state;
      if (userSaysTrue && item.isTrue) hits++;
      else if (!userSaysTrue && item.isTrue) misses++;
      else if (userSaysTrue && !item.isTrue) falseAlarms++;
      else correctRejections++;

      const adapted = adaptSubLevel(
        state.subLevel,
        state.consecutiveCorrect,
        state.consecutiveWrong,
        isCorrect
      );

      return {
        ...state,
        phase: "feedback",
        hits,
        misses,
        falseAlarms,
        correctRejections,
        responseTimes: [...state.responseTimes, rt],
        lastFeedbackCorrect: isCorrect,
        subLevel: adapted.subLevel,
        consecutiveCorrect: adapted.consecutiveCorrect,
        consecutiveWrong: adapted.consecutiveWrong,
        itemStartedAt: null,
      };
    }

    case "TIMEOUT": {
      if (state.phase !== "showing") return state;
      const item = state.items[state.currentIndex];
      if (!item) return state;

      // timeout on TRUE item → miss; timeout on FALSE item → false alarm
      let { misses, falseAlarms } = state;
      if (item.isTrue) misses++;
      else falseAlarms++;

      const adapted = adaptSubLevel(
        state.subLevel,
        state.consecutiveCorrect,
        state.consecutiveWrong,
        false
      );

      return {
        ...state,
        phase: "feedback",
        misses,
        falseAlarms,
        lastFeedbackCorrect: false,
        subLevel: adapted.subLevel,
        consecutiveCorrect: adapted.consecutiveCorrect,
        consecutiveWrong: adapted.consecutiveWrong,
        itemStartedAt: null,
      };
    }

    case "FEEDBACK_COMPLETE": {
      if (state.phase !== "feedback") return state;
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= TOTAL_ITEMS) {
        return { ...state, phase: "result", finishedAt: action.now };
      }
      return { ...state, phase: "ready", currentIndex: nextIndex };
    }

    case "PAUSE": {
      const pauseable: TofPhase[] = ["ready", "showing", "feedback"];
      if (!pauseable.includes(state.phase)) return state;
      return { ...state, phase: "paused" };
    }

    case "RESUME":
      if (state.phase !== "paused") return state;
      return { ...state, phase: "ready", itemStartedAt: null };

    case "QUIT":
      return { ...state, phase: "idle" };

    default:
      return state;
  }
}
