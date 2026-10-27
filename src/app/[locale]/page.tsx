"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { useAppStore } from "@/lib/store";
import { useStorage } from "@/lib/storage/StorageContext";
import { useDailyTraining } from "@/lib/hooks/useDailyTraining";
import { useArithmeticTraining } from "@/lib/hooks/useArithmeticTraining";
import { computeStreak } from "@/lib/streak";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { listVariants, itemVariants } from "@/lib/hooks/useStaggerVariants";
import type { GameId } from "@/lib/storage/types";

const GAMES: { id: GameId; icon: string; color: string }[] = [
  { id: "digit-span", icon: "🔢", color: "#7c5af3" },
  { id: "corsi-blocks", icon: "🟦", color: "#4fa3e0" },
  { id: "n-back", icon: "🔄", color: "#e05aa0" },
  { id: "pattern-matrix", icon: "🔷", color: "#4fe0a0" },
  { id: "paired-associates", icon: "🔗", color: "#e0a04f" },
];

const ARITHMETIC_GAMES: { id: GameId; icon: string; color: string }[] = [
  { id: "arithmetic-blitz", icon: "⚡", color: "#f5a623" },
  { id: "arithmetic-chain", icon: "🔗", color: "#4fa3e0" },
  { id: "arithmetic-tof", icon: "✓✗", color: "#e05aa0" },
];

const GAME_KEY_MAP: Record<GameId, string> = {
  "digit-span": "digitSpan",
  "corsi-blocks": "corsiBlocks",
  "n-back": "nBack",
  "pattern-matrix": "patternMatrix",
  "paired-associates": "pairedAssociates",
  "arithmetic-blitz": "arithmeticBlitz",
  "arithmetic-chain": "arithmeticChain",
  "arithmetic-tof": "arithmeticTof",
};

