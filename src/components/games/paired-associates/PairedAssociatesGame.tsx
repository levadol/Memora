"use client";

import { useReducer, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { paReducer, buildTestTrials } from "@/lib/games/paired-associates/logic";
import { PA_TUTORIAL_STEPS } from "@/lib/games/paired-associates/tutorial";
import { createPAStudyScheduler } from "@/lib/scheduler/paired-associates";
import { realClock } from "@/lib/scheduler/realClock";
import { STARTING_PAIRS, TOTAL_ROUNDS, FEEDBACK_DURATION_MS } from "@/lib/games/paired-associates/constants";
import { useSessionResult } from "@/lib/hooks/useSessionResult";
import { useGamePhase } from "@/lib/hooks/useGamePhase";
import { GameShell } from "@/components/games/shared/GameShell";
import { TutorialOverlay } from "@/components/games/shared/TutorialOverlay";
import { ResultScreen } from "@/components/games/shared/ResultScreen";
import { PAStudyCard } from "./PAStudyCard";
import { PATestCard } from "./PATestCard";
import { soundSystem } from "@/lib/audio/webAudio";
import { useAppStore } from "@/lib/store";
import enWords from "@/content/paired-associates/words-en.json";
import ruWords from "@/content/paired-associates/words-ru.json";
import heWords from "@/content/paired-associates/words-he.json";

const LOCALE_WORDS: Record<string, string[]> = { en: enWords, ru: ruWords, he: heWords };

interface PairedAssociatesGameProps {
  mode: string;
}

const IS_E2E = process.env.NEXT_PUBLIC_E2E === "1";

export function PairedAssociatesGame({ mode }: PairedAssociatesGameProps) {
  const t = useTranslations();
  const locale = useLocale();
  const closeGame = useAppStore((s) => s.closeGame);
  const appSettings = useAppStore((s) => s.settings);
  const activeGame = useAppStore((s) => s.activeGame);
  const DEFAULT_DIFFICULTY = activeGame?.difficulty ?? appSettings.defaultDifficulty;

  const wordsRef = useRef<string[]>(LOCALE_WORDS[locale] ?? enWords);
  const startedRef = useRef(false);
  const initialPairCount = STARTING_PAIRS[DEFAULT_DIFFICULTY] ?? 5;

  const [state, dispatch] = useReducer(paReducer, {
    phase: "idle" as const,
    pairs: [],
    studyIndex: 0,
    testTrials: [],
    testIndex: 0,
    pairCount: initialPairCount,
    round: 0,
    correctRounds: 0,
    consecutiveFailures: 0,
    lastFeedbackCorrect: null,
    startedAt: null,
    finishedAt: null,
    difficulty: DEFAULT_DIFFICULTY,
    showTutorial: false,
    usedIconIds: [],
    usedWords: [],
  });

  const schedulerRef = useRef(
    createPAStudyScheduler(realClock, IS_E2E ? { studyDurationMs: 300 } : undefined)
  );

  const { personalBest, prevSessionResult, isNewRecord } = useSessionResult({
    phase: state.phase,
    gameId: "paired-associates",
    mode,
    difficulty: state.difficulty,
    score: state.correctRounds,
    accuracy: state.round > 0 ? state.correctRounds / state.round : 0,
    maxSpan: null,
    maxLevel: state.pairCount,
    round: state.round,
    correctRounds: state.correctRounds,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    extras: {
      trialResults: state.testTrials.map((tr) => ({
        pairId: tr.pairId,
        correct: tr.answered === tr.correctWord,
        responseTimeMs: tr.responseTimeMs,
      })),
    },
  });

  const { dailyNext } = useGamePhase({
    phase: state.phase,
    lastFeedbackCorrect: state.lastFeedbackCorrect,
    soundEnabled: appSettings.soundEnabled,
    volume: appSettings.volume,
    activePhases: ["study", "test"],
    feedbackDelayMs: FEEDBACK_DURATION_MS,
    onFeedbackElapsed: () => dispatch({ type: "FEEDBACK_COMPLETE", now: performance.now() }),
  });

  // Start once — words are already resolved from the static locale map
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    soundSystem.unlock();
    dispatch({
      type: "START",
      words: wordsRef.current,
      pairCount: initialPairCount,
      difficulty: DEFAULT_DIFFICULTY,
      showTutorial: false,
      now: performance.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New round: rebuild pairs
  useEffect(() => {
    if (state.phase !== "study" || state.pairs.length > 0) return;
    dispatch({ type: "ROUND_READY", words: wordsRef.current, now: performance.now() });
  }, [state.phase, state.pairs.length]);

  // Study phase: run scheduler
  useEffect(() => {
    if (state.phase !== "study" || state.pairs.length === 0) return;
    const scheduler = schedulerRef.current;
    scheduler.start(
      state.pairs.length,
      () => dispatch({ type: "STUDY_ADVANCE" }),
      () => dispatch({ type: "STUDY_COMPLETE" })
    );
    return () => scheduler.stop();
  }, [state.phase, state.pairs.length]);

  // Test phase: build trials once on entry
  useEffect(() => {
    if (state.phase !== "test" || state.testTrials.length > 0) return;
    const trials = buildTestTrials(state.pairs, Math.random);
    const withStart = trials.map((tr, i) => (i === 0 ? { ...tr, startedAt: performance.now() } : tr));
    dispatch({ type: "SET_TEST_TRIALS", trials: withStart });
  }, [state.phase, state.testTrials.length, state.pairs]);

  const handleAnswer = useCallback(
    (word: string) => {
      if (state.phase !== "test") return;
      soundSystem.playTap();
      dispatch({ type: "ANSWER", word, now: performance.now() });
    },
    [state.phase]
  );

  if (state.phase === "tutorial") {
    return (
      <TutorialOverlay
        steps={PA_TUTORIAL_STEPS}
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
          maxLevel: state.pairCount,
          durationSecs,
          personalBest,
          isNewRecord,
          prevSessionResult,
        }}
        about={{
          memorySystem: t("about.pairedAssociates.memorySystem"),
          researchBasis: t("about.pairedAssociates.researchBasis"),
          evidenceNote: t("about.pairedAssociates.evidenceNote"),
        }}
        onPlayAgain={() =>
          dispatch({ type: "RESTART", words: wordsRef.current, difficulty: DEFAULT_DIFFICULTY, showTutorial: false, now: performance.now() })
        }
        onHome={closeGame}
        dailyNext={dailyNext}
      />
    );
  }

  const phaseLabel = (() => {
    switch (state.phase) {
      case "study":
        return state.pairs.length > 0
          ? t("game.paPair", { index: state.studyIndex + 1, total: state.pairs.length })
          : t("game.getReady");
      case "test": return t("game.paTest");
      default: return "";
    }
  })();

  const currentStudyPair = state.phase === "study" ? state.pairs[state.studyIndex] : null;
  const currentTestTrial =
    (state.phase === "test" || state.phase === "feedback") && state.testTrials.length > 0
      ? state.testTrials[state.testIndex]
      : null;

  return (
    <GameShell
      stats={[
        { label: t("game.paRound"), value: `${state.round + 1}/${TOTAL_ROUNDS}` },
        { label: t("game.score"), value: state.correctRounds },
        { label: t("game.paPairs"), value: state.pairCount },
      ]}
      phaseLabel={phaseLabel}
      feedbackCorrect={state.phase === "feedback" ? state.lastFeedbackCorrect : null}
      isPaused={state.phase === "paused"}
      onPause={() => dispatch({ type: "PAUSE" })}
      onResume={() => dispatch({ type: "RESUME" })}
      onRestart={() =>
        dispatch({ type: "RESTART", words: wordsRef.current, difficulty: DEFAULT_DIFFICULTY, showTutorial: false, now: performance.now() })
      }
      onQuit={closeGame}
      dataAttributes={
        IS_E2E
          ? {
              "data-pa-phase": state.phase,
              "data-pa-correct-word":
                state.phase === "test" && currentTestTrial ? currentTestTrial.correctWord : undefined,
            }
          : undefined
      }
    >
      {state.phase === "study" && currentStudyPair && (
        <PAStudyCard iconId={currentStudyPair.iconId} word={currentStudyPair.word} />
      )}
      {(state.phase === "test" || state.phase === "feedback") && currentTestTrial && (
        <PATestCard
          iconId={currentTestTrial.iconId}
          options={currentTestTrial.options}
          disabled={state.phase !== "test" || state.testTrials.length === 0}
          onAnswer={handleAnswer}
          correctWord={IS_E2E ? currentTestTrial.correctWord : undefined}
        />
      )}
    </GameShell>
  );
}
