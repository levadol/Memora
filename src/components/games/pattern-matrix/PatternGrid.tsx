"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { PatternCell } from "./PatternCell";
import type { PatternPhase } from "@/lib/games/pattern-matrix/types";

interface PatternGridProps {
  gridSize: number;
  pattern: number[];
  userInput: number[];
  phase: PatternPhase;
  lastFeedbackCorrect: boolean | null;
  onTap: (index: number) => void;
}

export function PatternGrid({
  gridSize,
  pattern,
  userInput,
  phase,
  lastFeedbackCorrect,
  onTap,
}: PatternGridProps) {
  const total = gridSize * gridSize;
  const isClickable = phase === "input";
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isClickable) return;
      const isRtl = document.documentElement.dir === "rtl";
      let next = focusedIndex;
      if (e.key === "ArrowRight") {
        next = isRtl
          ? Math.max(0, focusedIndex - 1)
          : Math.min(total - 1, focusedIndex + 1);
      } else if (e.key === "ArrowLeft") {
        next = isRtl
          ? Math.min(total - 1, focusedIndex + 1)
          : Math.max(0, focusedIndex - 1);
      } else if (e.key === "ArrowDown") {
        next = Math.min(total - 1, focusedIndex + gridSize);
      } else if (e.key === "ArrowUp") {
        next = Math.max(0, focusedIndex - gridSize);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onTap(focusedIndex);
        return;
      } else {
        return;
      }
      e.preventDefault();
      setFocusedIndex(next);
    },
    [isClickable, focusedIndex, total, gridSize, onTap]
  );

  useEffect(() => {
    if (!isClickable) return;
    const cell = gridRef.current?.querySelectorAll("button")[focusedIndex];
    (cell as HTMLButtonElement | undefined)?.focus({ preventScroll: true });
  }, [focusedIndex, isClickable]);

  return (
    <div
      ref={gridRef}
      role="group"
      aria-label="Pattern grid"
      onKeyDown={handleKeyDown}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: "8px",
        width: "min(360px, 90vw)",
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <PatternCell
          key={i}
          index={i}
          isPattern={pattern.includes(i)}
          isSelected={userInput.includes(i)}
          isFocused={isClickable && focusedIndex === i}
          isClickable={isClickable}
          lastFeedbackCorrect={lastFeedbackCorrect}
          phase={phase}
          onTap={onTap}
          onFocus={setFocusedIndex}
        />
      ))}
    </div>
  );
}
