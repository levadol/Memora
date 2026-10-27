import { describe, it, expect } from "vitest";
import {
  generateProblem,
  nextAdaptiveState,
  initialAdaptiveState,
} from "../generate";
import { LEVEL_TABLE, SUB_LEVEL_COUNT, DEFAULT_OPS } from "../constants";
import type { Difficulty } from "@/lib/storage/types";

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

describe("generateProblem — rules for all 1000 problems per level", () => {
  for (const difficulty of DIFFICULTIES) {
    for (let sub = 0; sub < SUB_LEVEL_COUNT; sub++) {
      it(`${difficulty} sub${sub}: integer answers, no trivials, no negatives`, () => {
        const rng = makeRng(42 + sub);
        const ops = DEFAULT_OPS[difficulty];
        const spec = LEVEL_TABLE[difficulty][sub]!;

        for (let i = 0; i < 1000; i++) {
          const p = generateProblem(difficulty, sub, ops, rng);

          // Answer is always an integer
          expect(Number.isInteger(p.answer)).toBe(true);

          // No negative answers (all difficulties have allowNegative: false)
          expect(p.answer).toBeGreaterThan(0);

          // Operands are positive
          expect(p.operands[0]).toBeGreaterThan(0);
          expect(p.operands[1]).toBeGreaterThan(0);

          // Detect operation from text
          const text = p.text;
          if (text.includes("÷")) {
            // Exact division: dividend % divisor === 0
            expect(p.operands[0] % p.operands[1]).toBe(0);
            // Quotient = answer
            expect(p.operands[0] / p.operands[1]).toBe(p.answer);
            // No trivial a÷1
            expect(p.operands[1]).toBeGreaterThanOrEqual(2);
            // Answer within divQuotientMax
            expect(p.answer).toBeGreaterThanOrEqual(2);
            expect(p.answer).toBeLessThanOrEqual(spec.divQuotientMax);
          } else if (text.includes("×")) {
            // Both factors ≥ 2
            expect(p.operands[0]).toBeGreaterThanOrEqual(2);
            expect(p.operands[1]).toBeGreaterThanOrEqual(2);
            // Product matches
            expect(p.operands[0] * p.operands[1]).toBe(p.answer);
          } else if (text.includes("-")) {
            // No zero result (trivial subtraction eliminated)
            expect(p.answer).not.toBe(0);
          } else {
            // Addition: answer = a + b
            expect(p.operands[0] + p.operands[1]).toBe(p.answer);
          }

          // Easy: only + and - allowed
          if (difficulty === "easy") {
            expect(text.includes("×") || text.includes("÷")).toBe(false);
          }

          // Medium: no ÷ allowed
          if (difficulty === "medium") {
            expect(text.includes("÷")).toBe(false);
          }
        }
      });
    }
  }
});

describe("generateProblem — operand bounds", () => {
  it("easy: operands stay within addSubMax", () => {
    const rng = makeRng(100);
    const spec = LEVEL_TABLE.easy[2]!; // sub 2, addSubMax=20
    for (let i = 0; i < 500; i++) {
      const p = generateProblem("easy", 2, ["+", "-"], rng);
      expect(p.operands[0]).toBeLessThanOrEqual(spec.addSubMax);
      expect(p.operands[1]).toBeLessThanOrEqual(spec.addSubMax);
    }
  });

  it("medium sub2: add/sub operands within 100, mul factors ≤10", () => {
    const rng = makeRng(200);
    for (let i = 0; i < 500; i++) {
      const p = generateProblem("medium", 2, ["+", "-", "×"], rng);
      if (p.text.includes("×")) {
        expect(p.operands[0]).toBeLessThanOrEqual(12);
        expect(p.operands[1]).toBeLessThanOrEqual(12);
      } else {
        expect(p.operands[0]).toBeLessThanOrEqual(100);
        expect(p.operands[1]).toBeLessThanOrEqual(100);
      }
    }
  });

  it("hard sub2: add/sub operands within 1000, div quotient ≤12", () => {
    const rng = makeRng(300);
    for (let i = 0; i < 500; i++) {
      const p = generateProblem("hard", 2, ["+", "-", "×", "÷"], rng);
      if (p.text.includes("÷")) {
        expect(p.answer).toBeLessThanOrEqual(12);
        expect(p.operands[1]).toBeLessThanOrEqual(12);
      } else if (!p.text.includes("×")) {
        expect(p.operands[0]).toBeLessThanOrEqual(1000);
        expect(p.operands[1]).toBeLessThanOrEqual(1000);
      }
    }
  });
});

