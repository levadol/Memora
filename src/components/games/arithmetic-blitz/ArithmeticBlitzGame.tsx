"use client";

import { useReducer, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { blitzReducer } from "@/lib/games/arithmetic-blitz/logic";
import { BLITZ_TUTORIAL_STEPS } from "@/lib/games/arithmetic-blitz/tutorial";
import {
  SESSION_DURATION_SECONDS,
  TICK_INTERVAL_REAL_MS,
  TICK_INTERVAL_E2E_MS,
  READY_DURATION_MS,
  FEEDBACK_CLEAR_MS,
  LAST_SECONDS_THRESHOLD,
} from "@/lib/games/arithmetic-blitz/constants";
import { createBlitzScheduler } from "@/lib/scheduler/blitz";
import { realClock } from "@/lib/scheduler/realClock";
import { generateProblem, initialAdaptiveState } from "@/lib/arithmetic/generate";
import { DEFAULT_OPS } from "@/lib/arithmetic/constants";
import { useSessionResult } from "@/lib/hooks/useSessionResult";
import { useGamePhase } from "@/lib/hooks/useGamePhase";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useStorage } from "@/lib/storage/StorageContext";
import { TutorialOverlay } from "@/components/games/shared/TutorialOverlay";
import { ResultScreen } from "@/components/games/shared/ResultScreen";
import { GameShell } from "@/components/games/shared/GameShell";
import { NumericKeypad } from "./NumericKeypad";
import { BlitzTimerRing } from "./BlitzTimerRing";
import { soundSystem } from "@/lib/audio/webAudio";
import { useAppStore } from "@/lib/store";
import type { BlitzState } from "@/lib/games/arithmetic-blitz/types";

interface ArithmeticBlitzGameProps {
  mode: string;
}

const isE2E = process.env.NEXT_PUBLIC_E2E === "1";
const tickIntervalMs = isE2E ? TICK_INTERVAL_E2E_MS : TICK_INTERVAL_REAL_MS;

const INITIAL_STATE: BlitzState = {
  phase: "idle",
  difficulty: "medium",
  adaptive: initialAdaptiveState("medium"),
  currentProblem: null,
  prevProblemText: null,
  typedInput: "",
  timeRemainingSeconds: SESSION_DURATION_SECONDS,
  sessionDurationSeconds: SESSION_DURATION_SECONDS,
  correctCount: 0,
  incorrectCount: 0,
  responseTimes: [],
  problemStartedAt: null,
  startedAt: null,
  finishedAt: null,
  lastFeedbackCorrect: null,
  showTutorial: false,
};

