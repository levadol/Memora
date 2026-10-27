"use client";

import { useReducer, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { patternReducer, generatePattern } from "@/lib/games/pattern-matrix/logic";
import { PREVIEW_BASE_MS, PREVIEW_PER_CELL_MS, LEVELS, STARTING_LEVEL } from "@/lib/games/pattern-matrix/constants";
import { PATTERN_TUTORIAL_STEPS } from "@/lib/games/pattern-matrix/tutorial";
import { createPatternScheduler } from "@/lib/scheduler/pattern";
import { realClock } from "@/lib/scheduler/realClock";
import { useSessionResult } from "@/lib/hooks/useSessionResult";
import { useGamePhase } from "@/lib/hooks/useGamePhase";
import { PatternGrid } from "./PatternGrid";
import { TutorialOverlay } from "@/components/games/shared/TutorialOverlay";
import { ResultScreen } from "@/components/games/shared/ResultScreen";
import { GameShell } from "@/components/games/shared/GameShell";
import { soundSystem } from "@/lib/audio/webAudio";
import { useAppStore } from "@/lib/store";

interface PatternGameProps {
  mode: string;
}

const FEEDBACK_DURATION_MS = 900;
const READY_DURATION_MS = 600;

export function PatternGame({ mode }: PatternGameProps) {
  const t = useTranslations();
  const closeGame = useAppStore((s) => s.closeGame);
  const appSettings = useAppStore((s) => s.settings);
  const activeGame = useAppStore((s) => s.activeGame);
  const DEFAULT_DIFFICULTY = activeGame?.difficulty ?? appSettings.defaultDifficulty;

  const startLevel = STARTING_LEVEL[DEFAULT_DIFFICULTY];
  const startEntry = LEVELS[startLevel]!;

  const [state, dispatch] = useReducer(patternReducer, {
    phase: "idle",
    level: startLevel,
    maxLevel: startLevel,
    gridSize: startEntry.gridSize,
    cellCount: startEntry.cellCount,
    pattern: [],
    userInput: [],
    consecutiveFailures: 0,
    round: 0,
    correctRounds: 0,
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    difficulty: DEFAULT_DIFFICULTY,
    showTutorial: false,
  });

  const schedulerRef = useRef(createPatternScheduler(realClock));

  const { personalBest, prevSessionResult, isNewRecord } = useSessionResult({
    phase: state.phase,
    gameId: "pattern-matrix",
    mode,
    difficulty: state.difficulty,
    score: state.correctRounds,
    accuracy: state.round > 0 ? state.correctRounds / state.round : 0,
    maxSpan: null,
    maxLevel: state.maxLevel,
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
      const totalCells = state.gridSize * state.gridSize;
      const pattern = generatePattern(state.cellCount, totalCells, Math.random);
      dispatch({ type: "READY_COMPLETE", pattern });
    },
    feedbackDelayMs: FEEDBACK_DURATION_MS,
    onFeedbackElapsed: () => dispatch({ type: "FEEDBACK_COMPLETE", now: performance.now() }),
  });

  useEffect(() => {
    soundSystem.unlock();
    dispatch({ type: "START", difficulty: DEFAULT_DIFFICULTY, showTutorial: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PREVIEW → drive scheduler to end the pattern display
  useEffect(() => {
    if (state.phase !== "preview") return;
    const scheduler = schedulerRef.current;
    const durationMs = PREVIEW_BASE_MS + state.pattern.length * PREVIEW_PER_CELL_MS;
    scheduler.start(durationMs, () => dispatch({ type: "PREVIEW_COMPLETE" }));
    return () => scheduler.stop();
  }, [state.phase, state.pattern.length]);

  const handleTap = useCallback((index: number) => {
    soundSystem.playTap();
    dispatch({ type: "TAP_CELL", index, now: performance.now() });
  }, []);

  if (state.phase === "tutorial") {
    return (
      <TutorialOverlay
        steps={PATTERN_TUTORIAL_STEPS}
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
          maxLevel: state.maxLevel,
          durationSecs,
          personalBest,
          isNewRecord,
          prevSessionResult,
        }}
        about={{
          memorySystem: t("about.patternMatrix.memorySystem"),
          researchBasis: t("about.patternMatrix.researchBasis"),
          evidenceNote: t("about.patternMatrix.evidenceNote"),
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
      case "preview": return t("game.watchPattern");
      case "input": return t("game.reproducePattern");
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
        <>{t("game.level")}{" "}<span className="ltr-nums font-bold text-[var(--color-text-primary)]">{state.cellCount}</span></>
      }
      dataAttributes={{
        "data-pattern":
          process.env.NEXT_PUBLIC_E2E === "1" && state.phase === "input"
            ? JSON.stringify(state.pattern)
            : undefined,
      }}
    >
      <PatternGrid
        gridSize={state.gridSize}
        pattern={state.pattern}
        userInput={state.userInput}
        phase={state.phase}
        lastFeedbackCorrect={state.lastFeedbackCorrect}
        onTap={handleTap}
      />
    </GameShell>
  );
}
