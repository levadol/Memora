"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useStorage } from "@/lib/storage/StorageContext";
import { computeStreak, localDateKey } from "@/lib/streak";
import { ACHIEVEMENT_DEFS } from "@/lib/achievements";
import { SVGLineChart } from "@/components/ui/SVGLineChart";
import { HeatmapCalendar } from "@/components/ui/HeatmapCalendar";
import { GlassButton } from "@/components/ui/GlassButton";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { listVariants, itemVariants } from "@/lib/hooks/useStaggerVariants";
import type { SessionRecord, Difficulty } from "@/lib/storage/types";

type GameId = SessionRecord["gameId"];
type Metric = "maxSpan" | "maxLevel" | "accuracy" | "score";

const GAME_METRIC: Record<GameId, Metric> = {
  "digit-span": "maxSpan",
  "corsi-blocks": "maxSpan",
  "n-back": "maxLevel",
  "pattern-matrix": "maxLevel",
  "paired-associates": "accuracy",
  "arithmetic-blitz": "score",
  "arithmetic-chain": "maxLevel",
  "arithmetic-tof": "accuracy",
};

const MEMORY_GAME_IDS: GameId[] = [
  "digit-span",
  "corsi-blocks",
  "n-back",
  "pattern-matrix",
  "paired-associates",
];

const ARITHMETIC_GAME_IDS: GameId[] = [
  "arithmetic-blitz",
  "arithmetic-chain",
  "arithmetic-tof",
];

const GAME_NAME_KEY: Record<GameId, string> = {
  "digit-span": "games.digitSpan.name",
  "corsi-blocks": "games.corsiBlocks.name",
  "n-back": "games.nBack.name",
  "pattern-matrix": "games.patternMatrix.name",
  "paired-associates": "games.pairedAssociates.name",
  "arithmetic-blitz": "games.arithmeticBlitz.name",
  "arithmetic-chain": "games.arithmeticChain.name",
  "arithmetic-tof": "games.arithmeticTof.name",
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function metricValue(s: SessionRecord, metric: Metric): number {
  if (metric === "accuracy") return Math.round(s.accuracy * 100);
  if (metric === "score") return s.score;
  return s[metric] ?? 0;
}

function getLastNDays(sessions: SessionRecord[], gameId: GameId, days: number): SessionRecord[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return sessions
    .filter((s) => s.gameId === gameId && new Date(s.timestamp).getTime() >= cutoff)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export default function StatisticsPage() {
  const t = useTranslations();
  const storage = useStorage();
  const reducedMotion = useReducedMotion();
  const { sessions, achievements } = useMemo(() => storage.load(), [storage]);
  const streak = useMemo(() => computeStreak(sessions, new Date()), [sessions]);
  const [chartDays, setChartDays] = useState<7 | 30>(30);

  const activeDates = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => set.add(localDateKey(new Date(s.timestamp))));
    return set;
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-[var(--color-text-primary)]">
          {t("nav.statistics")}
        </h1>
        <p className="text-[var(--color-text-secondary)]">{t("stats.empty")}</p>
      </div>
    );
  }

  function renderGameSection(gameId: GameId, isArithmetic: boolean) {
    const recent = getLastNDays(sessions, gameId, chartDays);
    const metric = GAME_METRIC[gameId];
    const chartData = recent.map((s) => metricValue(s, metric));
    const allForGame = sessions.filter((s) => s.gameId === gameId);
    const unit = metric === "accuracy" ? "%" : "";
    const best = allForGame.reduce<SessionRecord | null>(
      (b, s) => (!b || metricValue(s, metric) > metricValue(b, metric) ? s : b),
      null
    );

    return (
      <motion.section
        key={gameId}
        variants={itemVariants(reducedMotion)}
        className="surface-card rounded-[var(--radius-lg)] p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {t(GAME_NAME_KEY[gameId] as Parameters<typeof t>[0])}
        </h2>
        {recent.length < 2 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t("stats.noDataForGame")}
          </p>
        ) : (
          <>
            <SVGLineChart data={chartData} width={320} height={72} />
            {best && (
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t("stats.personalBest")}:{" "}
                <span className="font-bold text-[var(--color-text-primary)] ltr-nums">
                  {metricValue(best, metric)}{unit}
                </span>
              </p>
            )}
            {isArithmetic && (
              <div className="flex gap-4 flex-wrap text-xs text-[var(--color-text-secondary)]">
                {DIFFICULTIES.map((d) => {
                  const forDiff = allForGame.filter((s) => s.difficulty === d);
                  const bestForDiff = forDiff.reduce<SessionRecord | null>(
                    (b, s) => (!b || metricValue(s, metric) > metricValue(b, metric) ? s : b),
                    null
                  );
                  if (!bestForDiff) return null;
                  return (
                    <span key={d}>
                      {t(`difficulty.${d}` as Parameters<typeof t>[0])}:{" "}
                      <strong className="text-[var(--color-text-primary)] ltr-nums">
                        {metricValue(bestForDiff, metric)}{unit}
                      </strong>
                    </span>
                  );
                })}
              </div>
            )}
            {gameId === "n-back" && <NBackExtras sessions={allForGame} />}
            {gameId === "arithmetic-tof" && <TofExtras sessions={allForGame} />}
          </>
        )}
      </motion.section>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-3xl px-4 py-10 space-y-8"
      variants={listVariants(reducedMotion)}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        variants={itemVariants(reducedMotion)}
        className="text-3xl font-bold text-[var(--color-text-primary)]"
      >
        {t("nav.statistics")}
      </motion.h1>

      {/* Overview */}
      <motion.section
        variants={itemVariants(reducedMotion)}
        className="surface-card rounded-[var(--radius-lg)] p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {t("stats.overview")}
        </h2>
        <div className="flex gap-8 flex-wrap">
          <StatTile label={t("stats.currentStreak")} value={`${streak.current}d`} />
          <StatTile label={t("stats.longestStreak")} value={`${streak.longest}d`} />
          <StatTile label={t("stats.totalSessions")} value={String(sessions.length)} />
          <StatTile label={t("stats.activeDays")} value={String(streak.totalActiveDays)} />
        </div>
        <div>
          <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
            {t("stats.activityCalendar")}
          </p>
          <HeatmapCalendar
            activeDates={activeDates}
            now={new Date()}
            label={t("stats.activityCalendar")}
          />
        </div>
      </motion.section>

      {/* Chart window toggle */}
      <motion.div variants={itemVariants(reducedMotion)} className="flex gap-2">
        <GlassButton
          variant={chartDays === 7 ? "primary" : "ghost"}
          size="sm"
          onClick={() => setChartDays(7)}
        >
          {t("stats.days7")}
        </GlassButton>
        <GlassButton
          variant={chartDays === 30 ? "primary" : "ghost"}
          size="sm"
          onClick={() => setChartDays(30)}
        >
          {t("stats.days30")}
        </GlassButton>
      </motion.div>

      {/* Memory game sections */}
      {MEMORY_GAME_IDS.map((gameId) => renderGameSection(gameId, false))}

      {/* Arithmetic game sections */}
      {ARITHMETIC_GAME_IDS.map((gameId) => renderGameSection(gameId, true))}

      {/* Achievements */}
      <motion.section
        variants={itemVariants(reducedMotion)}
        className="surface-card rounded-[var(--radius-lg)] p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {t("stats.achievements")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ACHIEVEMENT_DEFS.map((def) => {
            const state = achievements.find((a) => a.id === def.id);
            const unlocked = state?.unlockedAt != null;
            return (
              <div
                key={def.id}
                className={[
                  "rounded-[var(--radius-md)] border p-3 flex gap-3 items-start transition-colors",
                  unlocked
                    ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                    : "border-[var(--color-border)] opacity-50",
                ].join(" ")}
              >
                <span className="text-xl flex-shrink-0" aria-hidden="true">
                  {unlocked ? "🏆" : "🔒"}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {t(def.titleKey as Parameters<typeof t>[0])}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {t(def.descKey as Parameters<typeof t>[0])}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>
    </motion.div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="text-2xl font-bold text-[var(--color-text-primary)] ltr-nums">{value}</p>
    </div>
  );
}

