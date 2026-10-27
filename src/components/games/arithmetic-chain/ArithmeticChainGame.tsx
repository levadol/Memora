"use client";

import { useReducer, useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { chainReducer } from "@/lib/games/arithmetic-chain/logic";
import { CHAIN_TUTORIAL_STEPS } from "@/lib/games/arithmetic-chain/tutorial";
import {
  TOTAL_ROUNDS,
  FEEDBACK_DURATION_MS,
  READY_DURATION_MS,
  STEP_DISPLAY_MS,
  STEP_DISPLAY_E2E_MS,
} from "@/lib/games/arithmetic-chain/constants";
import { generateChain } from "@/lib/games/arithmetic-chain/generate";
import { createChainScheduler } from "@/lib/scheduler/chain";
import { realClock } from "@/lib/scheduler/realClock";
import { useSessionResult } from "@/lib/hooks/useSessionResult";
import { useGamePhase } from "@/lib/hooks/useGamePhase";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useStorage } from "@/lib/storage/StorageContext";
import { TutorialOverlay } from "@/components/games/shared/TutorialOverlay";
import { ResultScreen } from "@/components/games/shared/ResultScreen";
import { GameShell } from "@/components/games/shared/GameShell";
import { NumericKeypad } from "@/components/games/arithmetic-blitz/NumericKeypad";
import { ChainDisplay } from "./ChainDisplay";
import { FeedbackDisplay } from "@/components/games/shared/FeedbackDisplay";
import { soundSystem } from "@/lib/audio/webAudio";
import { useAppStore } from "@/lib/store";
import type { ChainState } from "@/lib/games/arithmetic-chain/types";

interface ArithmeticChainGameProps {
  mode: string;
}

const isE2E = process.env.NEXT_PUBLIC_E2E === "1";

const INITIAL_STATE: ChainState = {
  phase: "idle",
  difficulty: "medium",
  chainLength: 3,
  maxChainLength: 3,
  consecutiveErrors: 0,
  round: 0,
  currentProblem: null,
  typedInput: "",
  lastFeedbackCorrect: null,
  startedAt: null,
  finishedAt: null,
  roundResponseTimes: [],
  roundStartedAt: null,
  correctRounds: 0,
  showTutorial: false,
};

