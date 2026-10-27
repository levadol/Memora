"use client";

import { useReducer, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { nBackReducer, generateNBackSequence } from "@/lib/games/n-back/logic";
import { N_BACK_TUTORIAL_STEPS } from "@/lib/games/n-back/tutorial";
import { createNBackScheduler } from "@/lib/scheduler/n-back";
import { realClock } from "@/lib/scheduler/realClock";
import type { NBackMode } from "@/lib/games/n-back/types";
import {
  TRIALS_PER_BLOCK,
  TARGET_RATE,
  FEEDBACK_DURATION_MS,
  READY_DURATION_MS,
  STARTING_N,
} from "@/lib/games/n-back/constants";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useSessionResult } from "@/lib/hooks/useSessionResult";
import { useGamePhase } from "@/lib/hooks/useGamePhase";
import { GameShell } from "@/components/games/shared/GameShell";
import { NBackGrid } from "./NBackGrid";
import { TutorialOverlay } from "@/components/games/shared/TutorialOverlay";
import { ResultScreen } from "@/components/games/shared/ResultScreen";
import { soundSystem } from "@/lib/audio/webAudio";
import { useAppStore } from "@/lib/store";

interface NBackGameProps {
  mode: string;
}

const IS_E2E = process.env.NEXT_PUBLIC_E2E === "1";

function deriveMode(mode: string): NBackMode {
  return mode === "letter" ? "letter" : "position";
}

