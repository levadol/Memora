import { describe, it, expect } from "vitest";
import { blitzReducer } from "@/lib/games/arithmetic-blitz/logic";
import type { BlitzState, BlitzAction } from "@/lib/games/arithmetic-blitz/types";
import { initialAdaptiveState } from "@/lib/arithmetic/generate";
import type { Problem } from "@/lib/arithmetic/generate";

function makeProblem(answer: number): Problem {
  return { text: `? = ${answer}`, answer };
}

function makeNextProblem(): Problem {
  return { text: "3 + 4", answer: 7 };
}

const baseState: BlitzState = {
  phase: "ready",
  difficulty: "medium",
  adaptive: initialAdaptiveState("medium"),
  currentProblem: makeProblem(5),
  prevProblemText: null,
  typedInput: "",
  timeRemainingSeconds: 60,
  sessionDurationSeconds: 60,
  correctCount: 0,
  incorrectCount: 0,
  responseTimes: [],
  problemStartedAt: null,
  startedAt: null,
  finishedAt: null,
  lastFeedbackCorrect: null,
  showTutorial: false,
};

const playingState: BlitzState = {
  ...baseState,
  phase: "playing",
  startedAt: 1000,
  problemStartedAt: 1000,
};

describe("blitzReducer — START / RESTART", () => {
  it("START goes to tutorial when showTutorial=true", () => {
    const action: BlitzAction = {
      type: "START",
      difficulty: "easy",
      showTutorial: true,
      sessionDurationSeconds: 60,
      problem: makeProblem(3),
    };
    const s = blitzReducer(baseState, action);
    expect(s.phase).toBe("tutorial");
  });

  it("START goes to ready when showTutorial=false", () => {
    const action: BlitzAction = {
      type: "START",
      difficulty: "easy",
      showTutorial: false,
      sessionDurationSeconds: 60,
      problem: makeProblem(3),
    };
    const s = blitzReducer(baseState, action);
    expect(s.phase).toBe("ready");
  });

  it("START resets correctCount and incorrectCount", () => {
    const dirty: BlitzState = { ...playingState, correctCount: 5, incorrectCount: 2 };
    const action: BlitzAction = {
      type: "START",
      difficulty: "medium",
      showTutorial: false,
      sessionDurationSeconds: 60,
      problem: makeProblem(3),
    };
    const s = blitzReducer(dirty, action);
    expect(s.correctCount).toBe(0);
    expect(s.incorrectCount).toBe(0);
  });

  it("RESTART works like START", () => {
    const action: BlitzAction = {
      type: "RESTART",
      difficulty: "hard",
      showTutorial: false,
      sessionDurationSeconds: 60,
      problem: makeProblem(9),
    };
    const s = blitzReducer(playingState, action);
    expect(s.phase).toBe("ready");
    expect(s.correctCount).toBe(0);
  });
});

describe("blitzReducer — TUTORIAL_SKIP", () => {
  it("advances phase from tutorial to ready", () => {
    const s = blitzReducer({ ...baseState, phase: "tutorial" }, { type: "TUTORIAL_SKIP" });
    expect(s.phase).toBe("ready");
  });

  it("from playing phase sets phase to ready (reducer does not guard)", () => {
    const s = blitzReducer(playingState, { type: "TUTORIAL_SKIP" });
    expect(s.phase).toBe("ready");
  });
});

describe("blitzReducer — READY_COMPLETE", () => {
  it("transitions ready → playing and sets startedAt", () => {
    const s = blitzReducer(baseState, { type: "READY_COMPLETE", now: 5000 });
    expect(s.phase).toBe("playing");
    expect(s.startedAt).toBe(5000);
    expect(s.problemStartedAt).toBe(5000);
  });

  it("is a no-op when not in ready phase", () => {
    const s = blitzReducer(playingState, { type: "READY_COMPLETE", now: 9999 });
    expect(s.phase).toBe("playing");
  });
});

describe("blitzReducer — TICK", () => {
  it("decrements timeRemainingSeconds by 1 when playing", () => {
    const s = blitzReducer(playingState, { type: "TICK" });
    expect(s.timeRemainingSeconds).toBe(59);
  });

  it("is a no-op when not playing", () => {
    const s = blitzReducer(baseState, { type: "TICK" });
    expect(s.timeRemainingSeconds).toBe(60);
  });
});

describe("blitzReducer — TIME_UP", () => {
  it("sets phase to result and records finishedAt", () => {
    const s = blitzReducer(playingState, { type: "TIME_UP", now: 61000 });
    expect(s.phase).toBe("result");
    expect(s.finishedAt).toBe(61000);
  });

  it("is a no-op when not playing", () => {
    const s = blitzReducer(baseState, { type: "TIME_UP", now: 9999 });
    expect(s.phase).toBe("ready");
  });
});

describe("blitzReducer — KEY_INPUT / BACKSPACE", () => {
  it("appends digit to typedInput when playing", () => {
    const s = blitzReducer(playingState, { type: "KEY_INPUT", char: "3" });
    expect(s.typedInput).toBe("3");
  });

  it("ignores KEY_INPUT when not playing", () => {
    const s = blitzReducer(baseState, { type: "KEY_INPUT", char: "3" });
    expect(s.typedInput).toBe("");
  });

  it("BACKSPACE removes last char", () => {
    const s1 = blitzReducer(playingState, { type: "KEY_INPUT", char: "1" });
    const s2 = blitzReducer(s1, { type: "KEY_INPUT", char: "2" });
    const s3 = blitzReducer(s2, { type: "BACKSPACE" });
    expect(s3.typedInput).toBe("1");
  });

  it("BACKSPACE on empty string is safe", () => {
    const s = blitzReducer(playingState, { type: "BACKSPACE" });
    expect(s.typedInput).toBe("");
  });
});