export function ArithmeticChainGame({ mode }: ArithmeticChainGameProps) {
  const t = useTranslations();
  const closeGame = useAppStore((s) => s.closeGame);
  const appSettings = useAppStore((s) => s.settings);
  const activeGame = useAppStore((s) => s.activeGame);
  const storage = useStorage();
  const reducedMotion = useReducedMotion();

  const DEFAULT_DIFFICULTY = activeGame?.difficulty ?? appSettings.defaultDifficulty;

  const [state, dispatch] = useReducer(chainReducer, INITIAL_STATE);
  const stateRef = useRef(state);
  // eslint-disable-next-line react-hooks/refs
  stateRef.current = state;

  const schedulerRef = useRef(createChainScheduler(realClock));
  const [shownIndex, setShownIndex] = useState<number | null>(null);

  const stepDisplayMs = isE2E
    ? STEP_DISPLAY_E2E_MS[DEFAULT_DIFFICULTY]
    : STEP_DISPLAY_MS[DEFAULT_DIFFICULTY];

  const { personalBest, prevSessionResult, isNewRecord } = useSessionResult({
    phase: state.phase,
    gameId: "arithmetic-chain",
    mode,
    difficulty: state.difficulty,
    score: state.maxChainLength,
    accuracy: state.round > 0 ? state.correctRounds / state.round : 0,
    maxSpan: null,
    maxLevel: state.maxChainLength,
    round: state.round,
    correctRounds: state.correctRounds,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    extras: {
      maxChainLength: state.maxChainLength,
      roundResponseTimes: state.roundResponseTimes,
    },
  });

  const onReadyElapsed = useCallback(() => {
    dispatch({ type: "READY_COMPLETE", now: performance.now() });
  }, []);

  const onFeedbackElapsed = useCallback(() => {
    const s = stateRef.current;
    const nextProblem =
      s.round < TOTAL_ROUNDS
        ? generateChain(s.difficulty, 1, s.chainLength, Math.random)
        : null;
    dispatch({ type: "FEEDBACK_COMPLETE", now: performance.now(), nextProblem });
  }, []);

  const { dailyNext } = useGamePhase({
    phase: state.phase,
    lastFeedbackCorrect: state.lastFeedbackCorrect,
    soundEnabled: appSettings.soundEnabled,
    volume: appSettings.volume,
    activePhases: ["showing", "input", "feedback"],
    readyDelayMs: READY_DURATION_MS,
    onReadyElapsed,
    feedbackDelayMs: FEEDBACK_DURATION_MS,
    onFeedbackElapsed,
  });

  // Mount: start the game
  useEffect(() => {
    soundSystem.unlock();
    const data = storage.load();
    const hasPrior = data.sessions.some((s) => s.gameId === "arithmetic-chain");
    const problem = generateChain(DEFAULT_DIFFICULTY, 1, 3, Math.random);
    dispatch({
      type: "START",
      difficulty: DEFAULT_DIFFICULTY,
      showTutorial: !hasPrior,
      problem,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SHOWING → drive the chain scheduler
  useEffect(() => {
    if (state.phase !== "showing" || !state.currentProblem) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShownIndex(null);
    const scheduler = schedulerRef.current;
    const stepCount = state.chainLength + 1; // starting number + each op
    scheduler.start(stepCount, stepDisplayMs, (event) => {
      if (event.type === "STEP_SHOW") {
        setShownIndex(event.index);
      } else if (event.type === "CHAIN_COMPLETE") {
        dispatch({ type: "CHAIN_COMPLETE", now: performance.now() });
      }
    });
    return () => {
      scheduler.stop();
      setShownIndex(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.round]);

  function handleChar(char: string) {
    soundSystem.playTap();
    dispatch({ type: "KEY_INPUT", char });
  }

  function handleBackspace() {
    dispatch({ type: "BACKSPACE" });
  }

  function handleSubmit() {
    const s = stateRef.current;
    if (s.phase !== "input" || !s.currentProblem || s.typedInput === "") return;
    soundSystem.playTap();
    const nextProblem =
      s.round < TOTAL_ROUNDS - 1
        ? generateChain(s.difficulty, 1, s.chainLength, Math.random)
        : null;
    dispatch({ type: "SUBMIT_ANSWER", now: performance.now(), nextProblem });
  }

  // Keyboard handler
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const s = stateRef.current;
      if (s.phase !== "input") return;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleChar(e.key);
      } else if (e.key === "-") {
        e.preventDefault();
        dispatch({ type: "KEY_INPUT", char: "-" });
      } else if (e.key === "Backspace") {
        e.preventDefault();
        dispatch({ type: "BACKSPACE" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function handleResume() {
    const s = stateRef.current;
    const problem = generateChain(s.difficulty, 1, s.chainLength, Math.random);
    dispatch({ type: "RESUME", problem });
  }

  function handlePlayAgain() {
    const problem = generateChain(DEFAULT_DIFFICULTY, 1, 3, Math.random);
    dispatch({ type: "RESTART", difficulty: DEFAULT_DIFFICULTY, showTutorial: false, problem });
  }

  if (state.phase === "tutorial") {
    return (
      <TutorialOverlay
        steps={CHAIN_TUTORIAL_STEPS}
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
          score: state.maxChainLength,
          accuracy: state.round > 0 ? state.correctRounds / state.round : 0,
          maxSpan: null,
          maxLevel: state.maxChainLength,
          durationSecs,
          personalBest,
          isNewRecord,
          prevSessionResult,
        }}
        about={{
          memorySystem: t("about.arithmeticChain.memorySystem"),
          researchBasis: t("about.arithmeticChain.researchBasis"),
          evidenceNote: t("about.arithmeticChain.evidenceNote"),
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
        return t("game.chainShowingPhase");
      case "input":
        return t("game.chainInputPhase");
      default:
        return "";
    }
  })();

  return (
    <GameShell
      stats={[
        { label: t("game.chainRound"), value: `${state.round + 1}/${TOTAL_ROUNDS}` },
        { label: t("game.chainMaxLength"), value: state.maxChainLength },
      ]}
      phaseLabel={phaseLabel}
      feedbackCorrect={state.phase === "feedback" ? state.lastFeedbackCorrect : null}
      feedbackPlacement="inline"
      isPaused={state.phase === "paused"}
      onPause={() => dispatch({ type: "PAUSE" })}
      onResume={handleResume}
      onRestart={handlePlayAgain}
      onQuit={closeGame}
      dataAttributes={
        isE2E && state.phase === "input" && state.currentProblem
          ? { "data-answer": String(state.currentProblem.answer) }
          : undefined
      }
    >
      <div className="flex flex-col items-center gap-6">
        {(state.phase === "showing" || state.phase === "ready") && state.currentProblem && (
          <div className="flex min-h-[80px] items-center justify-center">
            {state.phase === "showing" && (
              <ChainDisplay problem={state.currentProblem} shownIndex={shownIndex} />
            )}
          </div>
        )}

        {state.phase === "input" && state.currentProblem && (
          <div className="flex flex-col items-center gap-4">
            <div
              className="ltr-nums flex items-center justify-end rounded-xl border-2 border-[var(--color-glass-border)] bg-[var(--color-surface)] px-6 font-bold text-[var(--color-accent)]"
              style={{
                width: "min(calc(100% - 32px), 440px)",
                height: "72px",
                fontSize: "40px",
                direction: "ltr",
                margin: "0 auto",
              }}
              aria-label={t("game.chainInputPhase")}
              aria-live="polite"
            >
              {state.typedInput || "_"}
            </div>
            <NumericKeypad
              onDigit={handleChar}
              onBackspace={handleBackspace}
              onSubmit={handleSubmit}
              showMinus={false}
              disabled={!reducedMotion && state.phase !== "input"}
            />
          </div>
        )}

        {/* Inline feedback under the keypad for feedback phase */}
        {state.phase === "feedback" && (
          <div
            className="flex items-center justify-center"
            style={{ height: "48px" }}
            aria-live="assertive"
            aria-atomic="true"
          >
            <FeedbackDisplay feedbackCorrect={state.lastFeedbackCorrect} />
          </div>
        )}
      </div>
    </GameShell>
  );
}
