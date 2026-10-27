"use client";

import { useReducer, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { corsiReducer, generateSequence } from "@/lib/games/corsi/logic";
import { CORSI_TUTORIAL_STEPS } from "@/lib/games/corsi/tutorial";
import { createCorsiScheduler } from "@/lib/scheduler";
import { realClock } from "@/lib/scheduler/realClock";
import { useSessionResult } from "@/lib/hooks/useSessionResult";
import { useGamePhase } from "@/lib/hooks/useGamePhase";
import { CorsiBoard } from "./CorsiBoard";
import { TutorialOverlay } from "@/components/games/shared/TutorialOverlay";
import { ResultScreen } from "@/components/games/shared/ResultScreen";
import { GameShell } from "@/components/games/shared/GameShell";
import { soundSystem } from "@/lib/audio/webAudio";
import { useAppStore } from "@/lib/store";

interface CorsiGameProps {
  mode: string;
}

const FEEDBACK_DURATION_MS = 900;
const READY_DURATION_MS = 600;

export function CorsiGame({ mode }: CorsiGameProps) {
  const t = useTranslations();
  const closeGame = useAppStore((s) => s.closeGame);
  const appSettings = useAppStore((s) => s.settings);
  const activeGame = useAppStore((s) => s.activeGame);
  const DEFAULT_DIFFICULTY = activeGame?.difficulty ?? appSettings.defaultDifficulty;

  const [state, dispatch] = useReducer(corsiReducer, {
    phase: "idle",
    span: 4,
    sequence: [],
    userInput: [],
    consecutiveFailures: 0,
    round: 0,
    correctRounds: 0,
    maxSpan: 4,
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    activeBlockIndex: null,
    difficulty: DEFAULT_DIFFICULTY,
    showTutorial: false,
  });

  const schedulerRef = useRef(createCorsiScheduler(realClock));

  const { personalBest, prevSessionResult, isNewRecord } = useSessionResult({
    phase: state.phase,
    gameId: "corsi-blocks",
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
    dispatch({ type: "START", difficulty: DEFAULT_DIFFICULTY, showTutorial: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PREVIEW → drive the scheduler; cleanup stops it on pause
  useEffect(() => {
    if (state.phase !== "preview") return;
    const scheduler = schedulerRef.current;
    scheduler.start(state.sequence, (event) => {
      if (event.type === "BLOCK_ON") {
        soundSystem.playBlockTone(event.blockIndex);
        dispatch({ type: "BLOCK_ON", blockIndex: event.blockIndex });
      } else if (event.type === "BLOCK_OFF") {
        dispatch({ type: "BLOCK_OFF" });
      } else if (event.type === "SEQUENCE_COMPLETE") {
        dispatch({ type: "SEQUENCE_COMPLETE" });
      }
    });
    return () => scheduler.stop();
  }, [state.phase, state.sequence]);

  const handleTap = useCallback((blockIndex: number) => {
    soundSystem.playTap();
    dispatch({ type: "TAP_BLOCK", blockIndex, now: performance.now() });
  }, []);

  if (state.phase === "tutorial") {
    return (
      <TutorialOverlay
        steps={CORSI_TUTORIAL_STEPS}
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
          memorySystem: t("about.corsiBlocks.memorySystem"),
          researchBasis: t("about.corsiBlocks.researchBasis"),
          evidenceNote: t("about.corsiBlocks.evidenceNote"),
        }}
        onPlayAgain={() =>
          dispatch({ type: "RESTART", difficulty: DEFAULT_DIFFICULTY, showTutorial: false })
        }
        onHome={closeGame}
        dailyNext={dailyNext}
      />
    );
  }

  const phaseLabel = (() => {
    switch (state.phase) {
      case "ready": return t("game.getReady");
      case "preview": return t("game.watchSequence");
      case "input": return t("game.repeatSequence");
      default: return "";
    }
  })();

  return (
    <GameShell
      stats={[
        { label: t("game.round"), value: `${state.round + 1}/10` },
        { label: t("game.score"), value: state.correctRounds },
      ]}
      phaseLabel={phaseLabel}
      feedbackCorrect={state.phase === "feedback" ? state.lastFeedbackCorrect : null}
      isPaused={state.phase === "paused"}
      onPause={() => dispatch({ type: "PAUSE" })}
      onResume={() => dispatch({ type: "RESUME" })}
      onRestart={() =>
        dispatch({ type: "RESTART", difficulty: DEFAULT_DIFFICULTY, showTutorial: false })
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
      <CorsiBoard
        litBlockIndex={state.activeBlockIndex}
        isClickable={state.phase === "input"}
        onTap={handleTap}
      />
    </GameShell>
  );
}
