"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface PatternCellProps {
  index: number;
  isPattern: boolean;
  isSelected: boolean;
  isFocused: boolean;
  isClickable: boolean;
  lastFeedbackCorrect: boolean | null;
  phase: "preview" | "input" | "feedback" | "ready" | "paused" | "result" | "tutorial" | "idle";
  onTap: (index: number) => void;
  onFocus: (index: number) => void;
}

export function PatternCell({
  index,
  isPattern,
  isSelected,
  isFocused,
  isClickable,
  lastFeedbackCorrect,
  phase,
  onTap,
  onFocus,
}: PatternCellProps) {
  const t = useTranslations();
  const reducedMotion = useReducedMotion();

  const isPreview = phase === "preview" && isPattern;
  const isFeedback = phase === "feedback";
  const showAccent = (isPreview || isSelected) && !isFeedback;
  const showCorrect = isFeedback && isSelected && lastFeedbackCorrect === true;
  const showIncorrect = isFeedback && isSelected && lastFeedbackCorrect === false;

  return (
    <motion.button
      type="button"
      aria-label={t("game.cellLabel", { index: index + 1 })}
      aria-pressed={isSelected}
      disabled={!isClickable}
      tabIndex={isClickable ? 0 : -1}
      onClick={() => isClickable && onTap(index)}
      onFocus={() => onFocus(index)}
      className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-glass-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{
        background: "var(--color-glass-bg)",
        boxShadow: isFocused ? "0 0 0 3px var(--color-accent)" : undefined,
        minHeight: 44,
        minWidth: 44,
        cursor: isClickable ? "pointer" : "default",
      }}
      animate={
        reducedMotion
          ? { opacity: isPreview || isSelected ? 1 : 0.35 }
          : { scale: isPreview ? 1.04 : 1, opacity: isPreview || isSelected ? 1 : 0.35 }
      }
      whileTap={!reducedMotion && isClickable ? { scale: 0.93 } : {}}
      transition={reducedMotion ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Overlay layers — only opacity animated */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[var(--color-accent)]"
        animate={{ opacity: showAccent ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[var(--color-correct)]"
        animate={{ opacity: showCorrect ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[var(--color-incorrect)]"
        animate={{ opacity: showIncorrect ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />
    </motion.button>
  );
}
