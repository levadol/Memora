"use client";

import { useReducer, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { tofReducer } from "@/lib/games/arithmetic-tof/logic";
import { TOF_TUTORIAL_STEPS } from "@/lib/games/arithmetic-tof/tutorial";
import {
  TOTAL_ITEMS,
  FEEDBACK_DURATION_MS,
  READY_DURATION_MS,
  FEEDBACK_DURATION_E2E_MS,
  READY_DURATION_E2E_MS,
  itemTimeLimitMs,
} from "@/lib/games/arithmetic-tof/constants";
import { generateTofSession } from "@/lib/games/arithmetic-tof/generate";
import { createTofScheduler } from "@/lib/scheduler/tof";
import { realClock } from "@/lib/scheduler/realClock";
import { useSessionResult } from "@/lib/hooks/useSessionResult";
import { useGamePhase } from "@/lib/hooks/useGamePhase";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useStorage } from "@/lib/storage/StorageContext";
import { TutorialOverlay } from "@/components/games/shared/TutorialOverlay";
import { ResultScreen } from "@/components/games/shared/ResultScreen";
import { GameShell } from "@/components/games/shared/GameShell";
import { TofEquation } from "./TofEquation";
import { TofButtons } from "./TofButtons";
import { TofTimerBar } from "./TofTimerBar";
import { FeedbackDisplay } from "@/components/games/shared/FeedbackDisplay";
import { soundSystem } from "@/lib/audio/webAudio";
import { useAppStore } from "@/lib/store";
import type { TofState } from "@/lib/games/arithmetic-tof/types";

interface ArithmeticTofGameProps {
  mode: string;
}

const isE2E = process.env.NEXT_PUBLIC_E2E === "1";

const INITIAL_STATE: TofState = {
  phase: "idle",
  difficulty: "medium",
  subLevel: 0,
  consecutiveCorrect: 0,
  consecutiveWrong: 0,
  items: [],
  currentIndex: 0,
  hits: 0,
  misses: 0,
  falseAlarms: 0,
  correctRejections: 0,
  responseTimes: [],
  itemStartedAt: null,
  startedAt: null,
  finishedAt: null,
  lastFeedbackCorrect: null,
  showTutorial: false,
};

