import { describe, it, expect } from "vitest";
import {
  paReducer,
  buildPairs,
  buildTestTrials,
} from "@/lib/games/paired-associates/logic";
import {
  STARTING_PAIRS,
  TOTAL_ROUNDS,
  MAX_PAIRS,
  MIN_PAIRS,
  ICON_IDS,
  OUTER_SHAPES,
  INNER_MARKS,
} from "@/lib/games/paired-associates/constants";
import { getIconPaths } from "@/lib/games/paired-associates/iconPaths";
import type { PAState, PAPair } from "@/lib/games/paired-associates/types";

const WORDS = [
  "apple", "table", "chair", "window", "bridge",
  "cloud", "river", "bottle", "candle", "pencil",
  "stone", "shirt",
];

function makeStudyState(
  pairCount = 4,
  round = 0,
  consecutiveFailures = 0,
  pairs?: PAPair[]
): PAState {
  const defaultPairs: PAPair[] = Array.from({ length: pairCount }, (_, i) => ({
    id: `icon${i}`,
    iconId: `icon${i}`,
    word: `word${i}`,
  }));
  return {
    phase: "study",
    pairs: pairs ?? defaultPairs,
    studyIndex: 0,
    testTrials: [],
    testIndex: 0,
    pairCount,
    round,
    correctRounds: 0,
    consecutiveFailures,
    lastFeedbackCorrect: null,
    startedAt: 1000,
    finishedAt: null,
    difficulty: "medium",
    showTutorial: false,
    usedIconIds: [],
    usedWords: [],
  };
}

function makeTestState(pairCount = 4): PAState {
  const pairs: PAPair[] = Array.from({ length: pairCount }, (_, i) => ({
    id: `icon${i}`,
    iconId: `icon${i}`,
    word: `word${i}`,
  }));
  const trials = buildTestTrials(pairs, Math.random);
  const withStart = trials.map((t, i) =>
    i === 0 ? { ...t, startedAt: 1000 } : t
  );
  return {
    phase: "test",
    pairs,
    studyIndex: 0,
    testTrials: withStart,
    testIndex: 0,
    pairCount,
    round: 0,
    correctRounds: 0,
    consecutiveFailures: 0,
    lastFeedbackCorrect: null,
    startedAt: 1000,
    finishedAt: null,
    difficulty: "medium",
    showTutorial: false,
    usedIconIds: [],
    usedWords: [],
  };
}

