import { describe, it, expect } from "vitest";
import { generatePattern, patternReducer } from "@/lib/games/pattern-matrix/logic";
import {
  LEVELS,
  TOTAL_ROUNDS,
  STARTING_LEVEL,
} from "@/lib/games/pattern-matrix/constants";
import type { PatternState } from "@/lib/games/pattern-matrix/types";

// ── helpers ───────────────────────────────────────────────────────────────────

const NOW = 1000;
const START_LEVEL = STARTING_LEVEL.medium; // 4 → 4×4 grid, 4 cells
const { gridSize: START_GRID, cellCount: START_CELLS } = LEVELS[START_LEVEL]!;

function makeReady(overrides: Partial<PatternState> = {}): PatternState {
  return {
    phase: "ready",
    level: START_LEVEL,
    maxLevel: START_LEVEL,
    gridSize: START_GRID,
    cellCount: START_CELLS,
    pattern: [],
    userInput: [],
    consecutiveFailures: 0,
    round: 0,
    correctRounds: 0,
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    difficulty: "medium",
    showTutorial: false,
    ...overrides,
  };
}

function makeInput(pattern: number[], userInput: number[] = [], overrides: Partial<PatternState> = {}): PatternState {
  return makeReady({ phase: "input", pattern, userInput, startedAt: NOW, ...overrides });
}

/** Tap all cells in `cells` one by one, returning the final state. */
function tapAll(state: PatternState, cells: number[]): PatternState {
  return cells.reduce((s, idx) => patternReducer(s, { type: "TAP_CELL", index: idx, now: NOW }), state);
}

// ── generatePattern ───────────────────────────────────────────────────────────

describe("generatePattern", () => {
  it("returns `count` unique indices", () => {
    let call = 0;
    const cycleRng = () => (call++ % 16) / 16;
    const result = generatePattern(5, 16, cycleRng);
    expect(result).toHaveLength(5);
    expect(new Set(result).size).toBe(5);
  });

  it("all indices are in range [0, cellRange)", () => {
    for (let i = 0; i < 20; i++) {
      const result = generatePattern(6, 16, Math.random);
      result.forEach((idx) => {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(16);
      });
    }
  });

  it("respects smaller cellRange for 3×3 grid", () => {
    let call = 0;
    const result = generatePattern(3, 9, () => (call++ % 9) / 9);
    result.forEach((idx) => {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(9);
    });
  });

  it("handles count=1", () => {
    const result = generatePattern(1, 9, () => 0.5);
    expect(result).toHaveLength(1);
  });
});

// ── Level progression ─────────────────────────────────────────────────────────

