"use client";

import type { ChainProblem } from "@/lib/games/arithmetic-chain/types";

interface ChainDisplayProps {
  problem: ChainProblem;
  shownIndex: number | null;
}

export function ChainDisplay({ problem, shownIndex }: ChainDisplayProps) {
  if (shownIndex === null) return null;

  if (shownIndex === 0) {
    return (
      <div
        className="ltr-nums text-6xl font-bold text-[var(--color-text-primary)]"
        aria-live="polite"
        aria-atomic="true"
      >
        {problem.startingNumber}
      </div>
    );
  }

  const step = problem.steps[shownIndex - 1];
  if (!step) return null;

  return (
    <div
      className="ltr-nums text-5xl font-bold text-[var(--color-accent)]"
      aria-live="polite"
      aria-atomic="true"
    >
      {step.op} {step.operand}
    </div>
  );
}
