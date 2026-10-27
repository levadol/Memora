"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { GlassButton } from "@/components/ui/GlassButton";
import { PauseMenu } from "@/components/games/shared/PauseMenu";
import { FeedbackDisplay } from "@/components/games/shared/FeedbackDisplay";

interface StatItem {
  label: string;
  value: string | number;
}

interface GameShellProps {
  stats: StatItem[];
  statsExtra?: ReactNode;
  phaseLabel: string;
  feedbackCorrect: boolean | null;
  /** "bottom" (default) renders feedback at the bottom of the shell.
   *  "inline" suppresses the bottom feedback region so the game can
   *  place <FeedbackDisplay> directly in its children layout. */
  feedbackPlacement?: "bottom" | "inline";
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
  feedbackPlacement = "bottom",
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

      {/* Feedback — suppressed when feedbackPlacement="inline" */}
      {feedbackPlacement !== "inline" && (
        <div
          className="flex min-h-[3.5rem] items-center justify-center"
          aria-live="assertive"
          aria-atomic="true"
        >
          <FeedbackDisplay feedbackCorrect={feedbackCorrect} />
        </div>
      )}

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
