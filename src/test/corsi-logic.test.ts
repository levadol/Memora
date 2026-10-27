import { describe, it, expect } from "vitest";
import { generateSequence, corsiReducer } from "@/lib/games/corsi/logic";
import type { CorsiState } from "@/lib/games/corsi/types";
import { TOTAL_ROUNDS } from "@/lib/games/corsi/constants";

const baseState: CorsiState = {
  phase: "ready",
  span: 3,
  sequence: [],
  userInput: [],
  consecutiveFailures: 0,
  round: 0,
  correctRounds: 0,
  maxSpan: 3,
  startedAt: null,
  finishedAt: null,
  lastFeedbackCorrect: null,
  activeBlockIndex: null,
  difficulty: "medium",
  showTutorial: false,
};

// ── generateSequence ─────────────────────────────────────────────────────────

describe("generateSequence", () => {
  it("returns a sequence of the requested length", () => {
    const seq = generateSequence(5, Math.random);
    expect(seq).toHaveLength(5);
  });

  it("never has two identical consecutive elements", () => {
    for (let i = 0; i < 20; i++) {
      const seq = generateSequence(6, Math.random);
      for (let j = 1; j < seq.length; j++) {
        expect(seq[j]).not.toBe(seq[j - 1]);
      }
    }
  });

  it("all elements are valid block indices (0–8)", () => {
    const seq = generateSequence(9, Math.random);
    seq.forEach((idx) => {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(8);
    });
  });

  it("uses the supplied rng (deterministic with fixed seed)", () => {
    let call = 0;
    const values = [0.1, 0.6, 0.2, 0.7, 0.3];
    const fakeRng = () => values[call++ % values.length]!;
    const a = generateSequence(3, fakeRng);
    call = 0;
    const b = generateSequence(3, fakeRng);
    expect(a).toEqual(b);
  });

  it("never contains duplicate block indices across 1000 sequences", () => {
    let s = 42;
    const lcg = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
    for (let i = 0; i < 1000; i++) {
      for (let span = 2; span <= 9; span++) {
        const seq = generateSequence(span, lcg);
        expect(new Set(seq).size).toBe(seq.length);
      }
    }
  });
});

// ── corsiReducer ─────────────────────────────────────────────────────────────

