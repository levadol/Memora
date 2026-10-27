import type { Difficulty } from "@/lib/storage/types";
import type { Op } from "@/lib/arithmetic/constants";
import { LEVEL_TABLE } from "@/lib/arithmetic/constants";
import type { ChainProblem, ChainStep } from "./types";

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function generateChain(
  difficulty: Difficulty,
  subLevelIndex: number,
  chainLength: number,
  rng: () => number
): ChainProblem {
  const spec = LEVEL_TABLE[difficulty][Math.min(subLevelIndex, 2)]!;
  const maxVal = spec.addSubMax;
  const availableOps: Op[] =
    difficulty === "easy"
      ? ["+", "-"]
      : difficulty === "medium"
        ? ["+", "-", "×"]
        : ["+", "-", "×", "÷"];

  const start = randInt(rng, 1, Math.max(1, Math.floor(maxVal * 0.4)));
  let current = start;
  const steps: ChainStep[] = [];

  for (let i = 0; i < chainLength; i++) {
    let op: Op = "+";
    let operand = 1;
    let next = current + 1;
    let tries = 0;

    while (tries < 80) {
      tries++;
      op = availableOps[Math.floor(rng() * availableOps.length)]!;

      if (op === "+") {
        const maxAdd = Math.max(1, maxVal - current);
        operand = randInt(rng, 1, Math.min(10, maxAdd));
        next = current + operand;
      } else if (op === "-") {
        const maxSub = Math.min(current - 1, 10);
        if (maxSub < 1) continue;
        operand = randInt(rng, 1, maxSub);
        next = current - operand;
      } else if (op === "×") {
        const maxFactor =
          spec.mulAMax > 0
            ? Math.min(spec.mulAMax, Math.floor(maxVal / Math.max(current, 1)))
            : 0;
        if (maxFactor < 2) continue;
        operand = randInt(rng, 2, maxFactor);
        next = current * operand;
      } else {
        // ÷ — find exact divisors
        const divisors: number[] = [];
        for (let d = 2; d <= Math.min(current - 1, 9); d++) {
          if (current % d === 0 && current / d >= 1) divisors.push(d);
        }
        if (divisors.length === 0) continue;
        operand = divisors[Math.floor(rng() * divisors.length)]!;
        next = current / operand;
      }

      if (next >= 1 && next <= maxVal && operand >= 1) {
        break;
      }
    }

    // Fallback: simple ±1
    if (next < 1 || next > maxVal) {
      op = current > 1 ? "-" : "+";
      operand = 1;
      next = current + (op === "+" ? 1 : -1);
    }

    steps.push({ op, operand, intermediate: next });
    current = next;
  }

  return { startingNumber: start, steps, answer: current };
}
