import { describe, it, expect } from "vitest";
import { tofReducer } from "@/lib/games/arithmetic-tof/logic";
import type { TofState, TofItem } from "@/lib/games/arithmetic-tof/types";
import {
  TOTAL_ITEMS,
  CONSECUTIVE_CORRECT_ADVANCE,
  CONSECUTIVE_WRONG_RETREAT,
} from "@/lib/games/arithmetic-tof/constants";

function makeItem(isTrue: boolean): TofItem {
  return {
    text: isTrue ? "3 + 5 = 8" : "3 + 5 = 9",
    isTrue,
    correctAnswer: 8,
    displayedAnswer: isTrue ? 8 : 9,
  };
}

const TRUE_ITEM = makeItem(true);
const FALSE_ITEM = makeItem(false);

function makeItems(count: number): TofItem[] {
  return Array.from({ length: count }, (_, i) => makeItem(i % 2 === 0));
}

const BASE_STATE: TofState = {
  phase: "idle",
  difficulty: "medium",
  subLevel: 0,
  consecutiveCorrect: 0,
  consecutiveWrong: 0,
  items: makeItems(TOTAL_ITEMS),
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

const READY_STATE: TofState = { ...BASE_STATE, phase: "ready" };
const SHOWING_STATE: TofState = {
  ...BASE_STATE,
  phase: "showing",
  itemStartedAt: 1000,
  startedAt: 1000,
};
const FEEDBACK_STATE: TofState = { ...BASE_STATE, phase: "feedback" };

describe("tofReducer — START / RESTART", () => {
  it("START with showTutorial=true goes to tutorial phase", () => {
    const s = tofReducer(BASE_STATE, {
      type: "START",
      difficulty: "easy",
      showTutorial: true,
      items: makeItems(TOTAL_ITEMS),
    });
    expect(s.phase).toBe("tutorial");
  });

  it("START with showTutorial=false goes to ready phase", () => {
    const s = tofReducer(BASE_STATE, {
      type: "START",
      difficulty: "easy",
      showTutorial: false,
      items: makeItems(TOTAL_ITEMS),
    });
    expect(s.phase).toBe("ready");
  });

  it("START resets all counters", () => {
    const dirty: TofState = {
      ...BASE_STATE,
      hits: 5,
      misses: 3,
      falseAlarms: 2,
      correctRejections: 4,
      currentIndex: 10,
    };
    const s = tofReducer(dirty, {
      type: "START",
      difficulty: "medium",
      showTutorial: false,
      items: makeItems(TOTAL_ITEMS),
    });
    expect(s.hits).toBe(0);
    expect(s.misses).toBe(0);
    expect(s.falseAlarms).toBe(0);
    expect(s.correctRejections).toBe(0);
    expect(s.currentIndex).toBe(0);
  });
});

describe("tofReducer — TUTORIAL_SKIP", () => {
  it("moves from tutorial to ready", () => {
    const tutorialState = { ...BASE_STATE, phase: "tutorial" as const };
    const s = tofReducer(tutorialState, { type: "TUTORIAL_SKIP" });
    expect(s.phase).toBe("ready");
  });
});

describe("tofReducer — READY_COMPLETE", () => {
  it("transitions ready → showing and sets itemStartedAt", () => {
    const s = tofReducer(READY_STATE, { type: "READY_COMPLETE", now: 5000 });
    expect(s.phase).toBe("showing");
    expect(s.itemStartedAt).toBe(5000);
  });

  it("sets startedAt on the first item only", () => {
    const s = tofReducer(READY_STATE, { type: "READY_COMPLETE", now: 100 });
    expect(s.startedAt).toBe(100);
    const s2 = tofReducer({ ...READY_STATE, startedAt: 50 }, { type: "READY_COMPLETE", now: 200 });
    expect(s2.startedAt).toBe(50); // unchanged
  });

  it("is a no-op when not in ready phase", () => {
    const s = tofReducer(SHOWING_STATE, { type: "READY_COMPLETE", now: 5000 });
    expect(s).toBe(SHOWING_STATE);
  });
});

describe("tofReducer — ANSWER (True on True item → Hit)", () => {
  it("records a hit when user answers True on a True item", () => {
    const state = { ...SHOWING_STATE, items: [TRUE_ITEM, ...makeItems(TOTAL_ITEMS - 1)] };
    const s = tofReducer(state, { type: "ANSWER", choice: true, now: 2000 });
    expect(s.hits).toBe(1);
    expect(s.misses).toBe(0);
    expect(s.lastFeedbackCorrect).toBe(true);
    expect(s.phase).toBe("feedback");
  });

  it("records a miss when user answers False on a True item", () => {
    const state = { ...SHOWING_STATE, items: [TRUE_ITEM, ...makeItems(TOTAL_ITEMS - 1)] };
    const s = tofReducer(state, { type: "ANSWER", choice: false, now: 2000 });
    expect(s.misses).toBe(1);
    expect(s.lastFeedbackCorrect).toBe(false);
  });

  it("records a false alarm when user answers True on a False item", () => {
    const state = { ...SHOWING_STATE, items: [FALSE_ITEM, ...makeItems(TOTAL_ITEMS - 1)] };
    const s = tofReducer(state, { type: "ANSWER", choice: true, now: 2000 });
    expect(s.falseAlarms).toBe(1);
    expect(s.lastFeedbackCorrect).toBe(false);
  });

  it("records a correct rejection when user answers False on a False item", () => {
    const state = { ...SHOWING_STATE, items: [FALSE_ITEM, ...makeItems(TOTAL_ITEMS - 1)] };
    const s = tofReducer(state, { type: "ANSWER", choice: false, now: 2000 });
    expect(s.correctRejections).toBe(1);
    expect(s.lastFeedbackCorrect).toBe(true);
  });

  it("records response time correctly", () => {
    const state = { ...SHOWING_STATE, itemStartedAt: 1000 };
    const s = tofReducer(state, { type: "ANSWER", choice: true, now: 2500 });
    expect(s.responseTimes).toEqual([1500]);
  });

  it("is a no-op when not in showing phase", () => {
    const s = tofReducer(READY_STATE, { type: "ANSWER", choice: true, now: 2000 });
    expect(s).toBe(READY_STATE);
  });
});

describe("tofReducer — TIMEOUT", () => {
  it("counts as miss when current item is True", () => {
    const state = { ...SHOWING_STATE, items: [TRUE_ITEM, ...makeItems(TOTAL_ITEMS - 1)] };
    const s = tofReducer(state, { type: "TIMEOUT", now: 6000 });
    expect(s.misses).toBe(1);
    expect(s.falseAlarms).toBe(0);
    expect(s.lastFeedbackCorrect).toBe(false);
    expect(s.phase).toBe("feedback");
  });

  it("counts as false alarm when current item is False", () => {
    const state = { ...SHOWING_STATE, items: [FALSE_ITEM, ...makeItems(TOTAL_ITEMS - 1)] };
    const s = tofReducer(state, { type: "TIMEOUT", now: 6000 });
    expect(s.falseAlarms).toBe(1);
    expect(s.misses).toBe(0);
    expect(s.lastFeedbackCorrect).toBe(false);
  });

  it("is a no-op when not in showing phase", () => {
    const s = tofReducer(READY_STATE, { type: "TIMEOUT", now: 6000 });
    expect(s).toBe(READY_STATE);
  });
});

describe("tofReducer — FEEDBACK_COMPLETE", () => {
  it("advances currentIndex and returns to ready for non-final items", () => {
    const s = tofReducer(FEEDBACK_STATE, { type: "FEEDBACK_COMPLETE", now: 7000 });
    expect(s.phase).toBe("ready");
    expect(s.currentIndex).toBe(1);
  });

  it("transitions to result when all items are done", () => {
    const finalState: TofState = {
      ...FEEDBACK_STATE,
      currentIndex: TOTAL_ITEMS - 1,
    };
    const s = tofReducer(finalState, { type: "FEEDBACK_COMPLETE", now: 99000 });
    expect(s.phase).toBe("result");
    expect(s.finishedAt).toBe(99000);
  });

  it("is a no-op when not in feedback phase", () => {
    const s = tofReducer(SHOWING_STATE, { type: "FEEDBACK_COMPLETE", now: 7000 });
    expect(s).toBe(SHOWING_STATE);
  });
});

describe("tofReducer — adaptive sub-level", () => {
  it("advances sub-level after CONSECUTIVE_CORRECT_ADVANCE correct answers", () => {
    let state = { ...SHOWING_STATE, items: [TRUE_ITEM, ...makeItems(TOTAL_ITEMS - 1)] };
    for (let i = 0; i < CONSECUTIVE_CORRECT_ADVANCE; i++) {
      state = { ...tofReducer(state, { type: "ANSWER", choice: true, now: 1000 + i }), phase: "showing" as const };
    }
    expect(state.subLevel).toBe(1);
    expect(state.consecutiveCorrect).toBe(0);
  });

  it("retreats sub-level after CONSECUTIVE_WRONG_RETREAT wrong answers", () => {
    const startState = { ...SHOWING_STATE, subLevel: 1, items: [TRUE_ITEM, ...makeItems(TOTAL_ITEMS - 1)] };
    let state = startState;
    for (let i = 0; i < CONSECUTIVE_WRONG_RETREAT; i++) {
      state = { ...tofReducer(state, { type: "ANSWER", choice: false, now: 1000 + i }), phase: "showing" as const };
    }
    expect(state.subLevel).toBe(0);
  });

  it("sub-level does not go below 0", () => {
    let state = { ...SHOWING_STATE, subLevel: 0, items: [TRUE_ITEM, ...makeItems(TOTAL_ITEMS - 1)] };
    for (let i = 0; i < CONSECUTIVE_WRONG_RETREAT * 3; i++) {
      state = { ...tofReducer(state, { type: "ANSWER", choice: false, now: 1000 + i }), phase: "showing" as const };
    }
    expect(state.subLevel).toBe(0);
  });

  it("sub-level does not go above 2", () => {
    let state = { ...SHOWING_STATE, subLevel: 2, items: [TRUE_ITEM, ...makeItems(TOTAL_ITEMS - 1)] };
    for (let i = 0; i < CONSECUTIVE_CORRECT_ADVANCE * 3; i++) {
      state = { ...tofReducer(state, { type: "ANSWER", choice: true, now: 1000 + i }), phase: "showing" as const };
    }
    expect(state.subLevel).toBe(2);
  });
});

describe("tofReducer — PAUSE / RESUME", () => {
  it("PAUSE from ready moves to paused", () => {
    const s = tofReducer(READY_STATE, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
  });

  it("PAUSE from showing moves to paused", () => {
    const s = tofReducer(SHOWING_STATE, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
  });

  it("PAUSE from feedback moves to paused", () => {
    const s = tofReducer(FEEDBACK_STATE, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
  });

  it("PAUSE is no-op from result phase", () => {
    const resultState = { ...BASE_STATE, phase: "result" as const };
    const s = tofReducer(resultState, { type: "PAUSE" });
    expect(s.phase).toBe("result");
  });

  it("RESUME from paused goes to ready", () => {
    const pausedState = { ...BASE_STATE, phase: "paused" as const };
    const s = tofReducer(pausedState, { type: "RESUME" });
    expect(s.phase).toBe("ready");
    expect(s.itemStartedAt).toBeNull();
  });

  it("RESUME is no-op when not paused", () => {
    const s = tofReducer(SHOWING_STATE, { type: "RESUME" });
    expect(s).toBe(SHOWING_STATE);
  });
});

describe("tofReducer — QUIT", () => {
  it("transitions to idle without recording session", () => {
    const s = tofReducer(SHOWING_STATE, { type: "QUIT" });
    expect(s.phase).toBe("idle");
  });
});
