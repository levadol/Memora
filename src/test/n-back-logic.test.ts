import { describe, it, expect } from "vitest";
import { generateNBackSequence, nBackReducer } from "@/lib/games/n-back/logic";
import type { NBackState, NBackTrial } from "@/lib/games/n-back/types";
import { TRIALS_PER_BLOCK } from "@/lib/games/n-back/constants";

const posAlphabet = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe("generateNBackSequence", () => {
  it("returns correct total length", () => {
    const n = 2;
    const total = TRIALS_PER_BLOCK + n;
    const seq = generateNBackSequence(n, total, 0.3, posAlphabet, seededRng(42));
    expect(seq).toHaveLength(total);
  });

  it("first n trials are never targets", () => {
    const n = 2;
    const total = TRIALS_PER_BLOCK + n;
    const seq = generateNBackSequence(n, total, 0.3, posAlphabet, seededRng(42));
    for (let i = 0; i < n; i++) {
      expect(seq[i]!.isTarget).toBe(false);
    }
  });

  it("targets match value n steps back", () => {
    const n = 2;
    const total = TRIALS_PER_BLOCK + n;
    const seq = generateNBackSequence(n, total, 1.0, posAlphabet, seededRng(42));
    for (let i = n; i < seq.length; i++) {
      if (seq[i]!.isTarget) {
        expect(seq[i]!.value).toBe(seq[i - n]!.value);
      }
    }
  });

  it("all trials start as not responded", () => {
    const seq = generateNBackSequence(2, 10, 0.3, posAlphabet, seededRng(7));
    expect(seq.every((t) => !t.responded)).toBe(true);
  });

  it("values are from the alphabet", () => {
    const seq = generateNBackSequence(2, 10, 0.3, posAlphabet, seededRng(7));
    for (const trial of seq) {
      expect(posAlphabet).toContain(trial.value);
    }
  });

  it("letter alphabet produces letter values", () => {
    const letters = ["B", "D", "F", "G"];
    const seq = generateNBackSequence(1, 5, 0.3, letters, seededRng(99));
    for (const trial of seq) {
      expect(letters).toContain(trial.value);
    }
  });
});