describe("corsiReducer", () => {
  it("START transitions to ready (no tutorial)", () => {
    const next = corsiReducer(baseState, {
      type: "START",
      difficulty: "easy",
      showTutorial: false,
    });
    expect(next.phase).toBe("ready");
    expect(next.span).toBe(3); // STARTING_SPAN.easy
  });

  it("START transitions to tutorial when showTutorial=true", () => {
    const next = corsiReducer(baseState, {
      type: "START",
      difficulty: "medium",
      showTutorial: true,
    });
    expect(next.phase).toBe("tutorial");
  });

  it("READY_COMPLETE stores sequence and enters preview", () => {
    const state = { ...baseState, phase: "ready" as const };
    const next = corsiReducer(state, { type: "READY_COMPLETE", sequence: [0, 3, 7] });
    expect(next.phase).toBe("preview");
    expect(next.sequence).toEqual([0, 3, 7]);
  });

  it("SEQUENCE_COMPLETE enters input phase", () => {
    const state = { ...baseState, phase: "preview" as const, sequence: [1, 2] };
    const next = corsiReducer(state, { type: "SEQUENCE_COMPLETE" });
    expect(next.phase).toBe("input");
    expect(next.activeBlockIndex).toBeNull();
  });

  it("correct full sequence increments score and span", () => {
    const state: CorsiState = {
      ...baseState,
      phase: "input",
      sequence: [0, 1, 2],
      span: 3,
      correctRounds: 0,
    };
    let next = corsiReducer(state, { type: "TAP_BLOCK", blockIndex: 0, now: 1000 });
    next = corsiReducer(next, { type: "TAP_BLOCK", blockIndex: 1, now: 1100 });
    next = corsiReducer(next, { type: "TAP_BLOCK", blockIndex: 2, now: 1200 });
    expect(next.phase).toBe("feedback");
    expect(next.lastFeedbackCorrect).toBe(true);
    expect(next.correctRounds).toBe(1);
    expect(next.span).toBe(4);
  });

  it("incorrect tap enters feedback with correct=false", () => {
    const state: CorsiState = {
      ...baseState,
      phase: "input",
      sequence: [0, 1, 2],
      span: 3,
    };
    const next = corsiReducer(state, { type: "TAP_BLOCK", blockIndex: 5, now: 1000 });
    expect(next.phase).toBe("feedback");
    expect(next.lastFeedbackCorrect).toBe(false);
    expect(next.consecutiveFailures).toBe(1);
  });

  it("two consecutive failures reduce span", () => {
    let state: CorsiState = { ...baseState, phase: "input", sequence: [0, 1], span: 4 };
    // First wrong answer
    state = corsiReducer(state, { type: "TAP_BLOCK", blockIndex: 5, now: 100 });
    expect(state.consecutiveFailures).toBe(1);
    expect(state.span).toBe(4); // not yet reduced
    // Reset to input for next round
    state = corsiReducer(state, { type: "FEEDBACK_COMPLETE", now: 200 });
    state = corsiReducer(state, { type: "READY_COMPLETE", sequence: [2, 3] });
    state = corsiReducer(state, { type: "SEQUENCE_COMPLETE" });
    // Second wrong answer
    state = corsiReducer(state, { type: "TAP_BLOCK", blockIndex: 5, now: 300 });
    expect(state.consecutiveFailures).toBe(2);
    expect(state.span).toBe(3); // span decremented
  });

  it("FEEDBACK_COMPLETE after final round sets phase=result", () => {
    const state: CorsiState = {
      ...baseState,
      phase: "feedback",
      round: TOTAL_ROUNDS,
    };
    const next = corsiReducer(state, { type: "FEEDBACK_COMPLETE", now: 9999 });
    expect(next.phase).toBe("result");
    expect(next.finishedAt).toBe(9999);
  });

  it("PAUSE works in all active phases (ready, preview, input, feedback)", () => {
    expect(corsiReducer({ ...baseState, phase: "ready" }, { type: "PAUSE" }).phase).toBe("paused");
    expect(corsiReducer({ ...baseState, phase: "preview" }, { type: "PAUSE" }).phase).toBe("paused");
    expect(corsiReducer({ ...baseState, phase: "input" }, { type: "PAUSE" }).phase).toBe("paused");
    expect(corsiReducer({ ...baseState, phase: "feedback" }, { type: "PAUSE" }).phase).toBe("paused");
  });

  it("PAUSE is a no-op from idle, result, and paused", () => {
    expect(corsiReducer({ ...baseState, phase: "idle" }, { type: "PAUSE" }).phase).toBe("idle");
    expect(corsiReducer({ ...baseState, phase: "result" }, { type: "PAUSE" }).phase).toBe("result");
    expect(corsiReducer({ ...baseState, phase: "paused" }, { type: "PAUSE" }).phase).toBe("paused");
  });

  it("RESUME returns to ready from paused", () => {
    const state = { ...baseState, phase: "paused" as const };
    const next = corsiReducer(state, { type: "RESUME" });
    expect(next.phase).toBe("ready");
  });

  it("RESUME is a no-op from non-paused state", () => {
    const state = { ...baseState, phase: "input" as const };
    const next = corsiReducer(state, { type: "RESUME" });
    expect(next.phase).toBe("input");
  });

  it("RESTART resets game state", () => {
    const state: CorsiState = {
      ...baseState,
      phase: "result" as const,
      round: 10,
      correctRounds: 7,
      maxSpan: 7,
    };
    const next = corsiReducer(state, {
      type: "RESTART",
      difficulty: "hard",
      showTutorial: false,
    });
    expect(next.phase).toBe("ready");
    expect(next.round).toBe(0);
    expect(next.correctRounds).toBe(0);
  });

  it("TUTORIAL_SKIP transitions from tutorial to ready", () => {
    const state = { ...baseState, phase: "tutorial" as const };
    const next = corsiReducer(state, { type: "TUTORIAL_SKIP" });
    expect(next.phase).toBe("ready");
  });

  it("BLOCK_ON sets activeBlockIndex", () => {
    const state = { ...baseState, phase: "preview" as const };
    const next = corsiReducer(state, { type: "BLOCK_ON", blockIndex: 4 });
    expect(next.activeBlockIndex).toBe(4);
  });

  it("BLOCK_OFF clears activeBlockIndex", () => {
    const state = { ...baseState, phase: "preview" as const, activeBlockIndex: 4 };
    const next = corsiReducer(state, { type: "BLOCK_OFF" });
    expect(next.activeBlockIndex).toBeNull();
  });

  it("QUIT transitions to idle (so no session is recorded)", () => {
    const state = { ...baseState, phase: "input" as const };
    const next = corsiReducer(state, { type: "QUIT" });
    expect(next.phase).toBe("idle");
  });

  it("PAUSE during preview stops at paused; RESUME goes to ready (fresh sequence on next round)", () => {
    // Simulates: scheduler is running mid-sequence → user hits pause
    const state: CorsiState = {
      ...baseState,
      phase: "preview" as const,
      sequence: [1, 2, 3],
      activeBlockIndex: 1, // mid-sequence
    };

    const paused = corsiReducer(state, { type: "PAUSE" });
    expect(paused.phase).toBe("paused");
    // The PREVIEW useEffect cleanup calls scheduler.stop() — tested in scheduler.test.ts

    // RESUME goes to ready, not back to mid-preview
    const resumed = corsiReducer(paused, { type: "RESUME" });
    expect(resumed.phase).toBe("ready");
    // The READY useEffect will now generate a new sequence via READY_COMPLETE,
    // so the user sees a fresh sequence rather than resuming mid-flash.
  });
});
