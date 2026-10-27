import {
  MIN_PAIRS,
  MAX_PAIRS,
  STARTING_PAIRS,
  TOTAL_ROUNDS,
  ICON_IDS,
} from "./constants";
import type { PAState, PAAction, PAPair, PATestTrial } from "./types";
import type { Difficulty } from "@/lib/storage/types";

export function buildPairs(
  words: string[],
  pairCount: number,
  rng: () => number,
  usedIconIds: string[] = [],
  usedWords: string[] = []
): PAPair[] {
  const availableIcons = ICON_IDS.filter((id) => !usedIconIds.includes(id));
  const availableWords = words.filter((w) => !usedWords.includes(w));

  const icons = [...(availableIcons.length >= pairCount ? availableIcons : ICON_IDS)]
    .sort(() => rng() - 0.5)
    .slice(0, pairCount);
  const selectedWords = [...(availableWords.length >= pairCount ? availableWords : words)]
    .sort(() => rng() - 0.5)
    .slice(0, pairCount);

  return icons.map((iconId, i) => ({
    id: iconId,
    iconId,
    word: selectedWords[i]!,
  }));
}

export function buildTestTrials(
  pairs: PAPair[],
  rng: () => number
): PATestTrial[] {
  const shuffled = [...pairs].sort(() => rng() - 0.5);
  const allWords = pairs.map((p) => p.word);

  return shuffled.map((pair) => {
    const distractors = allWords
      .filter((w) => w !== pair.word)
      .sort(() => rng() - 0.5)
      .slice(0, 3);
    const options = [...distractors, pair.word].sort(() => rng() - 0.5);
    return {
      pairId: pair.id,
      iconId: pair.iconId,
      correctWord: pair.word,
      options,
      answered: null,
      responseTimeMs: null,
      startedAt: null,
    };
  });
}

function makeInitialState(
  words: string[],
  pairCount: number,
  difficulty: Difficulty,
  showTutorial: boolean,
  now: number
): PAState {
  const pairs = buildPairs(words, pairCount, Math.random, [], []);
  return {
    phase: showTutorial ? "tutorial" : "study",
    pairs,
    studyIndex: 0,
    testTrials: [],
    testIndex: 0,
    pairCount,
    round: 0,
    correctRounds: 0,
    consecutiveFailures: 0,
    lastFeedbackCorrect: null,
    startedAt: now,
    finishedAt: null,
    difficulty,
    showTutorial,
    usedIconIds: pairs.map((p) => p.iconId),
    usedWords: pairs.map((p) => p.word),
  };
}

const PAUSEABLE = new Set<PAState["phase"]>(["study", "test", "feedback"]);

export function paReducer(state: PAState, action: PAAction): PAState {
  switch (action.type) {
    case "START":
      return makeInitialState(
        action.words,
        action.pairCount,
        action.difficulty,
        action.showTutorial,
        action.now
      );

    case "TUTORIAL_SKIP":
      if (state.phase !== "tutorial") return state;
      return { ...state, phase: "study" };

    case "STUDY_ADVANCE": {
      if (state.phase !== "study") return state;
      const next = state.studyIndex + 1;
      if (next >= state.pairs.length) return state;
      return { ...state, studyIndex: next };
    }

    case "STUDY_COMPLETE":
      if (state.phase !== "study") return state;
      return { ...state, phase: "test", testIndex: 0 };

    case "SET_TEST_TRIALS":
      if (state.phase !== "test") return state;
      return { ...state, testTrials: action.trials };

    case "ANSWER": {
      if (state.phase !== "test") return state;
      const trial = state.testTrials[state.testIndex];
      if (!trial || trial.answered !== null) return state;
      const responseTimeMs =
        trial.startedAt !== null ? action.now - trial.startedAt : null;
      const correct = action.word === trial.correctWord;
      const updatedTrials = state.testTrials.map((t, i) =>
        i === state.testIndex
          ? { ...t, answered: action.word, responseTimeMs }
          : t
      );
      return {
        ...state,
        phase: "feedback",
        testTrials: updatedTrials,
        lastFeedbackCorrect: correct,
      };
    }

    case "FEEDBACK_COMPLETE": {
      if (state.phase !== "feedback") return state;
      const nextTestIndex = state.testIndex + 1;

      if (nextTestIndex < state.testTrials.length) {
        const updatedTrials = state.testTrials.map((t, i) =>
          i === nextTestIndex ? { ...t, startedAt: action.now } : t
        );
        return {
          ...state,
          phase: "test",
          testIndex: nextTestIndex,
          testTrials: updatedTrials,
          lastFeedbackCorrect: null,
        };
      }

      const allCorrect = state.testTrials.every(
        (t) => t.answered === t.correctWord
      );
      const newConsecutiveFailures = allCorrect
        ? 0
        : state.consecutiveFailures + 1;

      let newPairCount = state.pairCount;
      if (allCorrect) newPairCount = Math.min(state.pairCount + 1, MAX_PAIRS);
      else if (newConsecutiveFailures >= 2)
        newPairCount = Math.max(state.pairCount - 1, MIN_PAIRS);

      const newRound = state.round + 1;
      const isGoodRound = allCorrect;

      if (newRound >= TOTAL_ROUNDS) {
        return {
          ...state,
          phase: "result",
          round: newRound,
          correctRounds: state.correctRounds + (isGoodRound ? 1 : 0),
          consecutiveFailures: newConsecutiveFailures,
          pairCount: newPairCount,
          finishedAt: action.now,
          lastFeedbackCorrect: null,
        };
      }

      return {
        ...state,
        phase: "study",
        round: newRound,
        correctRounds: state.correctRounds + (isGoodRound ? 1 : 0),
        consecutiveFailures: newConsecutiveFailures,
        pairCount: newPairCount,
        studyIndex: 0,
        pairs: [],
        testTrials: [],
        testIndex: 0,
        lastFeedbackCorrect: null,
      };
    }

    case "ROUND_READY": {
      if (state.phase !== "study" || state.pairs.length > 0) return state;
      const pairs = buildPairs(action.words, state.pairCount, Math.random, state.usedIconIds, state.usedWords);
      return {
        ...state,
        pairs,
        studyIndex: 0,
        usedIconIds: [...state.usedIconIds, ...pairs.map((p) => p.iconId)],
        usedWords: [...state.usedWords, ...pairs.map((p) => p.word)],
      };
    }

    case "PAUSE":
      if (!PAUSEABLE.has(state.phase)) return state;
      return { ...state, phase: "paused" };

    case "RESUME":
      if (state.phase !== "paused") return state;
      return {
        ...state,
        phase: "study",
        studyIndex: 0,
        pairs: [],
        testTrials: [],
        testIndex: 0,
      };

    case "RESTART":
      return makeInitialState(
        action.words,
        STARTING_PAIRS[action.difficulty] ?? 5,
        action.difficulty,
        action.showTutorial,
        action.now
      );

    case "QUIT":
      return { ...state, phase: "idle" };

    default:
      return state;
  }
}