function NBackExtras({ sessions }: { sessions: SessionRecord[] }) {
  const t = useTranslations("stats");
  const withExtras = sessions.filter((s) => typeof s.extras.hits === "number");
  if (withExtras.length === 0) return null;
  const avg = (key: string) =>
    (
      withExtras.reduce((sum, s) => sum + (s.extras[key] as number), 0) /
      withExtras.length
    ).toFixed(1);
  return (
    <div className="flex gap-4 text-sm text-[var(--color-text-secondary)] flex-wrap">
      <span>
        {t("avgHits")}: <strong className="text-[var(--color-text-primary)]">{avg("hits")}</strong>
      </span>
      <span>
        {t("avgMisses")}: <strong className="text-[var(--color-text-primary)]">{avg("misses")}</strong>
      </span>
      <span>
        {t("avgFA")}: <strong className="text-[var(--color-text-primary)]">{avg("falseAlarms")}</strong>
      </span>
    </div>
  );
}

function TofExtras({ sessions }: { sessions: SessionRecord[] }) {
  const t = useTranslations("stats");
  const withExtras = sessions.filter((s) => typeof s.extras.hits === "number");
  if (withExtras.length === 0) return null;
  const avg = (key: string) =>
    (
      withExtras.reduce((sum, s) => sum + (s.extras[key] as number), 0) /
      withExtras.length
    ).toFixed(1);
  return (
    <div className="flex gap-4 text-sm text-[var(--color-text-secondary)] flex-wrap">
      <span>
        {t("avgHits")}: <strong className="text-[var(--color-text-primary)]">{avg("hits")}</strong>
      </span>
      <span>
        {t("avgMisses")}: <strong className="text-[var(--color-text-primary)]">{avg("misses")}</strong>
      </span>
      <span>
        {t("avgFA")}: <strong className="text-[var(--color-text-primary)]">{avg("falseAlarms")}</strong>
      </span>
      <span>
        {t("avgCR")}: <strong className="text-[var(--color-text-primary)]">{avg("correctRejections")}</strong>
      </span>
    </div>
  );
}