describe("paReducer", () => {
  it("START creates study phase with correct pairCount", () => {
    const state = makeStudyState(); // idle starting point
    const idleState = { ...state, phase: "idle" as const };
    const next = paReducer(idleState, {
      type: "START",
      words: WORDS,
      pairCount: 5,
      difficulty: "medium",
      showTutorial: false,
      now: 0,
    });
    expect(next.phase).toBe("study");
    expect(next.pairCount).toBe(5);
    expect(next.pairs).toHaveLength(5);
  });

  it("START with showTutorial=true creates tutorial phase", () => {
    const idleState = { ...makeStudyState(), phase: "idle" as const };
    const next = paReducer(idleState, {
      type: "START",
      words: WORDS,
      pairCount: 4,
      difficulty: "medium",
      showTutorial: true,
      now: 0,
    });
    expect(next.phase).toBe("tutorial");
  });

  it("TUTORIAL_SKIP transitions tutorial → study", () => {
    const tutorialState: PAState = {
      ...makeStudyState(),
      phase: "tutorial",
    };
    const next = paReducer(tutorialState, { type: "TUTORIAL_SKIP" });
    expect(next.phase).toBe("study");
  });

  it("TUTORIAL_SKIP is no-op when not in tutorial", () => {
    const state = makeStudyState();
    const next = paReducer(state, { type: "TUTORIAL_SKIP" });
    expect(next).toBe(state);
  });

  it("STUDY_ADVANCE increments studyIndex", () => {
    const state = makeStudyState(4);
    const next = paReducer(state, { type: "STUDY_ADVANCE" });
    expect(next.studyIndex).toBe(1);
  });

  it("STUDY_ADVANCE is no-op when not in study phase", () => {
    const state: PAState = { ...makeStudyState(), phase: "idle" };
    const next = paReducer(state, { type: "STUDY_ADVANCE" });
    expect(next).toBe(state);
  });

  it("STUDY_ADVANCE does not advance past last pair", () => {
    const state = makeStudyState(4);
    const atLast = { ...state, studyIndex: 3 };
    const next = paReducer(atLast, { type: "STUDY_ADVANCE" });
    expect(next.studyIndex).toBe(3); // unchanged
  });

  it("STUDY_COMPLETE transitions study → test", () => {
    const state = makeStudyState();
    const next = paReducer(state, { type: "STUDY_COMPLETE" });
    expect(next.phase).toBe("test");
    expect(next.testIndex).toBe(0);
  });

  it("STUDY_COMPLETE is no-op when not in study phase", () => {
    const state: PAState = { ...makeStudyState(), phase: "idle" };
    const next = paReducer(state, { type: "STUDY_COMPLETE" });
    expect(next).toBe(state);
  });

  it("SET_TEST_TRIALS populates testTrials", () => {
    const state: PAState = { ...makeStudyState(), phase: "test" };
    const pairs: PAPair[] = [
      { id: "wave", iconId: "wave", word: "apple" },
      { id: "zigzag", iconId: "zigzag", word: "table" },
      { id: "spiral", iconId: "spiral", word: "chair" },
    ];
    const trials = buildTestTrials(pairs, Math.random);
    const next = paReducer(state, { type: "SET_TEST_TRIALS", trials });
    expect(next.testTrials).toHaveLength(3);
  });

  it("ANSWER with correct word sets lastFeedbackCorrect=true and phase=feedback", () => {
    const state = makeTestState(4);
    const { correctWord } = state.testTrials[0]!;
    const next = paReducer(state, { type: "ANSWER", word: correctWord, now: 2000 });
    expect(next.phase).toBe("feedback");
    expect(next.lastFeedbackCorrect).toBe(true);
    expect(next.testTrials[0]!.answered).toBe(correctWord);
  });

  it("ANSWER with wrong word sets lastFeedbackCorrect=false", () => {
    const state = makeTestState(4);
    const trial = state.testTrials[0]!;
    const wrongWord = trial.options.find((w) => w !== trial.correctWord)!;
    const next = paReducer(state, { type: "ANSWER", word: wrongWord, now: 2000 });
    expect(next.lastFeedbackCorrect).toBe(false);
  });

  it("ANSWER is no-op if trial already answered", () => {
    const state = makeTestState(4);
    const { correctWord } = state.testTrials[0]!;
    const after = paReducer(state, { type: "ANSWER", word: correctWord, now: 2000 });
    const again = paReducer(after, { type: "ANSWER", word: correctWord, now: 3000 });
    expect(again.phase).toBe("feedback"); // didn't change back
    expect(again.testTrials[0]!.answered).toBe(correctWord);
  });

  it("FEEDBACK_COMPLETE with more trials → test, increments testIndex", () => {
    const state = makeTestState(4);
    const { correctWord } = state.testTrials[0]!;
    const feedback = paReducer(state, { type: "ANSWER", word: correctWord, now: 2000 });
    const next = paReducer(feedback, { type: "FEEDBACK_COMPLETE", now: 3000 });
    expect(next.phase).toBe("test");
    expect(next.testIndex).toBe(1);
  });

  it("FEEDBACK_COMPLETE after all correct → study, pairCount++", () => {
    const pairCount = 4;
    let state = makeTestState(pairCount);
    // Answer all correctly
    for (let i = 0; i < pairCount; i++) {
      const { correctWord } = state.testTrials[state.testIndex]!;
      state = paReducer(state, { type: "ANSWER", word: correctWord, now: 1000 + i });
      if (state.phase === "feedback") {
        state = paReducer(state, { type: "FEEDBACK_COMPLETE", now: 2000 + i });
      }
    }
    expect(state.phase).toBe("study");
    expect(state.pairCount).toBe(pairCount + 1);
    expect(state.consecutiveFailures).toBe(0);
    expect(state.correctRounds).toBe(1);
  });

  it("FEEDBACK_COMPLETE after wrong answer → consecutiveFailures++", () => {
    let state = makeTestState(5);
    const trial = state.testTrials[0]!;
    const wrongWord = trial.options.find((w) => w !== trial.correctWord)!;
    state = paReducer(state, { type: "ANSWER", word: wrongWord, now: 1000 });
    // Feed through remaining correct answers and feedback
    expect(state.phase).toBe("feedback");
    state = paReducer(state, { type: "FEEDBACK_COMPLETE", now: 2000 });
    // Answer remaining correctly
    for (let i = 1; i < 5; i++) {
      const { correctWord } = state.testTrials[state.testIndex]!;
      state = paReducer(state, { type: "ANSWER", word: correctWord, now: 3000 + i });
      if (state.phase === "feedback") {
        state = paReducer(state, { type: "FEEDBACK_COMPLETE", now: 4000 + i });
      }
    }
    expect(state.phase).toBe("study");
    expect(state.consecutiveFailures).toBe(1);
    expect(state.pairCount).toBe(5); // no change after 1 failure
  });

  it("FEEDBACK_COMPLETE after 2 consecutive failures → pairCount--", () => {
    // Start with pairCount=5 and consecutiveFailures=1 already
    let state = makeTestState(5);
    state = { ...state, consecutiveFailures: 1 };
    // Fail this round too
    const trial = state.testTrials[0]!;
    const wrongWord = trial.options.find((w) => w !== trial.correctWord)!;
    state = paReducer(state, { type: "ANSWER", word: wrongWord, now: 1000 });
    state = paReducer(state, { type: "FEEDBACK_COMPLETE", now: 2000 });
    // Answer remaining
    for (let i = 1; i < 5; i++) {
      const { correctWord } = state.testTrials[state.testIndex]!;
      state = paReducer(state, { type: "ANSWER", word: correctWord, now: 3000 + i });
      if (state.phase === "feedback") {
        state = paReducer(state, { type: "FEEDBACK_COMPLETE", now: 4000 + i });
      }
    }
    expect(state.phase).toBe("study");
    expect(state.consecutiveFailures).toBe(2);
    expect(state.pairCount).toBe(4); // 5 - 1
  });

  it("pairCount does not go below MIN_PAIRS", () => {
    let state = makeTestState(MIN_PAIRS);
    state = { ...state, consecutiveFailures: 1 };
    const trial = state.testTrials[0]!;
    const wrongWord = trial.options.find((w) => w !== trial.correctWord)!;
    state = paReducer(state, { type: "ANSWER", word: wrongWord, now: 1000 });
    state = paReducer(state, { type: "FEEDBACK_COMPLETE", now: 2000 });
    for (let i = 1; i < MIN_PAIRS; i++) {
      const { correctWord } = state.testTrials[state.testIndex]!;
      state = paReducer(state, { type: "ANSWER", word: correctWord, now: 3000 + i });
      if (state.phase === "feedback") {
        state = paReducer(state, { type: "FEEDBACK_COMPLETE", now: 4000 + i });
      }
    }
    expect(state.pairCount).toBe(MIN_PAIRS);
  });

  it("pairCount does not exceed MAX_PAIRS", () => {
    let state = makeTestState(MAX_PAIRS);
    for (let i = 0; i < MAX_PAIRS; i++) {
      const { correctWord } = state.testTrials[state.testIndex]!;
      state = paReducer(state, { type: "ANSWER", word: correctWord, now: 1000 + i });
      if (state.phase === "feedback") {
        state = paReducer(state, { type: "FEEDBACK_COMPLETE", now: 2000 + i });
      }
    }
    expect(state.pairCount).toBe(MAX_PAIRS);
  });

  it("FEEDBACK_COMPLETE after last round → result phase", () => {
    let state = makeTestState(4);
    state = { ...state, round: TOTAL_ROUNDS - 1 };
    for (let i = 0; i < 4; i++) {
      const { correctWord } = state.testTrials[state.testIndex]!;
      state = paReducer(state, { type: "ANSWER", word: correctWord, now: 1000 + i });
      if (state.phase === "feedback") {
        state = paReducer(state, { type: "FEEDBACK_COMPLETE", now: 2000 + i });
      }
    }
    expect(state.phase).toBe("result");
    expect(state.finishedAt).not.toBeNull();
  });

  it("PAUSE transitions study → paused", () => {
    const state = makeStudyState();
    const next = paReducer(state, { type: "PAUSE" });
    expect(next.phase).toBe("paused");
  });

  it("PAUSE is no-op from idle", () => {
    const state: PAState = { ...makeStudyState(), phase: "idle" };
    const next = paReducer(state, { type: "PAUSE" });
    expect(next).toBe(state);
  });

  it("PAUSE is no-op from result", () => {
    const state: PAState = { ...makeStudyState(), phase: "result" };
    const next = paReducer(state, { type: "PAUSE" });
    expect(next).toBe(state);
  });

  it("RESUME transitions paused → study", () => {
    const state: PAState = { ...makeStudyState(), phase: "paused" };
    const next = paReducer(state, { type: "RESUME" });
    expect(next.phase).toBe("study");
  });

  it("QUIT transitions to idle", () => {
    const state = makeStudyState();
    const next = paReducer(state, { type: "QUIT" });
    expect(next.phase).toBe("idle");
  });
});

