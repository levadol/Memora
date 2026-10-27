"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

interface DigitInputProps {
  userInput: number[];
  span: number;
  onDigit: (digit: number) => void;
  reducedMotion: boolean;
}

const PAD_ORDER = [7, 8, 9, 4, 5, 6, 1, 2, 3, 0] as const;

export function DigitInput({ userInput, span, onDigit, reducedMotion }: DigitInputProps) {
  const t = useTranslations("game");

  // Keyboard: pressing 0–9 enters a digit
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const d = parseInt(e.key, 10);
      if (!isNaN(d) && d >= 0 && d <= 9) onDigit(d);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onDigit]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress display — shows entered digits as boxes, always LTR */}
      <div
        className="flex min-h-10 flex-wrap justify-center gap-2"
        dir="ltr"
        aria-label={t("enteredDigits")}
        aria-live="polite"
        aria-atomic="true"
      >
        {Array.from({ length: span }, (_, i) => (
          <div
            key={i}
            className={[
              "ltr-nums flex h-10 w-10 items-center justify-center rounded-lg border text-lg font-bold transition-colors",
              i < userInput.length
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] text-transparent",
            ].join(" ")}
          >
            {i < userInput.length ? userInput[i] : "·"}
          </div>
        ))}
      </div>

      {/* 3×4 numpad grid, always LTR */}
      <div
        className="grid grid-cols-3 gap-3"
        dir="ltr"
        role="group"
        aria-label={t("digitPad")}
      >
        {PAD_ORDER.map((d) => (
          <motion.button
            key={d}
            whileTap={reducedMotion ? {} : { scale: 0.92 }}
            onClick={() => onDigit(d)}
            aria-label={t("digitAriaLabel", { digit: d })}
            className={[
              "ltr-nums h-14 w-14 rounded-xl border border-[var(--color-border)]",
              "bg-[var(--color-surface)] text-2xl font-bold text-[var(--color-text-primary)]",
              "transition-colors hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-active)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]",
            ].join(" ")}
          >
            {d}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