describe("generateProblem — no identical problem in a row", () => {
  it("passes prevText and never generates the same text consecutively", () => {
    const rng = makeRng(999);
    let prev: string | null = null;
    for (let i = 0; i < 500; i++) {
      const p = generateProblem("medium", 1, ["+", "-", "×"], rng, prev);
      expect(p.text).not.toBe(prev);
      prev = p.text;
    }
  });
});

describe("nextAdaptiveState — adaptation logic", () => {
  it("3 consecutive correct → sub-level increases", () => {
    let state = initialAdaptiveState("medium");
    state = nextAdaptiveState(state, true);
    state = nextAdaptiveState(state, true);
    state = nextAdaptiveState(state, true);
    expect(state.subLevel).toBe(2);
    expect(state.consecutiveCorrect).toBe(0);
  });

  it("2 consecutive wrong → sub-level decreases", () => {
    let state = initialAdaptiveState("medium"); // starts at subLevel 1
    state = nextAdaptiveState(state, false);
    state = nextAdaptiveState(state, false);
    expect(state.subLevel).toBe(0);
    expect(state.consecutiveWrong).toBe(0);
  });

  it("sub-level never goes below 0", () => {
    let state = initialAdaptiveState("easy"); // subLevel 1
    state = nextAdaptiveState(state, false);
    state = nextAdaptiveState(state, false); // → 0
    state = nextAdaptiveState(state, false);
    state = nextAdaptiveState(state, false); // try to go below 0
    expect(state.subLevel).toBe(0);
  });

  it(`sub-level never exceeds ${SUB_LEVEL_COUNT - 1}`, () => {
    let state = initialAdaptiveState("hard");
    // push to max
    for (let i = 0; i < 9; i++) state = nextAdaptiveState(state, true);
    expect(state.subLevel).toBe(SUB_LEVEL_COUNT - 1);
  });

  it("wrong resets consecutiveCorrect", () => {
    let state = initialAdaptiveState("easy");
    state = nextAdaptiveState(state, true);
    state = nextAdaptiveState(state, true);
    expect(state.consecutiveCorrect).toBe(2);
    state = nextAdaptiveState(state, false);
    expect(state.consecutiveCorrect).toBe(0);
  });

  it("correct resets consecutiveWrong", () => {
    let state = initialAdaptiveState("easy");
    state = nextAdaptiveState(state, false);
    expect(state.consecutiveWrong).toBe(1);
    state = nextAdaptiveState(state, true);
    expect(state.consecutiveWrong).toBe(0);
  });

  it("difficulty boundary never crossed — easy stays easy", () => {
    let state = initialAdaptiveState("easy");
    // Max sub-level for easy should stay within [0, SUB_LEVEL_COUNT-1]
    for (let i = 0; i < 30; i++) state = nextAdaptiveState(state, true);
    expect(state.subLevel).toBeLessThanOrEqual(SUB_LEVEL_COUNT - 1);
    expect(state.difficulty).toBe("easy");
  });
});

describe("initialAdaptiveState", () => {
  it("starts at sub-level 1 (middle)", () => {
    const state = initialAdaptiveState("hard");
    expect(state.subLevel).toBe(1);
    expect(state.consecutiveCorrect).toBe(0);
    expect(state.consecutiveWrong).toBe(0);
    expect(state.difficulty).toBe("hard");
  });
});
