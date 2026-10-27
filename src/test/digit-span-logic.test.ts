import { describe, it, expect } from "vitest";
import { generateSequence, digitSpanReducer } from "@/lib/games/digit-span/logic";
import type { DigitSpanState } from "@/lib/games/digit-span/types";
import { TOTAL_ROUNDS } from "@/lib/games/digit-span/constants";

// ── helpers ───────────────────────────────────────────────────────────────────

const NOW = 1000;

const baseState: DigitSpanState = {
  phase: "ready",
  mode: "forward",
  span: 4,
  sequence: [],
  userInput: [],
  currentDigit: null,
  consecutiveFailures: 0,
  round: 0,
  correctRounds: 0,
  maxSpan: 4,
  startedAt: null,
  finishedAt: null,
  lastFeedbackCorrect: null,
  difficulty: "medium",
  showTutorial: false,
};

function makeInput(
  sequence: number[],
  userInput: number[] = [],
  overrides: Partial<DigitSpanState> = {}
): DigitSpanState {
  return {
    ...baseState,
    phase: "input",
    sequence,
    userInput,
    span: sequence.length,
    startedAt: NOW,
    ...overrides,
  };
}

function tapAll(state: DigitSpanState, digits: number[]): DigitSpanState {
  return digits.reduce(
    (s, d) => digitSpanReducer(s, { type: "TAP_DIGIT", digit: d, now: NOW }),
    state
  );
}

// ── generateSequence ─────────────────────────────────────────────────────────

describe("generateSequence", () => {
  it("returns a sequence of the requested length", () => {
    expect(generateSequence(5, Math.random)).toHaveLength(5);
  });

  it("all elements are digits 0–9", () => {
    for (let i = 0; i < 20; i++) {
      const seq = generateSequence(9, Math.random);
      seq.forEach((d) => {
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(9);
      });
    }
  });

  it("never has two identical consecutive elements", () => {
    for (let i = 0; i < 50; i++) {
      const seq = generateSequence(9, Math.random);
      for (let j = 1; j < seq.length; j++) {
        expect(seq[j]).not.toBe(seq[j - 1]);
      }
    }
  });

  it("is deterministic with a fixed rng", () => {
    let call = 0;
    const values = [0.1, 0.6, 0.2, 0.7, 0.3, 0.8, 0.15, 0.55, 0.25];
    const fakeRng = () => values[call++ % values.length]!;
    const a = generateSequence(4, fakeRng);
    call = 0;
    const b = generateSequence(4, fakeRng);
    expect(a).toEqual(b);
  });

  it("never has back-to-back duplicates across 1000 sequences of various lengths", () => {
    let s = 7;
    const lcg = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };
    for (let i = 0; i < 1000; i++) {
      for (let span = 2; span <= 9; span++) {
        const seq = generateSequence(span, lcg);
        for (let j = 1; j < seq.length; j++) {
          expect(seq[j]).not.toBe(seq[j - 1]);
        }
      }
    }
  });
});

// ── digitSpanReducer ─────────────────────────────────────────────────────────