export default function HomePage() {
  const t = useTranslations("games");
  const th = useTranslations("home");
  const reducedMotion = useReducedMotion();
  const openGame = useAppStore((s) => s.openGame);
  const { startDailyTraining, continueDaily } = useDailyTraining();
  const { startArithmeticTraining, continueArithmetic } = useArithmeticTraining();
  const dismissDailySummary = useAppStore((s) => s.dismissDailySummary);
  const dismissArithmeticSummary = useAppStore((s) => s.dismissArithmeticSummary);
  const dailyQueue = useAppStore((s) => s.dailyQueue);
  const dailyProgress = useAppStore((s) => s.dailyProgress);
  const dailySummary = useAppStore((s) => s.dailySummary);
  const arithmeticDailyQueue = useAppStore((s) => s.arithmeticDailyQueue);
  const arithmeticDailyProgress = useAppStore((s) => s.arithmeticDailyProgress);
  const arithmeticDailySummary = useAppStore((s) => s.arithmeticDailySummary);
  const storage = useStorage();

  const streak = useMemo(() => {
    const { sessions } = storage.load();
    return computeStreak(sessions, new Date());
  }, [storage]);

  const isDailyActive = dailyQueue !== null && !dailySummary;
  const isDailyPaused = isDailyActive && dailyProgress < (dailyQueue?.length ?? 0);
  const nextGameIndex = dailyProgress;

  const isArithmeticActive = arithmeticDailyQueue !== null && !arithmeticDailySummary;
  const isArithmeticPaused = isArithmeticActive && arithmeticDailyProgress < (arithmeticDailyQueue?.length ?? 0);
  const arithmeticNextIndex = arithmeticDailyProgress;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-10 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            {th("dailyTraining")}
          </h1>
          {streak.current > 0 && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {th("streak", { count: streak.current })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isDailyPaused && (
            <span className="text-sm text-[var(--color-text-secondary)]">
              {th("dailyProgress", {
                current: nextGameIndex + 1,
                total: dailyQueue!.length,
              })}
            </span>
          )}
          {isDailyPaused ? (
            <GlassButton
              variant="primary"
              onClick={continueDaily}
              aria-label={th("continueTraining")}
            >
              {th("continueTraining")}
            </GlassButton>
          ) : (
            <GlassButton
              variant="primary"
              onClick={startDailyTraining}
              aria-label={th("startTraining")}
            >
              {th("startTraining")}
            </GlassButton>
          )}
          {isArithmeticPaused && (
            <span className="text-sm text-[var(--color-text-secondary)]">
              {th("arithmeticDailyProgress", {
                current: arithmeticNextIndex + 1,
                total: arithmeticDailyQueue!.length,
              })}
            </span>
          )}
          {isArithmeticPaused ? (
            <GlassButton
              variant="primary"
              onClick={continueArithmetic}
              aria-label={th("continueArithmeticTraining")}
            >
              {th("continueArithmeticTraining")}
            </GlassButton>
          ) : (
            <GlassButton
              variant="ghost"
              onClick={startArithmeticTraining}
              aria-label={th("startArithmeticTraining")}
            >
              {th("startArithmeticTraining")}
            </GlassButton>
          )}
        </div>
      </div>

      {/* End-of-training summary */}
      <AnimatePresence>
        {dailySummary && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-8"
          >
            <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[var(--color-correct)]">
                  {th("dailySummaryTitle")}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {th("dailySummaryMessage", { total: dailyQueue?.length ?? 5 })}
                </p>
              </div>
              <GlassButton variant="ghost" size="sm" onClick={dismissDailySummary}>
                {th("dailyDone")}
              </GlassButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {arithmeticDailySummary && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-8"
          >
            <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[var(--color-correct)]">
                  {th("arithmeticDailySummaryTitle")}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {th("arithmeticDailySummaryMessage", { total: arithmeticDailyQueue?.length ?? 3 })}
                </p>
              </div>
              <GlassButton variant="ghost" size="sm" onClick={dismissArithmeticSummary}>
                {th("arithmeticDailyDone")}
              </GlassButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-secondary)]">
        {th("memorySection")}
      </h2>
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={listVariants(reducedMotion)}
        initial="hidden"
        animate="show"
      >
        {GAMES.map((game) => {
          const key = GAME_KEY_MAP[game.id];
          return (
            <motion.div
              key={game.id}
              variants={itemVariants(reducedMotion)}
              layoutId={`game-card-${game.id}`}
              style={{ borderRadius: "var(--radius-lg)" }}
              whileHover={reducedMotion ? {} : { scale: 1.02 }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <GlassCard
                as="article"
                className="group flex cursor-pointer flex-col gap-3"
                onClick={() => openGame(game.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") openGame(game.id);
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: `${game.color}26` }}
                >
                  {game.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {t(`${key}.name` as Parameters<typeof t>[0])}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {t(`${key}.tagline` as Parameters<typeof t>[0])}
                  </p>
                </div>
                <div className="mt-auto flex justify-end" aria-hidden="true">
                  <span className="rounded-[var(--radius-sm)] border border-[var(--color-glass-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)]">
                    →
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      <h2 className="mt-10 mb-4 text-xl font-semibold text-[var(--color-text-secondary)]">
        {th("arithmeticSection")}
      </h2>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={listVariants(reducedMotion)}
        initial="hidden"
        animate="show"
      >
        {ARITHMETIC_GAMES.map((game) => {
          const key = GAME_KEY_MAP[game.id];
          return (
            <motion.div
              key={game.id}
              variants={itemVariants(reducedMotion)}
              layoutId={`game-card-${game.id}`}
              style={{ borderRadius: "var(--radius-lg)" }}
              whileHover={reducedMotion ? {} : { scale: 1.02 }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <GlassCard
                as="article"
                className="group flex cursor-pointer flex-col gap-3"
                onClick={() => openGame(game.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") openGame(game.id);
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: `${game.color}26` }}
                >
                  {game.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {t(`${key}.name` as Parameters<typeof t>[0])}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {t(`${key}.tagline` as Parameters<typeof t>[0])}
                  </p>
                </div>
                <div className="mt-auto flex justify-end" aria-hidden="true">
                  <span className="rounded-[var(--radius-sm)] border border-[var(--color-glass-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)]">
                    →
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
