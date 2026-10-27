"use client";

import { useReducer, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { digitSpanReducer, generateSequence } from "@/lib/games/digit-span/logic";
import { DIGIT_SPAN_TUTORIAL_STEPS } from "@/lib/games/digit-span/tutorial";
import { createDigitSpanScheduler } from "@/lib/scheduler/digit-span";
import { realClock } from "@/lib/scheduler/realClock";
import type { DigitSpanMode } from "@/lib/games/digit-span/types";
import { FEEDBACK_DURATION_MS, READY_DURATION_MS } from "@/lib/games/digit-span/constants";
import { useSessionResult } from "@/lib/hooks/useSessionResult";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useGamePhase } from "@/lib/hooks/useGamePhase";
import { DigitDisplay } from "./DigitDisplay";
import { DigitInput } from "./DigitInput";
import { TutorialOverlay } from "@/components/games/shared/TutorialOverlay";
import { ResultScreen } from "@/components/games/shared/ResultScreen";
import { GameShell } from "@/components/games/shared/GameShell";
import { soundSystem } from "@/lib/audio/webAudio";
import { useAppStore } from "@/lib/store";

interface DigitSpanGameProps {
  mode: string;
}

function deriveMode(mode: string): DigitSpanMode {
  return mode === "backward" ? "backward" : "forward";
}

export function DigitSpanGame({ mode }: DigitSpanGameProps) {
  const t = useTranslations();
  const closeGame = useAppStore((s) => s.closeGame);
  const appSettings = useAppStore((s) => s.settings);
  const activeGame = useAppStore((s) => s.activeGame);
  const DEFAULT_DIFFICULTY = activeGame?.difficulty ?? appSettings.defaultDifficulty;
  const reducedMotion = useReducedMotion();
  const gameMode = deriveMode(mode);

  const [state, dispatch] = useReducer(digitSpanReducer, {
    phase: "idle",
    mode: gameMode,
    span: 4,
    sequence: [],
    userInput: [],
    currentDigit: null,
    digitRevealStep: 0,
    consecutiveFailures: 0,
    round: 0,
    correctRounds: 0,
    maxSpan: 4,
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    difficulty: DEFAULT_DIFFICULTY,
    showTutorial: false,
  });

  const schedulerRef = useRef(createDigitSpanScheduler(realClock));

  const { personalBest, prevSessionResult, isNewRecord } = useSessionResult({
    phase: state.phase,
    gameId: "digit-span",
    mode,
    difficulty: state.difficulty,
    score: state.correctRounds,
    accuracy: state.round > 0 ? state.correctRounds / state.round : 0,
    maxSpan: state.maxSpan,
    maxLevel: null,
    round: state.round,
    correctRounds: state.correctRounds,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
  });

  const { dailyNext } = useGamePhase({
    phase: state.phase,
    lastFeedbackCorrect: state.lastFeedbackCorrect,
    soundEnabled: appSettings.soundEnabled,
    volume: appSettings.volume,
    activePhases: ["input", "preview"],
    readyDelayMs: READY_DURATION_MS,
    onReadyElapsed: () => {
      const seq = generateSequence(state.span, Math.random);
      dispatch({ type: "READY_COMPLETE", sequence: seq });
    },
    feedbackDelayMs: FEEDBACK_DURATION_MS,
    onFeedbackElapsed: () => dispatch({ type: "FEEDBACK_COMPLETE", now: performance.now() }),
  });

  useEffect(() => {
    soundSystem.unlock();
    dispatch({ type: "START", difficulty: DEFAULT_DIFFICULTY, showTutorial: false, mode: gameMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PREVIEW → drive the digit scheduler
  useEffect(() => {
    if (state.phase !== "preview") return;
    const scheduler = schedulerRef.current;
    scheduler.start(state.sequence, (event) => {
      if (event.type === "DIGIT_ON") dispatch({ type: "DIGIT_ON", digit: event.digit });
      else if (event.type === "DIGIT_OFF") dispatch({ type: "DIGIT_OFF" });
      else if (event.type === "SEQUENCE_COMPLETE") dispatch({ type: "SEQUENCE_COMPLETE" });
    });
    return () => scheduler.stop();
  }, [state.phase, state.sequence]);

  const handleDigit = useCallback((digit: number) => {
    soundSystem.playTap();
    dispatch({ type: "TAP_DIGIT", digit, now: performance.now() });
  }, []);

  if (state.phase === "tutorial") {
    return (
      <TutorialOverlay
        steps={DIGIT_SPAN_TUTORIAL_STEPS}
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
          maxSpan: state.maxSpan,
          maxLevel: null,
          durationSecs,
          personalBest,
          isNewRecord,
          prevSessionResult,
        }}
        about={{
          memorySystem: t("about.digitSpan.memorySystem"),
          researchBasis: t("about.digitSpan.researchBasis"),
          evidenceNote: t("about.digitSpan.evidenceNote"),
        }}
        onPlayAgain={() =>
          dispatch({ type: "RESTART", difficulty: DEFAULT_DIFFICULTY, showTutorial: false, mode: gameMode })
        }
        onHome={closeGame}
        dailyNext={dailyNext}
      />
    );
  }

  const phaseLabel = (() => {
    switch (state.phase) {
      case "ready": return t("game.getReady");
      case "preview": return t("game.watchDigits");
      case "input": return state.mode === "backward" ? t("game.enterDigitsBackward") : t("game.enterDigits");
      default: return "";
    }
  })();

  return (
    <GameShell
      stats={[
        { label: t("game.round"), value: `${state.round + 1}/10` },
        { label: t("game.score"), value: state.correctRounds },
        { label: t("game.mode"), value: state.mode === "backward" ? t("game.backward") : t("game.forward") },
      ]}
      phaseLabel={phaseLabel}
      feedbackCorrect={state.phase === "feedback" ? state.lastFeedbackCorrect : null}
      isPaused={state.phase === "paused"}
      onPause={() => dispatch({ type: "PAUSE" })}
      onResume={() => dispatch({ type: "RESUME" })}
      onRestart={() =>
        dispatch({ type: "RESTART", difficulty: DEFAULT_DIFFICULTY, showTutorial: false, mode: gameMode })
      }
      onQuit={closeGame}
      footer={
        <>{t("game.span")}{" "}<span className="ltr-nums font-bold text-[var(--color-text-primary)]">{state.span}</span></>
      }
      dataAttributes={{
        "data-sequence":
          process.env.NEXT_PUBLIC_E2E === "1" && state.phase === "input"
            ? JSON.stringify(state.sequence)
            : undefined,
      }}
    >
      {(state.phase === "ready" || state.phase === "preview") && (
        <DigitDisplay digit={state.currentDigit} digitKey={state.digitRevealStep} reducedMotion={reducedMotion} />
      )}
      {state.phase === "input" && (
        <DigitInput userInput={state.userInput} span={state.span} onDigit={handleDigit} reducedMotion={reducedMotion} />
      )}
    </GameShell>
  );
}