describe("digitSpanReducer", () => {
  describe("START", () => {
    it("transitions to ready when showTutorial=false", () => {
      const s = digitSpanReducer(baseState, {
        type: "START",
        difficulty: "medium",
        showTutorial: false,
        mode: "forward",
      });
      expect(s.phase).toBe("ready");
    });

    it("transitions to tutorial when showTutorial=true", () => {
      const s = digitSpanReducer(baseState, {
        type: "START",
        difficulty: "medium",
        showTutorial: true,
        mode: "forward",
      });
      expect(s.phase).toBe("tutorial");
    });

    it("easy starts at span 2", () => {
      const s = digitSpanReducer(baseState, {
        type: "START",
        difficulty: "easy",
        showTutorial: false,
        mode: "forward",
      });
      expect(s.span).toBe(2);
    });

    it("hard starts at span 6", () => {
      const s = digitSpanReducer(baseState, {
        type: "START",
        difficulty: "hard",
        showTutorial: false,
        mode: "forward",
      });
      expect(s.span).toBe(6);
    });

    it("resets round and correctRounds to 0", () => {
      const dirty = { ...baseState, round: 5, correctRounds: 3 };
      const s = digitSpanReducer(dirty, {
        type: "START",
        difficulty: "medium",
        showTutorial: false,
        mode: "forward",
      });
      expect(s.round).toBe(0);
      expect(s.correctRounds).toBe(0);
    });

    it("stores the mode", () => {
      const s = digitSpanReducer(baseState, {
        type: "START",
        difficulty: "medium",
        showTutorial: false,
        mode: "backward",
      });
      expect(s.mode).toBe("backward");
    });
  });

  describe("TUTORIAL_SKIP", () => {
    it("transitions tutorial → ready", () => {
      const s = digitSpanReducer({ ...baseState, phase: "tutorial" }, { type: "TUTORIAL_SKIP" });
      expect(s.phase).toBe("ready");
    });
  });

  describe("READY_COMPLETE", () => {
    it("stores sequence and enters preview", () => {
      const seq = [3, 7, 1, 5];
      const s = digitSpanReducer(baseState, { type: "READY_COMPLETE", sequence: seq });
      expect(s.phase).toBe("preview");
      expect(s.sequence).toEqual(seq);
      expect(s.userInput).toEqual([]);
      expect(s.currentDigit).toBeNull();
    });
  });

  describe("DIGIT_ON / DIGIT_OFF / SEQUENCE_COMPLETE", () => {
    it("DIGIT_ON sets currentDigit", () => {
      const s = digitSpanReducer({ ...baseState, phase: "preview" }, { type: "DIGIT_ON", digit: 7 });
      expect(s.currentDigit).toBe(7);
    });

    it("DIGIT_OFF clears currentDigit", () => {
      const s = digitSpanReducer(
        { ...baseState, phase: "preview", currentDigit: 7 },
        { type: "DIGIT_OFF" }
      );
      expect(s.currentDigit).toBeNull();
    });

    it("SEQUENCE_COMPLETE transitions preview → input", () => {
      const s = digitSpanReducer({ ...baseState, phase: "preview" }, { type: "SEQUENCE_COMPLETE" });
      expect(s.phase).toBe("input");
      expect(s.currentDigit).toBeNull();
    });
  });

  describe("TAP_DIGIT — forward mode", () => {
    it("accumulates digits without auto-submitting before span", () => {
      const seq = [1, 2, 3, 4];
      let s = makeInput(seq);
      s = digitSpanReducer(s, { type: "TAP_DIGIT", digit: 1, now: NOW });
      expect(s.phase).toBe("input");
      expect(s.userInput).toEqual([1]);
    });

    it("auto-submits correctly on correct forward sequence", () => {
      const seq = [1, 2, 3, 4];
      const s = tapAll(makeInput(seq), seq);
      expect(s.phase).toBe("feedback");
      expect(s.lastFeedbackCorrect).toBe(true);
      expect(s.correctRounds).toBe(1);
      expect(s.round).toBe(1);
      expect(s.span).toBe(5); // increased by 1
    });

    it("auto-submits incorrectly on wrong forward sequence", () => {
      const seq = [1, 2, 3, 4];
      const s = tapAll(makeInput(seq), [1, 2, 3, 9]);
      expect(s.phase).toBe("feedback");
      expect(s.lastFeedbackCorrect).toBe(false);
      expect(s.consecutiveFailures).toBe(1);
      expect(s.span).toBe(4); // unchanged on first failure
    });

    it("first wrong tap does NOT change span", () => {
      const seq = [1, 2, 3];
      const s = tapAll(makeInput(seq, [], { span: 3, consecutiveFailures: 0 }), [9, 9, 9]);
      expect(s.span).toBe(3);
      expect(s.consecutiveFailures).toBe(1);
    });

    it("second consecutive failure decrements span", () => {
      const seq = [1, 2, 3];
      const s = tapAll(
        makeInput(seq, [], { span: 3, consecutiveFailures: 1 }),
        [9, 9, 9]
      );
      expect(s.span).toBe(2);
      expect(s.consecutiveFailures).toBe(2);
    });

    it("span does not go below MIN_SPAN=2", () => {
      const seq = [1, 2];
      const s = tapAll(makeInput(seq, [], { span: 2, consecutiveFailures: 1 }), [9, 9]);
      expect(s.span).toBe(2);
    });

    it("span does not exceed MAX_SPAN=9", () => {
      const seq = Array.from({ length: 9 }, (_, i) => i);
      const s = tapAll(makeInput(seq, [], { span: 9, maxSpan: 9 }), seq);
      expect(s.span).toBe(9);
    });

    it("correct answer resets consecutiveFailures", () => {
      const seq = [1, 2, 3];
      const s = tapAll(
        makeInput(seq, [], { consecutiveFailures: 1 }),
        seq
      );
      expect(s.consecutiveFailures).toBe(0);
    });

    it("maxSpan updates on success", () => {
      const seq = [1, 2, 3, 4];
      const s = tapAll(makeInput(seq, [], { span: 4, maxSpan: 4 }), seq);
      expect(s.maxSpan).toBe(4);
    });

    it("ignores tap when phase is not input", () => {
      const s = digitSpanReducer(
        { ...baseState, phase: "preview" },
        { type: "TAP_DIGIT", digit: 5, now: NOW }
      );
      expect(s.phase).toBe("preview");
    });
  });

  describe("TAP_DIGIT — backward mode", () => {
    it("accepts reversed sequence as correct", () => {
      const seq = [1, 2, 3];
      const s = tapAll(
        makeInput(seq, [], { mode: "backward" }),
        [3, 2, 1] // reverse of [1,2,3]
      );
      expect(s.lastFeedbackCorrect).toBe(true);
    });

    it("rejects forward-order input in backward mode", () => {
      const seq = [1, 2, 3];
      const s = tapAll(makeInput(seq, [], { mode: "backward" }), seq);
      expect(s.lastFeedbackCorrect).toBe(false);
    });
  });

  describe("FEEDBACK_COMPLETE", () => {
    it("transitions to result after TOTAL_ROUNDS", () => {
      const s = digitSpanReducer(
        { ...baseState, phase: "feedback", round: TOTAL_ROUNDS },
        { type: "FEEDBACK_COMPLETE", now: 9999 }
      );
      expect(s.phase).toBe("result");
      expect(s.finishedAt).toBe(9999);
    });

    it("transitions to ready before TOTAL_ROUNDS", () => {
      const s = digitSpanReducer(
        { ...baseState, phase: "feedback", round: TOTAL_ROUNDS - 1 },
        { type: "FEEDBACK_COMPLETE", now: NOW }
      );
      expect(s.phase).toBe("ready");
      expect(s.sequence).toEqual([]);
      expect(s.userInput).toEqual([]);
    });
  });

  describe("PAUSE / RESUME", () => {
    it("pauses from ready", () => {
      expect(digitSpanReducer({ ...baseState, phase: "ready" }, { type: "PAUSE" }).phase).toBe("paused");
    });
    it("pauses from preview", () => {
      expect(digitSpanReducer({ ...baseState, phase: "preview" }, { type: "PAUSE" }).phase).toBe("paused");
    });
    it("pauses from input", () => {
      expect(digitSpanReducer({ ...baseState, phase: "input" }, { type: "PAUSE" }).phase).toBe("paused");
    });
    it("pauses from feedback", () => {
      expect(digitSpanReducer({ ...baseState, phase: "feedback" }, { type: "PAUSE" }).phase).toBe("paused");
    });
    it("PAUSE is a no-op from idle", () => {
      expect(digitSpanReducer({ ...baseState, phase: "idle" }, { type: "PAUSE" }).phase).toBe("idle");
    });
    it("PAUSE is a no-op from result", () => {
      expect(digitSpanReducer({ ...baseState, phase: "result" }, { type: "PAUSE" }).phase).toBe("result");
    });
    it("PAUSE is a no-op from paused", () => {
      expect(digitSpanReducer({ ...baseState, phase: "paused" }, { type: "PAUSE" }).phase).toBe("paused");
    });

    it("RESUME goes paused → ready (fresh stimulus)", () => {
      const s = digitSpanReducer({ ...baseState, phase: "paused" }, { type: "RESUME" });
      expect(s.phase).toBe("ready");
    });

    it("RESUME is a no-op from non-paused", () => {
      const s = digitSpanReducer({ ...baseState, phase: "input" }, { type: "RESUME" });
      expect(s.phase).toBe("input");
    });
  });

  describe("QUIT", () => {
    it("transitions to idle so no session is saved", () => {
      const s = digitSpanReducer({ ...baseState, phase: "input" }, { type: "QUIT" });
      expect(s.phase).toBe("idle");
    });
  });

  describe("RESTART", () => {
    it("resets to initial state for the given difficulty", () => {
      const dirty: DigitSpanState = {
        ...baseState,
        phase: "result",
        round: 10,
        correctRounds: 7,
        maxSpan: 8,
      };
      const s = digitSpanReducer(dirty, {
        type: "RESTART",
        difficulty: "easy",
        showTutorial: false,
        mode: "forward",
      });
      expect(s.phase).toBe("ready");
      expect(s.round).toBe(0);
      expect(s.correctRounds).toBe(0);
      expect(s.span).toBe(2); // easy starting span
    });
  });
});
