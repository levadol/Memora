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

  const CARD_WIDTH = "min(calc(100% - 32px), 440px)";

  const btnBase = [
    "flex items-center justify-center rounded-xl font-bold transition-colors",
    "focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]",
    "disabled:opacity-40",
    // Never wrap; shrink font to 24px minimum so long labels fit
    "overflow-hidden",
  ].join(" ");

  // In RTL locales the grid column order flips automatically (direction: rtl),
  // so True (column 1) moves to the visual right — the desired mirror layout.
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        width: CARD_WIDTH,
        margin: "0 auto",
      }}
    >
      <motion.button
        type="button"
        className={`${btnBase} bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-end)] text-white shadow-lg`}
        style={{ height: "88px", paddingInline: "24px", fontSize: "clamp(24px, 5vw, 28px)", whiteSpace: "nowrap" }}
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
        style={{ height: "88px", paddingInline: "24px", fontSize: "clamp(24px, 5vw, 28px)", whiteSpace: "nowrap" }}
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
