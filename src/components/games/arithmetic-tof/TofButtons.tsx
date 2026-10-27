"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface TofButtonsProps {
  onAnswer: (choice: boolean) => void;
  disabled: boolean;
}

export function TofButtons({ onAnswer, disabled }: TofButtonsProps) {
  const t = useTranslations("game");
  const reducedMotion = useReducedMotion();

  const tap = reducedMotion || disabled ? {} : { scale: 0.93 };
  const spring = { type: "spring" as const, stiffness: 500, damping: 30 };

  const btnBase =
    "flex flex-1 items-center justify-center rounded-xl text-3xl font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40";

  // In RTL locale (Hebrew) the document dir is "rtl", so flexbox reverses
  // item order: [True][False] in DOM becomes [False][True] visually — True on right.
  // This is the desired mirrored layout per spec.
  return (
    <div
      className="flex gap-3"
      style={{ width: "min(calc(100% - 32px), 440px)", margin: "0 auto", minHeight: "80px" }}
    >
      <motion.button
        type="button"
        className={`${btnBase} bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-end)] text-white shadow-lg`}
        style={{ minHeight: "80px" }}
        onClick={() => onAnswer(true)}
        disabled={disabled}
        whileTap={tap}
        transition={spring}
        aria-label={t("tofTrue")}
      >
        {t("tofTrue")}
      </motion.button>
      <motion.button
        type="button"
        className={`${btnBase} border border-[var(--color-glass-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]`}
        style={{ minHeight: "80px" }}
        onClick={() => onAnswer(false)}
        disabled={disabled}
        whileTap={tap}
        transition={spring}
        aria-label={t("tofFalse")}
      >
        {t("tofFalse")}
      </motion.button>
    </div>
  );
}
