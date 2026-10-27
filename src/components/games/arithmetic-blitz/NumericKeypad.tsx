"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface NumericKeypadProps {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  showMinus?: boolean;
  disabled?: boolean;
}

export function NumericKeypad({
  onDigit,
  onBackspace,
  onSubmit,
  showMinus = false,
  disabled = false,
}: NumericKeypadProps) {
  const t = useTranslations();
  const reducedMotion = useReducedMotion();

  const tap = reducedMotion || disabled ? {} : { scale: 0.93 };
  const spring = { type: "spring" as const, stiffness: 500, damping: 30 };

  const keyBase =
    "numeric-keypad-key flex items-center justify-center rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface)] text-3xl font-bold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-glass-bg)] active:bg-[var(--color-surface-active)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 ltr-nums";

  return (
    <div
      className="numeric-keypad-sticky select-none"
      role="group"
      aria-label={t("game.digitPad")}
      style={{ width: "min(calc(100% - 32px), 440px)", margin: "0 auto" }}
    >
      <div className="grid grid-cols-3 gap-3">
        {(["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const).map((d) => (
          <motion.button
            key={d}
            type="button"
            className={keyBase}
            onClick={() => onDigit(d)}
            disabled={disabled}
            whileTap={tap}
            transition={spring}
            aria-label={t("game.digitAriaLabel", { digit: d })}
          >
            {d}
          </motion.button>
        ))}

        {/* Bottom row: [−|hidden] [0] [←] */}
        <motion.button
          type="button"
          className={keyBase}
          onClick={() => onDigit("-")}
          disabled={disabled || !showMinus}
          aria-label="minus"
          style={{ visibility: showMinus ? undefined : "hidden" }}
          whileTap={tap}
          transition={spring}
        >
          −
        </motion.button>
        <motion.button
          type="button"
          className={keyBase}
          onClick={() => onDigit("0")}
          disabled={disabled}
          whileTap={tap}
          transition={spring}
          aria-label={t("game.digitAriaLabel", { digit: "0" })}
        >
          0
        </motion.button>
        <motion.button
          type="button"
          className={keyBase}
          onClick={onBackspace}
          disabled={disabled}
          whileTap={tap}
          transition={spring}
          aria-label="Backspace"
        >
          ←
        </motion.button>

        {/* Submit spans all 3 columns */}
        <motion.button
          type="button"
          className="numeric-keypad-key col-span-3 flex items-center justify-center rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-end)] text-2xl font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40"
          onClick={onSubmit}
          disabled={disabled}
          whileTap={reducedMotion || disabled ? {} : { scale: 0.96 }}
          transition={spring}
          aria-label="Submit answer"
        >
          ✓
        </motion.button>
      </div>
    </div>
  );
}
