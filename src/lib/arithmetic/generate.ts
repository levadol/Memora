import type { Difficulty } from "@/lib/storage/types";
import {
  LEVEL_TABLE,
  SUB_LEVEL_COUNT,
  CONSECUTIVE_CORRECT_WIDEN,
  CONSECUTIVE_WRONG_NARROW,
} from "./constants";
import type { Op, SubLevelSpec } from "./constants";

export interface Problem {
  text: string;
  answer: number;
  operands: [number, number];
}

export interface AdaptiveState {
  difficulty: Difficulty;
  subLevel: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function makeText(a: number, op: Op, b: number): string {
  return `${a} ${op} ${b}`;
}

function generateAt(
  spec: SubLevelSpec,
  ops: Op[],
  rng: () => number,
  prevText: string | null
): Problem {
  const available = ops.filter((op) => {
    if (op === "×" && spec.mulAMax === 0) return false;
    if (op === "÷" && spec.divQuotientMax === 0) return false;
    return true;
  });

  for (let attempt = 0; attempt < 200; attempt++) {
    const op = available[Math.floor(rng() * available.length)]!;
    let a: number, b: number, answer: number;

    if (op === "+") {
      a = randInt(rng, 1, spec.addSubMax);
      b = randInt(rng, 1, spec.addSubMax);
      answer = a + b;
    } else if (op === "-") {
      a = randInt(rng, 1, spec.addSubMax);
      b = randInt(rng, 1, spec.addSubMax);
      if (!spec.allowNegative && b > a) [a, b] = [b, a];
      answer = a - b;
      if (answer === 0) continue;
    } else if (op === "×") {
      if (spec.mulAMax >= 19 && rng() < 0.5) {
        a = randInt(rng, 10, 19);
        b = randInt(rng, 2, 9);
      } else {
        const capA = Math.min(spec.mulAMax, 12);
        const capB = Math.min(spec.mulBMax, 12);
        a = randInt(rng, 2, capA);
        b = randInt(rng, 2, capB);
      }
      answer = a * b;
    } else {
      const quotient = randInt(rng, 2, spec.divQuotientMax);
      const divisor = randInt(rng, 2, spec.divDivisorMax);
      a = quotient * divisor;
      b = divisor;
      answer = quotient;
    }

    const text = makeText(a, op, b);
    if (text === prevText) continue;

    return { text, answer, operands: [a, b] };
  }

  // Fallback: simple addition
  const fa = randInt(rng, 1, Math.min(spec.addSubMax, 10));
  const fb = randInt(rng, 1, Math.min(spec.addSubMax, 10));
  return { text: makeText(fa, "+", fb), answer: fa + fb, operands: [fa, fb] };
}

export function generateProblem(
  difficulty: Difficulty,
  subLevelIndex: number,
  ops: Op[],
  rng: () => number,
  prevText?: string | null
): Problem {
  const specs = LEVEL_TABLE[difficulty];
  const idx = Math.max(0, Math.min(subLevelIndex, SUB_LEVEL_COUNT - 1));
  return generateAt(specs[idx]!, ops, rng, prevText ?? null);
}

export function nextAdaptiveState(
  state: AdaptiveState,
  wasCorrect: boolean
): AdaptiveState {
  if (wasCorrect) {
    const cc = state.consecutiveCorrect + 1;
    if (cc >= CONSECUTIVE_CORRECT_WIDEN) {
      return {
        ...state,
        subLevel: Math.min(state.subLevel + 1, SUB_LEVEL_COUNT - 1),
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
      };
    }
    return { ...state, consecutiveCorrect: cc, consecutiveWrong: 0 };
  } else {
    const cw = state.consecutiveWrong + 1;
    if (cw >= CONSECUTIVE_WRONG_NARROW) {
      return {
        ...state,
        subLevel: Math.max(state.subLevel - 1, 0),
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
      };
    }
    return { ...state, consecutiveCorrect: 0, consecutiveWrong: cw };
  }
}

export function initialAdaptiveState(difficulty: Difficulty): AdaptiveState {
  return {
    difficulty,
    subLevel: 1,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
  };
}