export function NBackGame({ mode }: NBackGameProps) {
  const t = useTranslations();
  const closeGame = useAppStore((s) => s.closeGame);
  const appSettings = useAppStore((s) => s.settings);
  const activeGame = useAppStore((s) => s.activeGame);
  const DEFAULT_DIFFICULTY = activeGame?.difficulty ?? appSettings.defaultDifficulty;
  const gameMode = deriveMode(mode);
  const initialN = STARTING_N[DEFAULT_DIFFICULTY] ?? 2;

  const [state, dispatch] = useReducer(nBackReducer, {
    phase: "idle" as const,
    n: initialN,
    mode: gameMode,
    sequence: [],
    currentIndex: -1,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    round: 0,
    totalRounds: 5,
    correctRounds: 0,
    maxN: initialN,
    blockHistory: [],
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    difficulty: DEFAULT_DIFFICULTY,
    showTutorial: false,
  });

  const schedulerRef = useRef(
    createNBackScheduler(realClock, IS_E2E ? { stimulusOnMs: 80, stepMs: 130 } : undefined)
  );

  const letterAlphabetStr = t("games.nBack.letters");
  const letterAlphabet = letterAlphabetStr.split(",").map((l) => l.trim()).filter(Boolean);
  const alphabet: (number | string)[] =
    gameMode === "position" ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : letterAlphabet;

  const { personalBest, prevSessionResult, isNewRecord } = useSessionResult({
    phase: state.phase,
    gameId: "n-back",
    mode,
    difficulty: state.difficulty,
    score: state.correctRounds,
    accuracy: state.round > 0 ? state.correctRounds / state.round : 0,
    maxSpan: null,
    maxLevel: state.maxN,
    round: state.round,
    correctRounds: state.correctRounds,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    extras: {
      hits: state.hits,
      misses: state.misses,
      falseAlarms: state.falseAlarms,
      correctRejections: state.correctRejections,
      blockHistory: state.blockHistory,
    },
  });

  const { dailyNext } = useGamePhase({
    phase: state.phase,
    lastFeedbackCorrect: state.lastFeedbackCorrect,
    soundEnabled: appSettings.soundEnabled,
    volume: appSettings.volume,
    activePhases: ["stimulus"],
    readyDelayMs: READY_DURATION_MS,
    onReadyElapsed: () => {
      const totalTrials = TRIALS_PER_BLOCK + state.n;
      const seq = generateNBackSequence(state.n, totalTrials, TARGET_RATE, alphabet, Math.random);
      dispatch({ type: "READY_COMPLETE", sequence: seq, now: performance.now() });
    },
    feedbackDelayMs: FEEDBACK_DURATION_MS,
    onFeedbackElapsed: () => dispatch({ type: "FEEDBACK_COMPLETE", now: performance.now() }),
  });

  useEffect(() => {
    soundSystem.unlock();
    dispatch({ type: "START", n: initialN, mode: gameMode, difficulty: DEFAULT_DIFFICULTY, showTutorial: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // STIMULUS → drive scheduler
  useEffect(() => {
    if (state.phase !== "stimulus") return;
    const scheduler = schedulerRef.current;
    scheduler.start(state.sequence.length, (event) => {
      if (event.type === "STIMULUS_ON") dispatch({ type: "STIMULUS_ON", index: event.index });
      else if (event.type === "STIMULUS_OFF") dispatch({ type: "STIMULUS_OFF", index: event.index });
      else if (event.type === "BLOCK_COMPLETE") dispatch({ type: "BLOCK_COMPLETE", now: performance.now() });
    });
    return () => scheduler.stop();
  }, [state.phase, state.sequence.length]);

  // Keyboard: Space or M = RESPOND
  useEffect(() => {
    if (state.phase !== "stimulus") return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "m" || e.key === "M") {
        e.preventDefault();
        dispatch({ type: "RESPOND" });
        soundSystem.playTap();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.phase]);

  const reducedMotion = useReducedMotion();

  const handleRespond = useCallback(() => {
    if (state.phase !== "stimulus") return;
    soundSystem.playTap();
    dispatch({ type: "RESPOND" });
  }, [state.phase]);

  if (state.phase === "tutorial") {
    return (
      <TutorialOverlay
        steps={N_BACK_TUTORIAL_STEPS}
        onComplete={() => dispatch({ type: "TUTORIAL_SKIP" })}
      />
    );
  }

  if (state.phase === "result") {
    const durationSecs =
      state.startedAt != null && state.finishedAt != null
        ? Math.round((state.finishedAt - state.startedAt) / 1000)
        : 0;
    return (
      <ResultScreen
        data={{
          score: state.correctRounds,
          accuracy: state.round > 0 ? state.correctRounds / state.round : 0,
          maxSpan: null,
          maxLevel: state.maxN,
          durationSecs,
          personalBest,
          isNewRecord,
          prevSessionResult,
        }}
        about={{
          memorySystem: t("about.nBack.memorySystem"),
          researchBasis: t("about.nBack.researchBasis"),
          evidenceNote: t("about.nBack.evidenceNote"),
        }}
        onPlayAgain={() =>
          dispatch({ type: "RESTART", n: initialN, mode: gameMode, difficulty: DEFAULT_DIFFICULTY, showTutorial: false })
        }
        onHome={closeGame}
        dailyNext={dailyNext}
      />
    );
  }

  const phaseLabel = (() => {
    switch (state.phase) {
      case "ready": return t("game.getReady");
      case "stimulus": return gameMode === "letter" ? t("game.nBackWatchLetter") : t("game.nBackWatchPosition");
      default: return "";
    }
  })();

  const currentTrial = state.currentIndex >= 0 ? state.sequence[state.currentIndex] : null;
  const activeCell =
    state.phase === "stimulus" && gameMode === "position" && currentTrial ? Number(currentTrial.value) : null;
  const activeLetter =
    state.phase === "stimulus" && gameMode === "letter" && currentTrial ? String(currentTrial.value) : null;
  const alreadyResponded = state.currentIndex >= 0 && !!state.sequence[state.currentIndex]?.responded;
  const canRespond = state.phase === "stimulus" && !alreadyResponded;

  return (
    <GameShell
      stats={[
        { label: t("game.nBackBlock"), value: `${state.round + 1}/${state.totalRounds}` },
        { label: t("game.score"), value: state.correctRounds },
        { label: t("game.level"), value: `${state.n}-${t("game.nBackSuffix")}` },
      ]}
      phaseLabel={phaseLabel}
      feedbackCorrect={state.phase === "feedback" ? state.lastFeedbackCorrect : null}
      isPaused={state.phase === "paused"}
      onPause={() => dispatch({ type: "PAUSE" })}
      onResume={() => dispatch({ type: "RESUME" })}
      onRestart={() =>
        dispatch({ type: "RESTART", n: initialN, mode: gameMode, difficulty: DEFAULT_DIFFICULTY, showTutorial: false })
      }
      onQuit={closeGame}
      dataAttributes={
        IS_E2E
          ? {
              "data-nback-phase": state.phase,
              "data-nback-n": String(state.n),
              "data-nback-sequence": state.phase === "stimulus" ? JSON.stringify(state.sequence) : undefined,
              "data-nback-current-index":
                state.phase === "stimulus" && state.currentIndex >= 0 ? String(state.currentIndex) : undefined,
              "data-nback-block-stats":
                state.phase === "feedback"
                  ? JSON.stringify({ hits: state.hits, misses: state.misses, falseAlarms: state.falseAlarms, correctRejections: state.correctRejections })
                  : undefined,
            }
          : undefined
      }
    >
      {gameMode === "position" && <NBackGrid activeCell={activeCell} />}
      {gameMode === "letter" && (
        <div
          className="flex h-40 w-40 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-7xl font-bold text-[var(--color-text-primary)]"
          dir="ltr"
          aria-live="off"
        >
          {activeLetter ?? ""}
        </div>
      )}
      <motion.button
        type="button"
        onClick={handleRespond}
        disabled={!canRespond}
        aria-label={t("game.nBackMatch")}
        aria-pressed={alreadyResponded}
        whileTap={!reducedMotion && canRespond ? { scale: 0.93 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={[
          "rounded-[var(--radius-md)] border border-[var(--color-accent)] px-8 py-4 text-lg font-semibold text-[var(--color-accent)] transition-all",
          canRespond
            ? "opacity-100 hover:bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)]"
            : "cursor-not-allowed opacity-35",
        ].join(" ")}
      >
        {t("game.nBackMatch")}
      </motion.button>
    </GameShell>
  );
}