describe("buildPairs", () => {
  it("returns the requested number of pairs", () => {
    const pairs = buildPairs(WORDS, 5, Math.random, [], []);
    expect(pairs).toHaveLength(5);
  });

  it("each pair has a word from the input words array", () => {
    const pairs = buildPairs(WORDS, 4, Math.random, [], []);
    pairs.forEach((pair) => {
      expect(WORDS).toContain(pair.word);
    });
  });

  it("avoids already-used icons across rounds", () => {
    const round1 = buildPairs(WORDS, 4, Math.random, [], []);
    const usedIcons = round1.map((p) => p.iconId);
    const round2 = buildPairs(WORDS, 4, Math.random, usedIcons, []);
    const round2Icons = round2.map((p) => p.iconId);
    const overlap = round2Icons.filter((id) => usedIcons.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it("avoids already-used words across rounds", () => {
    const round1 = buildPairs(WORDS, 4, Math.random, [], []);
    const usedWords = round1.map((p) => p.word);
    const round2 = buildPairs(WORDS, 4, Math.random, [], usedWords);
    const round2Words = round2.map((p) => p.word);
    const overlap = round2Words.filter((w) => usedWords.includes(w));
    expect(overlap).toHaveLength(0);
  });
});

describe("buildTestTrials", () => {
  const pairs: PAPair[] = [
    { id: "wave", iconId: "wave", word: "apple" },
    { id: "zigzag", iconId: "zigzag", word: "table" },
    { id: "spiral", iconId: "spiral", word: "chair" },
    { id: "crescent", iconId: "crescent", word: "window" },
  ];

  it("returns the same number of trials as pairs", () => {
    const trials = buildTestTrials(pairs, Math.random);
    expect(trials).toHaveLength(pairs.length);
  });

  it("each trial has 4 options including the correct word", () => {
    const trials = buildTestTrials(pairs, Math.random);
    trials.forEach((trial) => {
      expect(trial.options).toHaveLength(4);
      expect(trial.options).toContain(trial.correctWord);
    });
  });

  it("no trial has duplicate options", () => {
    const trials = buildTestTrials(pairs, Math.random);
    trials.forEach((trial) => {
      const unique = new Set(trial.options);
      expect(unique.size).toBe(trial.options.length);
    });
  });

  it("produces shuffled order distinct from input at least sometimes", () => {
    const inputOrder = pairs.map((p) => p.id);
    let differentOrderSeen = false;
    for (let i = 0; i < 20; i++) {
      const trials = buildTestTrials(pairs, Math.random);
      const trialOrder = trials.map((t) => t.pairId);
      if (JSON.stringify(trialOrder) !== JSON.stringify(inputOrder)) {
        differentOrderSeen = true;
        break;
      }
    }
    expect(differentOrderSeen).toBe(true);
  });

  it("all trials start with answered=null and responseTimeMs=null", () => {
    const trials = buildTestTrials(pairs, Math.random);
    trials.forEach((trial) => {
      expect(trial.answered).toBeNull();
      expect(trial.responseTimeMs).toBeNull();
    });
  });

  it("every trial has exactly 4 unique options including the correct word", () => {
    const manyPairs: PAPair[] = Array.from({ length: 6 }, (_, i) => ({
      id: `icon${i}`,
      iconId: `icon${i}`,
      word: `word${i}`,
    }));
    const trials = buildTestTrials(manyPairs, Math.random);
    trials.forEach((trial) => {
      expect(trial.options).toHaveLength(4);
      expect(new Set(trial.options).size).toBe(4);
      expect(trial.options).toContain(trial.correctWord);
    });
  });
});

describe("icon path uniqueness", () => {
  it("has exactly 64 icons (8 shapes × 8 marks)", () => {
    expect(ICON_IDS.length).toBe(OUTER_SHAPES.length * INNER_MARKS.length);
    expect(ICON_IDS.length).toBe(64);
  });

  it("all icon IDs encode unique (outerPath, markType) combinations", () => {
    const descriptors = ICON_IDS.map((id) => {
      const { outerPath, markType } = getIconPaths(id);
      return `${outerPath}|${markType}`;
    });
    const uniqueDescriptors = new Set(descriptors);
    expect(uniqueDescriptors.size).toBe(ICON_IDS.length);
  });

  it("each outer shape appears exactly 8 times (once per mark)", () => {
    for (const shape of OUTER_SHAPES) {
      const count = ICON_IDS.filter((id) => id.startsWith(`${shape}-`)).length;
      expect(count).toBe(INNER_MARKS.length);
    }
  });

  it("no two icons share the same outerPath", () => {
    const paths = OUTER_SHAPES.map((shape) => getIconPaths(`${shape}-none`).outerPath);
    const uniquePaths = new Set(paths);
    expect(uniquePaths.size).toBe(OUTER_SHAPES.length);
  });
});

describe("worst-case icon and word exhaustion", () => {
  it("ICON_IDS has enough icons for a perfect hard session (50 required)", () => {
    // Hard mode: 6 pairs, then 7, 8, 9, 10, 10 (MAX_PAIRS cap) across 6 rounds = 50 unique icons
    const worstCase = 6 + 7 + 8 + 9 + 10 + 10; // 50
    expect(ICON_IDS.length).toBeGreaterThanOrEqual(worstCase);
  });

  it("all icon IDs are unique strings", () => {
    expect(new Set(ICON_IDS).size).toBe(ICON_IDS.length);
  });

  it("session never runs out of icons in worst case (hard, all rounds perfect)", () => {
    // Simulate the icon pool depletion across 6 rounds of a perfect hard game
    let used: string[] = [];
    let pairCount: number = STARTING_PAIRS["hard"]!;
    for (let round = 0; round < TOTAL_ROUNDS; round++) {
      const available = ICON_IDS.filter((id) => !used.includes(id));
      expect(available.length).toBeGreaterThanOrEqual(pairCount);
      // "use" pairCount icons this round
      used = [...used, ...available.slice(0, pairCount)];
      // Advance pairCount (success each round)
      if (pairCount < MAX_PAIRS) pairCount++;
    }
  });

  it("word list with 65 words covers worst case (50 words required)", () => {
    const SESSION_WORDS = Array.from({ length: 65 }, (_, i) => `word${i}`);
    let used: string[] = [];
    let pairCount: number = STARTING_PAIRS["hard"]!;
    for (let round = 0; round < TOTAL_ROUNDS; round++) {
      const available = SESSION_WORDS.filter((w) => !used.includes(w));
      expect(available.length).toBeGreaterThanOrEqual(pairCount);
      used = [...used, ...available.slice(0, pairCount)];
      if (pairCount < MAX_PAIRS) pairCount++;
    }
  });
});

describe("no-reuse across rounds", () => {
  const SESSION_WORDS = Array.from({ length: 65 }, (_, i) => `word${i}`);

  it("ROUND_READY never reuses an icon already in usedIconIds", () => {
    let state = makeStudyState(4);
    // Simulate initial round populating usedIconIds
    state = { ...state, usedIconIds: state.pairs.map((p) => p.iconId) };

    // Trigger ROUND_READY for next round
    state = { ...state, phase: "study" as const, pairs: [] };
    const next = paReducer(state, { type: "ROUND_READY", words: SESSION_WORDS, now: 0 });
    const newIconIds = next.pairs.map((p) => p.iconId);
    const overlap = newIconIds.filter((id) => state.usedIconIds.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it("ROUND_READY never reuses a word already in usedWords", () => {
    let state = makeStudyState(4);
    state = { ...state, usedWords: state.pairs.map((p) => p.word) };

    state = { ...state, phase: "study" as const, pairs: [] };
    const next = paReducer(state, { type: "ROUND_READY", words: SESSION_WORDS, now: 0 });
    const newWords = next.pairs.map((p) => p.word);
    const overlap = newWords.filter((w) => state.usedWords.includes(w));
    expect(overlap).toHaveLength(0);
  });
});
