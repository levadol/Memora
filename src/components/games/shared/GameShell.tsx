"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { PauseMenu } from "@/components/games/shared/PauseMenu";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface StatItem {
  label: string;
  value: string | number;
}

interface GameShellProps {
  stats: StatItem[];
  statsExtra?: ReactNode;
  phaseLabel: string;
  feedbackCorrect: boolean | null;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  footer?: ReactNode;
  children: ReactNode;
  dataAttributes?: Record<string, string | undefined>;
}

export function GameShell({
  stats,
  statsExtra,
  phaseLabel,
  feedbackCorrect,
  isPaused,
  onPause,
  onResume,
  onRestart,
  onQuit,
  footer,
  children,
  dataAttributes,
}: GameShellProps) {
  const t = useTranslations();
  const reducedMotion = useReducedMotion();

  const spreadable = dataAttributes
    ? (Object.fromEntries(
        Object.entries(dataAttributes).filter(([, v]) => v !== undefined)
      ) as Record<string, string>)
    : {};

  return (
    <div className="flex min-h-screen flex-col" {...spreadable}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-6">
            {stats.map(({ label, value }) => (
              <span
                key={label}
                className="text-sm text-[var(--color-text-secondary)]"
              >
                {label}{" "}
                <span className="ltr-nums font-bold text-[var(--color-text-primary)]">
                  {value}
                </span>
              </span>
            ))}
          </div>
          {statsExtra}
        </div>
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={onPause}
          aria-label={t("game.pause")}
        >
          {t("game.pause")}
        </GlassButton>
      </div>

      {/* Phase label — polite announcer */}
      <div
        className="py-2 text-center text-sm text-[var(--color-text-secondary)]"
        aria-live="polite"
        aria-atomic="true"
      >
        {phaseLabel}
      </div>

      {/* Board */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        {children}
      </div>

      {/* Feedback — single assertive live region, always in DOM */}
      <div
        className="flex min-h-[3.5rem] items-center justify-center"
        aria-live="assertive"
        aria-atomic="true"
      >
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
                x: !feedbackCorrect && !reducedMotion
                  ? [0, -8, 8, -6, 6, -3, 3, 0]
                  : 0,
              }}
              exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.9 }}
              transition={reducedMotion ? { duration: 0.12 } : { duration: 0.45 }}
            >
              {/* Pre-rendered glow overlay — only opacity animated */}
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
      </div>

      {/* Footer */}
      {footer && (
        <div className="pb-8 text-center text-sm text-[var(--color-text-secondary)]">
          {footer}
        </div>
      )}

      <PauseMenu
        open={isPaused}
        onResume={onResume}
        onRestart={onRestart}
        onQuit={onQuit}
      />
    </div>
  );
}