describe("blitzReducer — SUBMIT_ANSWER", () => {
  it("increments correctCount on correct answer", () => {
    const s = blitzReducer(
      { ...playingState, typedInput: "5" },
      { type: "SUBMIT_ANSWER", now: 2000, nextProblem: makeNextProblem() }
    );
    expect(s.correctCount).toBe(1);
    expect(s.incorrectCount).toBe(0);
    expect(s.lastFeedbackCorrect).toBe(true);
  });

  it("increments incorrectCount on wrong answer", () => {
    const s = blitzReducer(
      { ...playingState, typedInput: "9" },
      { type: "SUBMIT_ANSWER", now: 2000, nextProblem: makeNextProblem() }
    );
    expect(s.correctCount).toBe(0);
    expect(s.incorrectCount).toBe(1);
    expect(s.lastFeedbackCorrect).toBe(false);
  });

  it("records response time on correct answer", () => {
    const s = blitzReducer(
      { ...playingState, typedInput: "5", problemStartedAt: 1000 },
      { type: "SUBMIT_ANSWER", now: 2500, nextProblem: makeNextProblem() }
    );
    expect(s.responseTimes).toEqual([1500]);
  });

  it("does not record response time on incorrect answer", () => {
    const s = blitzReducer(
      { ...playingState, typedInput: "9", problemStartedAt: 1000 },
      { type: "SUBMIT_ANSWER", now: 2500, nextProblem: makeNextProblem() }
    );
    expect(s.responseTimes).toEqual([]);
  });

  it("advances to nextProblem and clears typedInput", () => {
    const next = makeNextProblem();
    const s = blitzReducer(
      { ...playingState, typedInput: "5" },
      { type: "SUBMIT_ANSWER", now: 2000, nextProblem: next }
    );
    expect(s.currentProblem).toBe(next);
    expect(s.typedInput).toBe("");
  });

  it("is a no-op when not playing", () => {
    const s = blitzReducer(
      { ...baseState, typedInput: "5" },
      { type: "SUBMIT_ANSWER", now: 2000, nextProblem: makeNextProblem() }
    );
    expect(s.correctCount).toBe(0);
  });
});

describe("blitzReducer — CLEAR_FEEDBACK", () => {
  it("resets lastFeedbackCorrect to null", () => {
    const s = blitzReducer(
      { ...playingState, lastFeedbackCorrect: true },
      { type: "CLEAR_FEEDBACK" }
    );
    expect(s.lastFeedbackCorrect).toBeNull();
  });
});

describe("blitzReducer — PAUSE / RESUME", () => {
  it("pauses from playing", () => {
    const s = blitzReducer(playingState, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
  });

  it("pauses from ready", () => {
    const s = blitzReducer(baseState, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
  });

  it("PAUSE is a no-op from idle", () => {
    const s = blitzReducer({ ...baseState, phase: "idle" }, { type: "PAUSE" });
    expect(s.phase).toBe("idle");
  });

  it("PAUSE is a no-op from result", () => {
    const s = blitzReducer({ ...baseState, phase: "result" }, { type: "PAUSE" });
    expect(s.phase).toBe("result");
  });

  it("RESUME transitions paused → ready with fresh problem", () => {
    const paused: BlitzState = { ...baseState, phase: "paused" };
    const newProblem = makeNextProblem();
    const s = blitzReducer(paused, { type: "RESUME", problem: newProblem });
    expect(s.phase).toBe("ready");
    expect(s.currentProblem).toBe(newProblem);
    expect(s.typedInput).toBe("");
  });

  it("RESUME is a no-op when not paused", () => {
    const s = blitzReducer(playingState, { type: "RESUME", problem: makeNextProblem() });
    expect(s.phase).toBe("playing");
  });
});

describe("blitzReducer — QUIT", () => {
  it("sets phase to idle", () => {
    const s = blitzReducer(playingState, { type: "QUIT" });
    expect(s.phase).toBe("idle");
  });
});

describe("blitzReducer — pause/resume time and problem state", () => {
  it("pause from 'playing' preserves timeRemainingSeconds", () => {
    let s = blitzReducer(baseState, { type: "READY_COMPLETE", now: 0 });
    // Tick 10 times to reduce time from 60 to 50
    for (let i = 0; i < 10; i++) {
      s = blitzReducer(s, { type: "TICK" });
    }
    expect(s.timeRemainingSeconds).toBe(50);

    const paused = blitzReducer(s, { type: "PAUSE" });
    expect(paused.phase).toBe("paused");
    expect(paused.timeRemainingSeconds).toBe(50);
  });

  it("resume from 'paused' goes to 'ready' with fresh problem, keeping timeRemainingSeconds", () => {
    const originalProblem: Problem = { text: "5 + 3", answer: 8, operands: [5, 3] };
    const freshProblem: Problem = { text: "4 + 2", answer: 6, operands: [4, 2] };

    const pausedState: BlitzState = {
      ...baseState,
      phase: "paused",
      timeRemainingSeconds: 50,
      currentProblem: originalProblem,
    };

    const resumed = blitzReducer(pausedState, { type: "RESUME", problem: freshProblem });
    expect(resumed.phase).toBe("ready");
    expect(resumed.timeRemainingSeconds).toBe(50);
    expect(resumed.currentProblem).toEqual(freshProblem);
    expect(resumed.currentProblem).not.toEqual(originalProblem);
  });

  it("RESUME is a no-op when not paused", () => {
    const freshProblem: Problem = { text: "4 + 2", answer: 6, operands: [4, 2] };
    const s = blitzReducer(playingState, { type: "RESUME", problem: freshProblem });
    expect(s.phase).toBe("playing");
  });
});
