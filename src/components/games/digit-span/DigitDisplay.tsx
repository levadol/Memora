"use client";

import { AnimatePresence, motion } from "framer-motion";

interface DigitDisplayProps {
  digit: number | null;
  /** Increments each time a new digit should animate in (even if same value). */
  digitKey: number;
  reducedMotion: boolean;
}

export function DigitDisplay({ digit, digitKey, reducedMotion }: DigitDisplayProps) {
  return (
    <div
      className="flex h-40 w-40 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      // Always LTR — digits render left-to-right in every locale
      dir="ltr"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        {digit !== null && (
          <motion.span
            key={digitKey}
            className="ltr-nums select-none text-8xl font-bold text-[var(--color-text-primary)]"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.15 }}
          >
            {digit}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