export function ArithmeticBlitzGame({ mode }: ArithmeticBlitzGameProps) {
  const t = useTranslations();
  const closeGame = useAppStore((s) => s.closeGame);
  const appSettings = useAppStore((s) => s.settings);
  const activeGame = useAppStore((s) => s.activeGame);
  const storage = useStorage();
  const reducedMotion = useReducedMotion();

  const DEFAULT_DIFFICULTY = activeGame?.difficulty ?? appSettings.defaultDifficulty;

  const [state, dispatch] = useReducer(blitzReducer, INITIAL_STATE);

  // Keep a ref of the current state for the keyboard handler (avoids stale closures).
  // Assigning during render is intentional — ref is read-only in effects and handlers.
  const stateRef = useRef(state);
  // eslint-disable-next-line react-hooks/refs
  stateRef.current = state;

  const schedulerRef = useRef(createBlitzScheduler(realClock));

  const { personalBest, prevSessionResult, isNewRecord } = useSessionResult({
    phase: state.phase,
    gameId: "arithmetic-blitz",
    mode,
    difficulty: state.difficulty,
    score: state.correctCount,
    accuracy:
      state.correctCount + state.incorrectCount > 0
        ? state.correctCount / (state.correctCount + state.incorrectCount)
        : 0,
    maxSpan: null,
    maxLevel: state.correctCount,
    round: state.correctCount + state.incorrectCount,
    correctRounds: state.correctCount,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    extras: {
      attempted: state.correctCount + state.incorrectCount,
      accuracy:
        state.correctCount + state.incorrectCount > 0
          ? state.correctCount / (state.correctCount + state.incorrectCount)
          : 0,
      meanResponseTimeMs:
        state.responseTimes.length > 0
          ? Math.round(
              state.responseTimes.reduce((a, b) => a + b, 0) / state.responseTimes.length
            )
          : 0,
      finalSubLevel: state.adaptive.subLevel,
    },
  });

  const onReadyElapsed = useCallback(() => {
    dispatch({ type: "READY_COMPLETE", now: performance.now() });
  }, []);

  const { dailyNext } = useGamePhase({
    phase: state.phase,
    lastFeedbackCorrect: state.lastFeedbackCorrect,
    soundEnabled: appSettings.soundEnabled,
    volume: appSettings.volume,
    activePhases: ["ready", "playing"],
    readyDelayMs: READY_DURATION_MS,
    onReadyElapsed,
  });

  // Mount: start the game
  useEffect(() => {
    soundSystem.unlock();
    const data = storage.load();
    const hasPrior = data.sessions.some((s) => s.gameId === "arithmetic-blitz");
    const problem = generateProblem(DEFAULT_DIFFICULTY, 1, DEFAULT_OPS[DEFAULT_DIFFICULTY], Math.random);
    dispatch({
      type: "START",
      difficulty: DEFAULT_DIFFICULTY,
      showTutorial: !hasPrior,
      sessionDurationSeconds: SESSION_DURATION_SECONDS,
      problem,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scheduler while playing
  useEffect(() => {
    if (state.phase !== "playing") return;
    const scheduler = schedulerRef.current;
    scheduler.start(state.sessionDurationSeconds, tickIntervalMs, (event) => {
      if (event.type === "TICK") {
        dispatch({ type: "TICK" });
        // Read current time remaining from ref (avoid stale closure)
        if (stateRef.current.timeRemainingSeconds <= LAST_SECONDS_THRESHOLD) {
          soundSystem.playTick();
        }
      } else if (event.type === "TIME_UP") {
        dispatch({ type: "TIME_UP", now: performance.now() });
      }
    });
    return () => scheduler.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Clear feedback after FEEDBACK_CLEAR_MS
  useEffect(() => {
    if (state.lastFeedbackCorrect === null) return;
    const id = setTimeout(() => dispatch({ type: "CLEAR_FEEDBACK" }), FEEDBACK_CLEAR_MS);
    return () => clearTimeout(id);
    // Re-run whenever feedback changes (new answer submitted)
  }, [state.lastFeedbackCorrect, state.correctCount, state.incorrectCount]);

  function handleCharWithState(char: string, s: BlitzState) {
    if (!s.currentProblem) return;
    soundSystem.playTap();
    const newInput = s.typedInput + char;
    const expectedLen = String(Math.abs(s.currentProblem.answer)).length;
    // Always dispatch KEY_INPUT first so typedInput is correct when SUBMIT_ANSWER runs.
    // React's useReducer processes sequential dispatches with accumulated state.
    dispatch({ type: "KEY_INPUT", char });
    if (newInput.length >= expectedLen) {
      const nextProblem = generateProblem(
        s.difficulty,
        s.adaptive.subLevel,
        DEFAULT_OPS[s.difficulty],
        Math.random,
        s.currentProblem.text
      );
      dispatch({ type: "SUBMIT_ANSWER", now: performance.now(), nextProblem });
    }
  }

  function handleChar(char: string) {
    handleCharWithState(char, stateRef.current);
  }

  function handleEnter() {
    const s = stateRef.current;
    if (s.phase !== "playing" || !s.currentProblem || s.typedInput === "") return;
    soundSystem.playTap();
    const nextProblem = generateProblem(
      s.difficulty,
      s.adaptive.subLevel,
      DEFAULT_OPS[s.difficulty],
      Math.random,
      s.currentProblem.text
    );
    dispatch({ type: "SUBMIT_ANSWER", now: performance.now(), nextProblem });
  }

  function handleBackspace() {
    dispatch({ type: "BACKSPACE" });
  }

  // Keyboard handler — uses stateRef to always read fresh state (registered once)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const s = stateRef.current;
      if (s.phase !== "playing") return;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleCharWithState(e.key, s);
      } else if (e.key === "-" && s.currentProblem && s.currentProblem.answer < 0) {
        e.preventDefault();
        dispatch({ type: "KEY_INPUT", char: "-" });
      } else if (e.key === "Backspace") {
        e.preventDefault();
        dispatch({ type: "BACKSPACE" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (s.currentProblem && s.typedInput !== "") {
          const nextProblem = generateProblem(
            s.difficulty,
            s.adaptive.subLevel,
            DEFAULT_OPS[s.difficulty],
            Math.random,
            s.currentProblem.text
          );
          dispatch({ type: "SUBMIT_ANSWER", now: performance.now(), nextProblem });
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function handleResume() {
    const problem = generateProblem(
      DEFAULT_DIFFICULTY,
      state.adaptive.subLevel,
      DEFAULT_OPS[DEFAULT_DIFFICULTY],
      Math.random
    );
    dispatch({ type: "RESUME", problem });
  }

  function handlePlayAgain() {
    const problem = generateProblem(DEFAULT_DIFFICULTY, 1, DEFAULT_OPS[DEFAULT_DIFFICULTY], Math.random);
    dispatch({
      type: "RESTART",
      difficulty: DEFAULT_DIFFICULTY,
      showTutorial: false,
      sessionDurationSeconds: SESSION_DURATION_SECONDS,
      problem,
    });
  }

  if (state.phase === "tutorial") {
    return (
      <TutorialOverlay
        steps={BLITZ_TUTORIAL_STEPS}
        onComplete={() => dispatch({ type: "TUTORIAL_SKIP" })}
      />
    );
  }

  if (state.phase === "result") {
    const durationSecs =
      state.startedAt != null && state.finishedAt != null
        ? Math.round((state.finishedAt - state.startedAt) / 1000)
        : SESSION_DURATION_SECONDS;

    return (
      <ResultScreen
        data={{
          score: state.correctCount,
          accuracy:
            state.correctCount + state.incorrectCount > 0
              ? state.correctCount / (state.correctCount + state.incorrectCount)
              : 0,
          maxSpan: null,
          maxLevel: state.correctCount,
          durationSecs,
          personalBest,
          isNewRecord,
          prevSessionResult,
        }}
        about={{
          memorySystem: t("about.arithmeticBlitz.memorySystem"),
          researchBasis: t("about.arithmeticBlitz.researchBasis"),
          evidenceNote: t("about.arithmeticBlitz.evidenceNote"),
        }}
        onPlayAgain={handlePlayAgain}
        onHome={closeGame}
        dailyNext={dailyNext}
      />
    );
  }

  const isUrgent =
    state.phase === "playing" && state.timeRemainingSeconds <= LAST_SECONDS_THRESHOLD;

  const phaseLabel = (() => {
    switch (state.phase) {
      case "ready":
        return t("game.getReady");
      case "playing":
        return t("game.blitzPlaying");
      default:
        return "";
    }
  })();

  const showMinus =
    state.currentProblem != null && state.currentProblem.answer < 0;

  return (
    <GameShell
      stats={[
        { label: t("game.blitzScore"), value: state.correctCount },
        { label: t("game.blitzTimer"), value: state.timeRemainingSeconds },
      ]}
      phaseLabel={phaseLabel}
      feedbackCorrect={state.phase === "playing" ? state.lastFeedbackCorrect : null}
      isPaused={state.phase === "paused"}
      onPause={() => dispatch({ type: "PAUSE" })}
      onResume={handleResume}
      onRestart={handlePlayAgain}
      onQuit={closeGame}
      dataAttributes={
        isE2E && state.phase === "playing" && state.currentProblem
          ? { "data-answer": String(state.currentProblem.answer) }
          : undefined
      }
    >
      <div className="flex flex-col items-center gap-6">
        <BlitzTimerRing
          timeRemaining={state.timeRemainingSeconds}
          total={state.sessionDurationSeconds}
          isUrgent={isUrgent}
          reducedMotion={reducedMotion}
        />

        {state.currentProblem && state.phase === "playing" && (
          <div className="flex flex-col items-center gap-4">
            <div
              className="ltr-nums text-4xl font-bold text-[var(--color-text-primary)]"
              aria-live="polite"
              aria-atomic="true"
            >
              {state.currentProblem.text}
            </div>

            <div
              className="ltr-nums min-h-[3rem] rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface)] px-6 py-3 text-center text-3xl font-bold text-[var(--color-accent)]"
              aria-label="Your answer"
              aria-live="polite"
            >
              {state.typedInput || " "}
            </div>

            <NumericKeypad
              onDigit={handleChar}
              onBackspace={handleBackspace}
              onSubmit={handleEnter}
              showMinus={showMinus}
            />
          </div>
        )}

        {state.phase === "ready" && (
          <div className="text-lg text-[var(--color-text-secondary)]">
            {t("game.getReady")}
          </div>
        )}
      </div>
    </GameShell>
  );
}