describe("level progression", () => {
  it("success increments level and updates gridSize/cellCount accordingly", () => {
    const level = START_LEVEL; // 4 (4×4, 4 cells)
    const pattern = Array.from({ length: LEVELS[level]!.cellCount }, (_, i) => i);
    const s = tapAll(makeInput(pattern, [], { level, gridSize: LEVELS[level]!.gridSize, cellCount: LEVELS[level]!.cellCount }), pattern);
    expect(s.lastFeedbackCorrect).toBe(true);
    expect(s.level).toBe(level + 1);
    expect(s.gridSize).toBe(LEVELS[level + 1]!.gridSize);
    expect(s.cellCount).toBe(LEVELS[level + 1]!.cellCount);
  });

  it("success at max level stays at max level", () => {
    const maxLevel = LEVELS.length - 1;
    const { gridSize, cellCount } = LEVELS[maxLevel]!;
    const pattern = Array.from({ length: cellCount }, (_, i) => i);
    const s = tapAll(makeInput(pattern, [], { level: maxLevel, gridSize, cellCount }), pattern);
    expect(s.level).toBe(maxLevel);
  });

  it("single failure does NOT decrement level", () => {
    const level = START_LEVEL;
    const { gridSize, cellCount } = LEVELS[level]!;
    const pattern = Array.from({ length: cellCount }, (_, i) => i);
    const wrong = Array.from({ length: cellCount }, (_, i) => i + cellCount); // non-overlapping
    const s = tapAll(makeInput(pattern, [], { level, gridSize, cellCount, consecutiveFailures: 0 }), wrong);
    expect(s.lastFeedbackCorrect).toBe(false);
    expect(s.level).toBe(level); // no change after first failure
    expect(s.consecutiveFailures).toBe(1);
  });

  it("two consecutive failures decrement level and update gridSize/cellCount", () => {
    const level = START_LEVEL;
    const { gridSize, cellCount } = LEVELS[level]!;
    const pattern = Array.from({ length: cellCount }, (_, i) => i);
    const wrong = Array.from({ length: cellCount }, (_, i) => i + cellCount);
    // Pre-seed one failure
    const s = tapAll(
      makeInput(pattern, [], { level, gridSize, cellCount, consecutiveFailures: 1 }),
      wrong
    );
    expect(s.level).toBe(level - 1);
    expect(s.gridSize).toBe(LEVELS[level - 1]!.gridSize);
    expect(s.cellCount).toBe(LEVELS[level - 1]!.cellCount);
    expect(s.consecutiveFailures).toBe(2);
  });

  it("two consecutive failures at level 0 stay at level 0", () => {
    const { gridSize, cellCount } = LEVELS[0]!;
    const pattern = Array.from({ length: cellCount }, (_, i) => i);
    const wrong = Array.from({ length: cellCount }, (_, i) => i + cellCount);
    const s = tapAll(
      makeInput(pattern, [], { level: 0, gridSize, cellCount, consecutiveFailures: 1 }),
      wrong
    );
    expect(s.level).toBe(0);
  });

  it("success resets consecutiveFailures to 0", () => {
    const { gridSize, cellCount } = LEVELS[START_LEVEL]!;
    const pattern = Array.from({ length: cellCount }, (_, i) => i);
    const s = tapAll(makeInput(pattern, [], { level: START_LEVEL, gridSize, cellCount, consecutiveFailures: 1 }), pattern);
    expect(s.consecutiveFailures).toBe(0);
  });

  it("maxLevel tracks the highest level reached", () => {
    const level = START_LEVEL;
    const { gridSize, cellCount } = LEVELS[level]!;
    const pattern = Array.from({ length: cellCount }, (_, i) => i);
    const s = tapAll(
      makeInput(pattern, [], { level, gridSize, cellCount, maxLevel: level }),
      pattern
    );
    expect(s.maxLevel).toBeGreaterThanOrEqual(level);
  });

  it("grid size grows from 3×3 to 4×4 when ascending through the boundary", () => {
    // Level 3 is the last 3×3 level; advancing from it goes to level 4 (4×4)
    const level = 3;
    const { gridSize, cellCount } = LEVELS[level]!;
    expect(gridSize).toBe(3);
    const pattern = Array.from({ length: cellCount }, (_, i) => i);
    const s = tapAll(makeInput(pattern, [], { level, gridSize, cellCount }), pattern);
    expect(s.gridSize).toBe(4);
    expect(s.level).toBe(4);
  });

  it("grid size shrinks from 4×4 to 3×3 when descending through the boundary", () => {
    // Level 4 is the first 4×4 level; two failures go to level 3 (3×3)
    const level = 4;
    const { gridSize, cellCount } = LEVELS[level]!;
    expect(gridSize).toBe(4);
    const pattern = Array.from({ length: cellCount }, (_, i) => i);
    const wrong = Array.from({ length: cellCount }, (_, i) => i + cellCount);
    const s = tapAll(makeInput(pattern, [], { level, gridSize, cellCount, consecutiveFailures: 1 }), wrong);
    expect(s.gridSize).toBe(3);
    expect(s.level).toBe(3);
  });
});

// ── patternReducer — other actions ────────────────────────────────────────────

