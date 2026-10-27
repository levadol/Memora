"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { soundSystem } from "@/lib/audio/webAudio";

/**
 * Handles the repeated phase-effect logic common to every game component:
 * - Syncs sound settings to the audio system
 * - Sets/clears the round-in-progress flag
 * - Fires a callback after a timeout when phase === "ready"
 * - Plays correct/incorrect sound and fires a callback after a timeout when phase === "feedback"
 * - Computes the daily-training "next step" action for the result screen
 */
export interface GamePhaseOptions {
  phase: string;
  lastFeedbackCorrect: boolean | null;
  soundEnabled: boolean;
  volume: number;
  /** Phases that count as "round in progress" — defaults to ["ready","preview","input","feedback","sequence","study","test"] */
  activePhases?: string[];
  readyDelayMs?: number;
  onReadyElapsed?: () => void;
  feedbackDelayMs?: number;
  onFeedbackElapsed?: () => void;
}

export interface DailyNextAction {
  label: string;
  onPress: () => void;
}

const DEFAULT_ACTIVE_PHASES = ["ready", "preview", "input", "feedback", "sequence", "study", "test"];

export function useGamePhase(opts: GamePhaseOptions): { dailyNext: DailyNextAction | null } {
  const {
    phase,
    lastFeedbackCorrect,
    soundEnabled,
    volume,
    activePhases = DEFAULT_ACTIVE_PHASES,
    readyDelayMs,
    onReadyElapsed,
    feedbackDelayMs,
    onFeedbackElapsed,
  } = opts;

  const t = useTranslations();
  const setRoundInProgress = useAppStore((s) => s.setRoundInProgress);
  const dailyQueue = useAppStore((s) => s.dailyQueue);
  const dailySummary = useAppStore((s) => s.dailySummary);
  const continueDaily = useAppStore((s) => s.continueDaily);
  const closeGame = useAppStore((s) => s.closeGame);

  // Sync sound settings
  useEffect(() => {
    soundSystem.setMuted(!soundEnabled);
    soundSystem.setVolume(volume);
  }, [soundEnabled, volume]);

  // Round in progress flag
  useEffect(() => {
    setRoundInProgress(activePhases.includes(phase));
    return () => setRoundInProgress(false);
  }, [phase, activePhases, setRoundInProgress]);

  // Ready phase timeout
  useEffect(() => {
    if (phase !== "ready" || !onReadyElapsed || !readyDelayMs) return;
    const id = setTimeout(onReadyElapsed, readyDelayMs);
    return () => clearTimeout(id);
  }, [phase, readyDelayMs, onReadyElapsed]);

  // Feedback sound + timeout
  useEffect(() => {
    if (phase !== "feedback") return;
    if (lastFeedbackCorrect === true) {
      soundSystem.playCorrect();
    } else if (lastFeedbackCorrect === false) {
      soundSystem.playIncorrect();
    }
    if (!onFeedbackElapsed || !feedbackDelayMs) return;
    const id = setTimeout(onFeedbackElapsed, feedbackDelayMs);
    return () => clearTimeout(id);
  }, [phase, lastFeedbackCorrect, feedbackDelayMs, onFeedbackElapsed]);

  // Daily next action for result screen
  const dailyNext: DailyNextAction | null = dailyQueue !== null
    ? dailySummary
      ? { label: t("results.viewDailySummary"), onPress: closeGame }
      : { label: t("results.nextDailyGame"), onPress: continueDaily }
    : null;

  return { dailyNext };
}