describe("nBackReducer", () => {
  const baseState: NBackState = {
    phase: "idle",
    n: 2,
    mode: "position",
    sequence: [],
    currentIndex: -1,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    round: 0,
    totalRounds: 5,
    correctRounds: 0,
    maxN: 2,
    blockHistory: [],
    startedAt: null,
    finishedAt: null,
    lastFeedbackCorrect: null,
    difficulty: "medium",
    showTutorial: false,
  };

  it("START transitions to ready", () => {
    const s = nBackReducer(baseState, {
      type: "START",
      n: 2,
      mode: "position",
      difficulty: "medium",
      showTutorial: false,
    });
    expect(s.phase).toBe("ready");
  });

  it("START with showTutorial goes to tutorial", () => {
    const s = nBackReducer(baseState, {
      type: "START",
      n: 2,
      mode: "position",
      difficulty: "medium",
      showTutorial: true,
    });
    expect(s.phase).toBe("tutorial");
  });

  it("START resets all counters", () => {
    const dirty = { ...baseState, hits: 5, misses: 3, falseAlarms: 2 };
    const s = nBackReducer(dirty, {
      type: "START",
      n: 2,
      mode: "position",
      difficulty: "medium",
      showTutorial: false,
    });
    expect(s.hits).toBe(0);
    expect(s.misses).toBe(0);
    expect(s.falseAlarms).toBe(0);
    expect(s.round).toBe(0);
  });

  it("TUTORIAL_SKIP from tutorial goes to ready", () => {
    const s = nBackReducer(
      { ...baseState, phase: "tutorial" },
      { type: "TUTORIAL_SKIP" }
    );
    expect(s.phase).toBe("ready");
  });

  it("TUTORIAL_SKIP from non-tutorial is a no-op", () => {
    const s = nBackReducer(
      { ...baseState, phase: "ready" },
      { type: "TUTORIAL_SKIP" }
    );
    expect(s.phase).toBe("ready");
  });

  it("READY_COMPLETE transitions to stimulus with sequence", () => {
    const seq: NBackTrial[] = [
      { value: 0, isTarget: false, responded: false },
      { value: 1, isTarget: false, responded: false },
      { value: 0, isTarget: true, responded: false },
    ];
    const s = nBackReducer(
      { ...baseState, phase: "ready" },
      { type: "READY_COMPLETE", sequence: seq, now: 1000 }
    );
    expect(s.phase).toBe("stimulus");
    expect(s.sequence).toHaveLength(3);
    expect(s.startedAt).toBe(1000);
  });

  it("READY_COMPLETE preserves startedAt on subsequent blocks", () => {
    const seq: NBackTrial[] = [{ value: 0, isTarget: false, responded: false }];
    const s = nBackReducer(
      { ...baseState, phase: "ready", startedAt: 500 },
      { type: "READY_COMPLETE", sequence: seq, now: 2000 }
    );
    expect(s.startedAt).toBe(500);
  });

  it("STIMULUS_ON updates currentIndex", () => {
    const seq: NBackTrial[] = [
      { value: 0, isTarget: false, responded: false },
      { value: 1, isTarget: false, responded: false },
    ];
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", sequence: seq, n: 1 },
      { type: "STIMULUS_ON", index: 1 }
    );
    expect(s.currentIndex).toBe(1);
  });

  it("RESPOND marks current trial as responded", () => {
    const seq: NBackTrial[] = [
      { value: 0, isTarget: false, responded: false },
      { value: 0, isTarget: true, responded: false },
    ];
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", sequence: seq, currentIndex: 1, n: 1 },
      { type: "RESPOND" }
    );
    expect(s.sequence[1]!.responded).toBe(true);
  });

  it("RESPOND is no-op if already responded", () => {
    const seq: NBackTrial[] = [{ value: 0, isTarget: true, responded: true }];
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", sequence: seq, currentIndex: 0, n: 0 },
      { type: "RESPOND" }
    );
    expect(s).toBe(s);
  });

  it("STIMULUS_OFF scores hit for target that was responded (scorable)", () => {
    const seq: NBackTrial[] = [
      { value: 0, isTarget: false, responded: false },
      { value: 0, isTarget: true, responded: true },
    ];
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", sequence: seq, n: 1 },
      { type: "STIMULUS_OFF", index: 1 }
    );
    expect(s.hits).toBe(1);
    expect(s.misses).toBe(0);
  });

  it("STIMULUS_OFF scores miss for target not responded", () => {
    const seq: NBackTrial[] = [
      { value: 0, isTarget: false, responded: false },
      { value: 0, isTarget: true, responded: false },
    ];
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", sequence: seq, n: 1 },
      { type: "STIMULUS_OFF", index: 1 }
    );
    expect(s.misses).toBe(1);
  });

  it("STIMULUS_OFF scores false alarm for non-target that was responded", () => {
    const seq: NBackTrial[] = [
      { value: 0, isTarget: false, responded: false },
      { value: 1, isTarget: false, responded: true },
    ];
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", sequence: seq, n: 1 },
      { type: "STIMULUS_OFF", index: 1 }
    );
    expect(s.falseAlarms).toBe(1);
  });

  it("STIMULUS_OFF scores correct rejection for non-target not responded", () => {
    const seq: NBackTrial[] = [
      { value: 0, isTarget: false, responded: false },
      { value: 1, isTarget: false, responded: false },
    ];
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", sequence: seq, n: 1 },
      { type: "STIMULUS_OFF", index: 1 }
    );
    expect(s.correctRejections).toBe(1);
  });

  it("STIMULUS_OFF does not score first n trials (unscorable)", () => {
    const seq: NBackTrial[] = [
      { value: 0, isTarget: false, responded: true },
    ];
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", sequence: seq, n: 2 },
      { type: "STIMULUS_OFF", index: 0 }
    );
    expect(s.hits).toBe(0);
    expect(s.falseAlarms).toBe(0);
    expect(s.correctRejections).toBe(0);
  });

  it("BLOCK_COMPLETE transitions to feedback and increments round", () => {
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", hits: 4, misses: 1, falseAlarms: 0, correctRejections: 5 },
      { type: "BLOCK_COMPLETE", now: 5000 }
    );
    expect(s.phase).toBe("feedback");
    expect(s.round).toBe(1);
  });

  it("BLOCK_COMPLETE marks good block when accuracy >= 0.7", () => {
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", hits: 8, misses: 0, falseAlarms: 0, correctRejections: 2 },
      { type: "BLOCK_COMPLETE", now: 5000 }
    );
    expect(s.lastFeedbackCorrect).toBe(true);
    expect(s.correctRounds).toBe(1);
  });

  it("BLOCK_COMPLETE marks bad block when accuracy < 0.7", () => {
    const s = nBackReducer(
      { ...baseState, phase: "stimulus", hits: 1, misses: 5, falseAlarms: 3, correctRejections: 1 },
      { type: "BLOCK_COMPLETE", now: 5000 }
    );
    expect(s.lastFeedbackCorrect).toBe(false);
    expect(s.correctRounds).toBe(0);
  });

  it("FEEDBACK_COMPLETE transitions to ready when rounds remain", () => {
    const s = nBackReducer(
      { ...baseState, phase: "feedback", round: 1, totalRounds: 5 },
      { type: "FEEDBACK_COMPLETE", now: 6000 }
    );
    expect(s.phase).toBe("ready");
  });

  it("FEEDBACK_COMPLETE transitions to result when all rounds done", () => {
    const s = nBackReducer(
      { ...baseState, phase: "feedback", round: 5, totalRounds: 5 },
      { type: "FEEDBACK_COMPLETE", now: 6000 }
    );
    expect(s.phase).toBe("result");
    expect(s.finishedAt).toBe(6000);
  });

  it("PAUSE works from ready", () => {
    expect(
      nBackReducer({ ...baseState, phase: "ready" }, { type: "PAUSE" }).phase
    ).toBe("paused");
  });

  it("PAUSE works from stimulus", () => {
    expect(
      nBackReducer({ ...baseState, phase: "stimulus" }, { type: "PAUSE" }).phase
    ).toBe("paused");
  });

  it("PAUSE works from feedback", () => {
    expect(
      nBackReducer({ ...baseState, phase: "feedback" }, { type: "PAUSE" }).phase
    ).toBe("paused");
  });

  it("PAUSE is no-op from result", () => {
    const s = nBackReducer({ ...baseState, phase: "result" }, { type: "PAUSE" });
    expect(s.phase).toBe("result");
  });

  it("PAUSE is no-op from idle", () => {
    const s = nBackReducer({ ...baseState, phase: "idle" }, { type: "PAUSE" });
    expect(s.phase).toBe("idle");
  });

  it("RESUME from paused goes to ready and clears sequence", () => {
    const seq: NBackTrial[] = [{ value: 0, isTarget: false, responded: false }];
    const s = nBackReducer(
      { ...baseState, phase: "paused", sequence: seq },
      { type: "RESUME" }
    );
    expect(s.phase).toBe("ready");
    expect(s.sequence).toHaveLength(0);
  });

  it("QUIT transitions to idle", () => {
    const s = nBackReducer({ ...baseState, phase: "stimulus" }, { type: "QUIT" });
    expect(s.phase).toBe("idle");
  });

  it("RESTART resets state", () => {
    const dirty = { ...baseState, phase: "feedback" as const, hits: 10, round: 3 };
    const s = nBackReducer(dirty, {
      type: "RESTART",
      n: 2,
      mode: "position",
      difficulty: "medium",
      showTutorial: false,
    });
    expect(s.phase).toBe("ready");
    expect(s.hits).toBe(0);
    expect(s.round).toBe(0);
  });
});