export function ArithmeticTofGame({ mode }: ArithmeticTofGameProps) {
  const t = useTranslations();
  const closeGame = useAppStore((s) => s.closeGame);
  const appSettings = useAppStore((s) => s.settings);
  const activeGame = useAppStore((s) => s.activeGame);
  const storage = useStorage();
  useReducedMotion();

  const DEFAULT_DIFFICULTY = activeGame?.difficulty ?? appSettings.defaultDifficulty;

  const [state, dispatch] = useReducer(tofReducer, INITIAL_STATE);
  const stateRef = useRef(state);
  // eslint-disable-next-line react-hooks/refs
  stateRef.current = state;

  const schedulerRef = useRef(createTofScheduler(realClock));

  const currentItem = state.items[state.currentIndex] ?? null;
  const timeLimitMs = itemTimeLimitMs(state.difficulty, state.subLevel, isE2E);

  const accuracy =
    state.currentIndex > 0
      ? (state.hits + state.correctRejections) / state.currentIndex
      : 0;

  const { personalBest, prevSessionResult, isNewRecord } = useSessionResult({
    phase: state.phase,
    gameId: "arithmetic-tof",
    mode,
    difficulty: state.difficulty,
    score: Math.round(accuracy * 100),
    accuracy,
    maxSpan: null,
    maxLevel: null,
    round: state.currentIndex,
    correctRounds: state.hits + state.correctRejections,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    extras: {
      hits: state.hits,
      misses: state.misses,
      falseAlarms: state.falseAlarms,
      correctRejections: state.correctRejections,
      responseTimes: state.responseTimes,
    },
  });

  const onReadyElapsed = useCallback(() => {
    dispatch({ type: "READY_COMPLETE", now: performance.now() });
  }, []);

  const onFeedbackElapsed = useCallback(() => {
    dispatch({ type: "FEEDBACK_COMPLETE", now: performance.now() });
  }, []);

  const { dailyNext } = useGamePhase({
    phase: state.phase,
    lastFeedbackCorrect: state.lastFeedbackCorrect,
    soundEnabled: appSettings.soundEnabled,
    volume: appSettings.volume,
    activePhases: ["showing", "feedback"],
    readyDelayMs: isE2E ? READY_DURATION_E2E_MS : READY_DURATION_MS,
    onReadyElapsed,
    feedbackDelayMs: isE2E ? FEEDBACK_DURATION_E2E_MS : FEEDBACK_DURATION_MS,
    onFeedbackElapsed,
  });

  // Mount: start the game
  useEffect(() => {
    soundSystem.unlock();
    const data = storage.load();
    const hasPrior = data.sessions.some((s) => s.gameId === "arithmetic-tof");
    const items = generateTofSession(DEFAULT_DIFFICULTY, 1, Math.random);
    dispatch({
      type: "START",
      difficulty: DEFAULT_DIFFICULTY,
      showTutorial: !hasPrior,
      items,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SHOWING → run item timer
  useEffect(() => {
    if (state.phase !== "showing") return;
    const scheduler = schedulerRef.current;
    scheduler.startItem(timeLimitMs, () => {
      dispatch({ type: "TIMEOUT", now: performance.now() });
    });
    return () => scheduler.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.currentIndex]);

  function handleAnswer(choice: boolean) {
    const s = stateRef.current;
    if (s.phase !== "showing") return;
    soundSystem.playTap();
    dispatch({ type: "ANSWER", choice, now: performance.now() });
  }

  // Keyboard handler: T/F keys + ArrowLeft/ArrowRight (RTL-aware)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const s = stateRef.current;
      if (s.phase !== "showing") return;
      const key = e.key;

      if (key === "t" || key === "T") {
        e.preventDefault();
        handleAnswer(true);
      } else if (key === "f" || key === "F") {
        e.preventDefault();
        handleAnswer(false);
      } else if (key === "ArrowLeft" || key === "ArrowRight") {
        e.preventDefault();
        const isRTL =
          document.documentElement.dir === "rtl" ||
          document.body.dir === "rtl";
        // ArrowLeft = visual left button; ArrowRight = visual right button
        // LTR: [True][False] → left = True; RTL: [False][True] → left = False
        const leftIsTrue = !isRTL;
        if (key === "ArrowLeft") handleAnswer(leftIsTrue);
        else handleAnswer(!leftIsTrue);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function handleResume() {
    dispatch({ type: "RESUME" });
  }

  function handlePlayAgain() {
    const items = generateTofSession(DEFAULT_DIFFICULTY, 1, Math.random);
    dispatch({ type: "RESTART", difficulty: DEFAULT_DIFFICULTY, showTutorial: false, items });
  }

  if (state.phase === "tutorial") {
    return (
      <TutorialOverlay
        steps={TOF_TUTORIAL_STEPS}
        onComplete={() => dispatch({ type: "TUTORIAL_SKIP" })}
      />
    );
  }

  if (state.phase === "result") {
    const durationSecs =
      state.startedAt != null && state.finishedAt != null
        ? Math.round((state.finishedAt - state.startedAt) / 1000)
        : 0;
    const meanRt =
      state.responseTimes.length > 0
        ? Math.round(
            state.responseTimes.reduce((a, b) => a + b, 0) / state.responseTimes.length
          )
        : 0;
    return (
      <ResultScreen
        data={{
          score: Math.round(accuracy * 100),
          accuracy,
          maxSpan: null,
          maxLevel: null,
          durationSecs,
          personalBest,
          isNewRecord,
          prevSessionResult,
          extras: [
            { label: t("game.tofHits"), value: state.hits },
            { label: t("game.tofFalseAlarms"), value: state.falseAlarms },
            { label: t("game.tofMeanRt"), value: `${meanRt} ms` },
          ],
        }}
        about={{
          memorySystem: t("about.arithmeticTof.memorySystem"),
          researchBasis: t("about.arithmeticTof.researchBasis"),
          evidenceNote: t("about.arithmeticTof.evidenceNote"),
        }}
        onPlayAgain={handlePlayAgain}
        onHome={closeGame}
        dailyNext={dailyNext}
      />
    );
  }

  const phaseLabel = (() => {
    switch (state.phase) {
      case "ready":
        return t("game.getReady");
      case "showing":
        return t("game.tofShowingPhase");
      default:
        return "";
    }
  })();

  const inlineFeedbackCorrect =
    state.phase === "feedback" ? state.lastFeedbackCorrect : null;

  return (
    <GameShell
      stats={[
        {
          label: t("game.tofScore"),
          value: `${Math.round(accuracy * 100)}%`,
        },
      ]}
      phaseLabel={phaseLabel}
      feedbackCorrect={inlineFeedbackCorrect}
      feedbackPlacement="inline"
      isPaused={state.phase === "paused"}
      onPause={() => dispatch({ type: "PAUSE" })}
      onResume={handleResume}
      onRestart={handlePlayAgain}
      onQuit={closeGame}
    >
      <div className="flex flex-col items-center gap-4 px-4">
        {(state.phase === "showing" || state.phase === "feedback") && currentItem && (
          <>
            {/* Per-item countdown + "12 / 30" progress */}
            <TofTimerBar
              key={state.currentIndex}
              durationMs={timeLimitMs}
              currentIndex={state.currentIndex}
              totalItems={TOTAL_ITEMS}
            />

            {/* Equation card — border tints green/red during feedback */}
            <TofEquation
              text={currentItem.text}
              isTrue={currentItem.isTrue}
              showDataAttr={isE2E && state.phase === "showing"}
              feedbackCorrect={inlineFeedbackCorrect}
            />

            {/* Fixed-height inline feedback slot so buttons don't jump */}
            <div
              className="flex items-center justify-center"
              style={{ height: "48px" }}
              aria-live="assertive"
              aria-atomic="true"
            >
              <FeedbackDisplay feedbackCorrect={inlineFeedbackCorrect} />
            </div>

            {/* True / False buttons */}
            <TofButtons
              onAnswer={handleAnswer}
              disabled={state.phase === "feedback"}
            />
          </>
        )}
        {state.phase === "ready" && currentItem && (
          <div
            className="ltr-nums flex min-h-[4rem] items-center justify-center rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)] px-8 py-4 text-3xl font-bold text-[var(--color-text-secondary)]"
            style={{ width: "min(calc(100% - 32px), 440px)" }}
          >
            {currentItem.text}
          </div>
        )}
      </div>
    </GameShell>
  );
}
