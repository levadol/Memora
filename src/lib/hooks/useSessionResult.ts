"use client";

import { useMemo, useRef, useEffect } from "react";
import type { GameId, Difficulty, SessionRecord } from "@/lib/storage/types";
import { useStorage } from "@/lib/storage/StorageContext";
import { evaluateNewAchievements } from "@/lib/achievements";
import { useAppStore } from "@/lib/store";

export interface SessionResultInput {
  /** Current game phase — the hook activates when this is "result". */
  phase: string;
  gameId: GameId;
  mode: string;
  difficulty: Difficulty;
  score: number;
  accuracy: number;
  maxSpan: number | null;
  maxLevel: number | null;
  /** Total rounds attempted. Sessions with 0 rounds are not saved. */
  round: number;
  /** Rounds answered correctly — used as the saved score. */
  correctRounds: number;
  startedAt: number | null;
  finishedAt: number | null;
  extras?: Record<string, unknown>;
}

export interface SessionResultOutput {
  /** max(previous personal best, current result) — null if no prior session. */
  personalBest: number | null;
  /** The span/level from the immediately preceding session with the same mode + difficulty. */
  prevSessionResult: number | null;
  /** True when current result strictly exceeds all prior sessions for this mode + difficulty. */
  isNewRecord: boolean;
}

const EMPTY: SessionResultOutput = {
  personalBest: null,
  prevSessionResult: null,
  isNewRecord: false,
};

export function useSessionResult({
  phase,
  gameId,
  mode,
  difficulty,
  score,
  accuracy,
  maxSpan,
  maxLevel,
  round,
  correctRounds,
  startedAt,
  finishedAt,
  extras,
}: SessionResultInput): SessionResultOutput {
  const storage = useStorage();
  const setAchievementToast = useAppStore((s) => s.setAchievementToast);
  const markDailyGameComplete = useAppStore((s) => s.markDailyGameComplete);
  const dailyQueue = useAppStore((s) => s.dailyQueue);
  const dailyProgress = useAppStore((s) => s.dailyProgress);
  const markArithmeticGameComplete = useAppStore((s) => s.markArithmeticGameComplete);
  const arithmeticDailyQueue = useAppStore((s) => s.arithmeticDailyQueue);
  const arithmeticDailyProgress = useAppStore((s) => s.arithmeticDailyProgress);
  const savedRef = useRef(false);

  // Reset save guard whenever we leave the result phase (Play Again / Restart)
  useEffect(() => {
    if (phase !== "result") {
      savedRef.current = false;
    }
  }, [phase]);

  // Compute synchronously so the first render of the result screen is accurate.
  // Reading localStorage in useMemo is intentional: it is synchronous and avoids
  // the useState-initialized-to-null false-positive on isNewRecord.
  const stats = useMemo<SessionResultOutput>(() => {
    if (phase !== "result") return EMPTY;

    const data = storage.load();
    const relevant = data.sessions.filter(
      (s) => s.gameId === gameId && s.mode === mode && s.difficulty === difficulty
    );

    const metric = maxSpan ?? maxLevel;
    const prevBest =
      relevant.length > 0
        ? Math.max(...relevant.map((s) => s.maxSpan ?? s.maxLevel ?? 0))
        : null;

    const sorted = [...relevant].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const prevResult = sorted[0]
      ? (sorted[0].maxSpan ?? sorted[0].maxLevel ?? null)
      : null;

    const isNewRecord = metric != null && (prevBest === null || metric > prevBest);
    const personalBest =
      metric != null && prevBest != null
        ? Math.max(prevBest, metric)
        : (metric ?? prevBest);

    return { personalBest, prevSessionResult: prevResult, isNewRecord };
  }, [phase, gameId, mode, difficulty, maxSpan, maxLevel, storage]);

  // Save once when result is first reached. Skip only when zero rounds were attempted;
  // a session with rounds played but zero correct is still saved.
  useEffect(() => {
    if (phase !== "result" || savedRef.current || round === 0) return;
    savedRef.current = true;

    const durationSecs =
      startedAt != null && finishedAt != null
        ? Math.round((finishedAt - startedAt) / 1000)
        : 0;

    const record: SessionRecord = {
      id: crypto.randomUUID(),
      gameId,
      mode,
      difficulty,
      score,
      accuracy,
      maxSpan,
      maxLevel,
      duration: durationSecs,
      timestamp: new Date().toISOString(),
      extras: extras ?? {},
    };

    storage.addSession(record);

    // Advance memory daily training progress
    if (dailyQueue && dailyQueue[dailyProgress] === record.gameId) {
      markDailyGameComplete(record.gameId);
      const newProgress = dailyProgress + 1;
      storage.updateDailyTraining({
        date: record.timestamp.slice(0, 10),
        queue: dailyQueue,
        progress: newProgress,
      });
    }

    // Advance arithmetic daily training progress
    if (arithmeticDailyQueue && arithmeticDailyQueue[arithmeticDailyProgress] === record.gameId) {
      markArithmeticGameComplete(record.gameId);
      const newArithProgress = arithmeticDailyProgress + 1;
      storage.updateArithmeticTraining({
        date: record.timestamp.slice(0, 10),
        queue: arithmeticDailyQueue,
        progress: newArithProgress,
      });
    }

    // Evaluate achievements after save
    const updatedData = storage.load();
    const newIds = evaluateNewAchievements(updatedData);
    for (const id of newIds) {
      storage.unlockAchievement(id);
    }
    if (newIds.length > 0) {
      setAchievementToast(newIds[0]!);
    }
  }, [
    phase,
    round,
    correctRounds,
    gameId,
    mode,
    difficulty,
    score,
    accuracy,
    maxSpan,
    maxLevel,
    startedAt,
    finishedAt,
    extras,
    storage,
    setAchievementToast,
    markDailyGameComplete,
    dailyQueue,
    dailyProgress,
    markArithmeticGameComplete,
    arithmeticDailyQueue,
    arithmeticDailyProgress,
  ]);

  return stats;
}
