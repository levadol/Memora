import type { PatternState, PatternAction } from "./types";
import type { Difficulty } from "@/lib/storage/types";
import { LEVELS, STARTING_LEVEL, TOTAL_ROUNDS } from "./constants";

/**
 * Returns `count` unique random cell indices within [0, cellRange).
 * Pure: caller supplies the rng so the reducer stays free of Math.random.
 */
export function generatePattern(count: number, cellRange: number, rng: () => number): number[] {
  const cells: number[] = [];
  while (cells.length < count) {
    const next = Math.floor(rng() * cellRange);
    if (!cells.includes(next)) cells.push(next);
  }
  return cells;
}

function initialState(difficulty: Difficulty, showTutorial: boolean): PatternState {
  const level = STARTING_LEVEL[difficulty] ?? STARTING_LEVEL.medium;
  const { gridSize, cellCount } = LEVELS[level]!;
  return {
    phase: showTutorial ? "tutorial" : "ready",
    level,
    maxLevel: level,
    gridSize,
    cellCount,
    pattern: [],
    userInput: [],
    consecutiveFailures: 0,
    round: 0,
    correctRounds: 0,
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    difficulty,
    showTutorial,
  };
}

export function patternReducer(state: PatternState, action: PatternAction): PatternState {
  switch (action.type) {
    case "START":
      return initialState(action.difficulty, action.showTutorial);

    case "RESTART":
      return initialState(action.difficulty, action.showTutorial);

    case "TUTORIAL_SKIP":
      return { ...state, phase: "ready" };

    case "READY_COMPLETE":
      return { ...state, phase: "preview", userInput: [], pattern: action.pattern };

    case "PREVIEW_COMPLETE":
      return { ...state, phase: "input" };

    case "TAP_CELL": {
      if (state.phase !== "input") return state;
      const alreadySelected = state.userInput.includes(action.index);
      const newInput = alreadySelected
        ? state.userInput.filter((i) => i !== action.index)
        : [...state.userInput, action.index];

      const newStartedAt = state.startedAt ?? action.now;

      if (newInput.length !== state.pattern.length) {
        return { ...state, userInput: newInput, startedAt: newStartedAt };
      }

      // Auto-submit: user selected exactly cellCount cells
      const correct = state.pattern.every((cell) => newInput.includes(cell));
      const newFailures = correct ? 0 : state.consecutiveFailures + 1;

      // Level progression: +1 on success, -1 after two consecutive failures
      const newLevel = correct
        ? Math.min(LEVELS.length - 1, state.level + 1)
        : newFailures >= 2
          ? Math.max(0, state.level - 1)
          : state.level;

      const { gridSize: newGridSize, cellCount: newCellCount } = LEVELS[newLevel]!;

      return {
        ...state,
        phase: "feedback",
        userInput: newInput,
        consecutiveFailures: newFailures,
        level: newLevel,
        maxLevel: Math.max(state.maxLevel, correct ? state.level : state.maxLevel),
        gridSize: newGridSize,
        cellCount: newCellCount,
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
      return { ...state, phase: "ready", userInput: [], pattern: [] };

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