describe("patternReducer", () => {
  describe("START", () => {
    it("starts with tutorial phase when showTutorial=true", () => {
      const s = patternReducer(makeReady(), { type: "START", difficulty: "easy", showTutorial: true });
      expect(s.phase).toBe("tutorial");
    });

    it("starts with ready phase when showTutorial=false", () => {
      const s = patternReducer(makeReady(), { type: "START", difficulty: "medium", showTutorial: false });
      expect(s.phase).toBe("ready");
    });

    it("easy starts at level 0 (3×3 grid, 2 cells)", () => {
      const s = patternReducer(makeReady(), { type: "START", difficulty: "easy", showTutorial: false });
      expect(s.level).toBe(0);
      expect(s.gridSize).toBe(3);
      expect(s.cellCount).toBe(2);
    });

    it("hard starts at level 9 (5×5 grid)", () => {
      const s = patternReducer(makeReady(), { type: "START", difficulty: "hard", showTutorial: false });
      expect(s.level).toBe(9);
      expect(s.gridSize).toBe(5);
    });

    it("resets round and correctRounds to 0", () => {
      const dirty = makeInput([0, 1, 2, 3], [], { round: 5, correctRounds: 3 });
      const s = patternReducer(dirty, { type: "START", difficulty: "medium", showTutorial: false });
      expect(s.round).toBe(0);
      expect(s.correctRounds).toBe(0);
    });
  });

  describe("TUTORIAL_SKIP", () => {
    it("transitions tutorial → ready", () => {
      const s = patternReducer(makeReady({ phase: "tutorial" }), { type: "TUTORIAL_SKIP" });
      expect(s.phase).toBe("ready");
    });
  });

  describe("READY_COMPLETE", () => {
    it("stores pattern and transitions to preview", () => {
      const pattern = [0, 3, 7, 12, 15];
      const s = patternReducer(makeReady(), { type: "READY_COMPLETE", pattern });
      expect(s.phase).toBe("preview");
      expect(s.pattern).toEqual(pattern);
      expect(s.userInput).toEqual([]);
    });
  });

  describe("PREVIEW_COMPLETE", () => {
    it("transitions preview → input", () => {
      const s = patternReducer(makeReady({ phase: "preview" }), { type: "PREVIEW_COMPLETE" });
      expect(s.phase).toBe("input");
    });
  });

  describe("TAP_CELL", () => {
    it("ignores tap when phase is not input", () => {
      const s = patternReducer(makeReady({ phase: "preview" }), { type: "TAP_CELL", index: 0, now: NOW });
      expect(s.phase).toBe("preview");
    });

    it("adds cell to userInput when not selected", () => {
      const pattern = [0, 1, 2, 3];
      const s = patternReducer(makeInput(pattern), { type: "TAP_CELL", index: 0, now: NOW });
      expect(s.userInput).toContain(0);
      expect(s.phase).toBe("input"); // not yet auto-submitted (only 1 of 4)
    });

    it("removes cell from userInput when already selected (toggle)", () => {
      const pattern = [0, 1, 2, 3];
      const s = patternReducer(makeInput(pattern, [0]), { type: "TAP_CELL", index: 0, now: NOW });
      expect(s.userInput).not.toContain(0);
    });

    it("sets startedAt on first tap", () => {
      const pattern = [0, 1, 2, 3];
      const s = patternReducer(makeInput(pattern, [], { startedAt: null }), {
        type: "TAP_CELL", index: 0, now: 9999,
      });
      expect(s.startedAt).toBe(9999);
    });

    it("auto-submits correctly when userInput reaches pattern length", () => {
      const pattern = [0, 1, 2, 3];
      const s = tapAll(makeInput(pattern), pattern);
      expect(s.phase).toBe("feedback");
      expect(s.lastFeedbackCorrect).toBe(true);
      expect(s.correctRounds).toBe(1);
      expect(s.round).toBe(1);
    });

    it("auto-submits incorrectly on wrong selection", () => {
      const level = START_LEVEL;
      const { gridSize, cellCount } = LEVELS[level]!;
      const pattern = Array.from({ length: cellCount }, (_, i) => i);
      const wrong = Array.from({ length: cellCount }, (_, i) => i + cellCount);
      const s = tapAll(makeInput(pattern, [], { level, gridSize, cellCount }), wrong);
      expect(s.phase).toBe("feedback");
      expect(s.lastFeedbackCorrect).toBe(false);
    });
  });

  describe("FEEDBACK_COMPLETE", () => {
    it("transitions to result after TOTAL_ROUNDS rounds", () => {
      const s = patternReducer(makeReady({ phase: "feedback", round: TOTAL_ROUNDS }), {
        type: "FEEDBACK_COMPLETE", now: NOW,
      });
      expect(s.phase).toBe("result");
      expect(s.finishedAt).toBe(NOW);
    });

    it("transitions to ready before TOTAL_ROUNDS rounds", () => {
      const s = patternReducer(makeReady({ phase: "feedback", round: TOTAL_ROUNDS - 1 }), {
        type: "FEEDBACK_COMPLETE", now: NOW,
      });
      expect(s.phase).toBe("ready");
      expect(s.userInput).toEqual([]);
      expect(s.pattern).toEqual([]);
    });
  });

  describe("PAUSE / RESUME", () => {
    it("pauses from ready phase", () => {
      const s = patternReducer(makeReady({ phase: "ready" }), { type: "PAUSE" });
      expect(s.phase).toBe("paused");
    });

    it("pauses from preview phase", () => {
      const s = patternReducer(makeReady({ phase: "preview" }), { type: "PAUSE" });
      expect(s.phase).toBe("paused");
    });

    it("pauses from input phase", () => {
      const s = patternReducer(makeInput([0, 1, 2, 3]), { type: "PAUSE" });
      expect(s.phase).toBe("paused");
    });

    it("pauses from feedback phase", () => {
      const s = patternReducer(makeReady({ phase: "feedback" }), { type: "PAUSE" });
      expect(s.phase).toBe("paused");
    });

    it("ignores PAUSE from result phase", () => {
      const s = patternReducer(makeReady({ phase: "result" }), { type: "PAUSE" });
      expect(s.phase).toBe("result");
    });

    it("RESUME goes paused → ready (fresh stimulus on resume)", () => {
      const s = patternReducer(makeReady({ phase: "paused" }), { type: "RESUME" });
      expect(s.phase).toBe("ready");
    });

    it("ignores RESUME when not paused", () => {
      const s = patternReducer(makeInput([0, 1, 2, 3]), { type: "RESUME" });
      expect(s.phase).toBe("input");
    });
  });

  describe("QUIT", () => {
    it("transitions to idle (NOT result) so no session is saved", () => {
      const s = patternReducer(makeInput([0, 1, 2, 3]), { type: "QUIT" });
      expect(s.phase).toBe("idle");
    });
  });

  describe("RESTART", () => {
    it("resets state completely to starting level for given difficulty", () => {
      const dirty = makeInput([0, 1, 2, 3], [0], { round: 7, correctRounds: 4, level: 10 });
      const s = patternReducer(dirty, { type: "RESTART", difficulty: "easy", showTutorial: false });
      expect(s.phase).toBe("ready");
      expect(s.round).toBe(0);
      expect(s.correctRounds).toBe(0);
      expect(s.level).toBe(0); // easy starting level
      expect(s.gridSize).toBe(3); // easy = 3×3
      expect(s.cellCount).toBe(2);
    });
  });
});
