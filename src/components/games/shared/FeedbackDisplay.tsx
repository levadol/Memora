"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface FeedbackDisplayProps {
  feedbackCorrect: boolean | null;
}

export function FeedbackDisplay({ feedbackCorrect }: FeedbackDisplayProps) {
  const t = useTranslations();
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {feedbackCorrect !== null && (
        <motion.span
          key={feedbackCorrect ? "correct" : "incorrect"}
          className={[
            "relative inline-flex items-center justify-center text-4xl font-bold",
            feedbackCorrect
              ? "text-[var(--color-correct)]"
              : "text-[var(--color-incorrect)]",
          ].join(" ")}
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.7 }}
          animate={{
            opacity: 1,
            scale: feedbackCorrect && !reducedMotion ? [0.7, 1.1, 1] : 1,
            x:
              !feedbackCorrect && !reducedMotion
                ? [0, -8, 8, -6, 6, -3, 3, 0]
                : 0,
          }}
          exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.9 }}
          transition={reducedMotion ? { duration: 0.12 } : { duration: 0.45 }}
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-[-8px] rounded-full bg-[var(--color-correct)] blur-xl"
            animate={{
              opacity: feedbackCorrect && !reducedMotion ? [0, 0.5, 0.2] : 0,
            }}
            transition={{ duration: 0.45 }}
          />
          <span className="relative z-10">
            {feedbackCorrect ? t("game.correct") : t("game.incorrect")}
          </span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
