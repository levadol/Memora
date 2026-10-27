import { describe, it, expect } from "vitest";
import { chainReducer } from "@/lib/games/arithmetic-chain/logic";
import type { ChainState, ChainAction, ChainProblem } from "@/lib/games/arithmetic-chain/types";
import { TOTAL_ROUNDS, STARTING_CHAIN_LENGTH, MIN_CHAIN_LENGTH, MAX_CHAIN_LENGTH } from "@/lib/games/arithmetic-chain/constants";
import { generateChain } from "@/lib/games/arithmetic-chain/generate";
import { LEVEL_TABLE } from "@/lib/arithmetic/constants";
import type { Difficulty } from "@/lib/storage/types";

function makeProblem(answer: number): ChainProblem {
  return {
    startingNumber: 3,
    steps: [{ op: "+", operand: answer - 3, intermediate: answer }],
    answer,
  };
}

const BASE_PROBLEM = makeProblem(5);
const NEXT_PROBLEM = makeProblem(8);

const baseIdleState: ChainState = {
  phase: "idle",
  difficulty: "easy",
  chainLength: STARTING_CHAIN_LENGTH,
  maxChainLength: STARTING_CHAIN_LENGTH,
  consecutiveErrors: 0,
  round: 0,
  currentProblem: BASE_PROBLEM,
  typedInput: "",
  lastFeedbackCorrect: null,
  startedAt: null,
  finishedAt: null,
  roundResponseTimes: [],
  roundStartedAt: null,
  correctRounds: 0,
  showTutorial: false,
};

const readyState: ChainState = { ...baseIdleState, phase: "ready" };
const showingState: ChainState = { ...baseIdleState, phase: "showing" };
const inputState: ChainState = { ...baseIdleState, phase: "input", roundStartedAt: 0 };
const feedbackState: ChainState = { ...baseIdleState, phase: "feedback" };

describe("chainReducer — START / RESTART", () => {
  it("START goes to tutorial when showTutorial=true", () => {
    const action: ChainAction = { type: "START", difficulty: "easy", showTutorial: true, problem: BASE_PROBLEM };
    const s = chainReducer(baseIdleState, action);
    expect(s.phase).toBe("tutorial");
  });

  it("START goes to ready when showTutorial=false", () => {
    const action: ChainAction = { type: "START", difficulty: "easy", showTutorial: false, problem: BASE_PROBLEM };
    const s = chainReducer(baseIdleState, action);
    expect(s.phase).toBe("ready");
  });

  it("START initializes chainLength to STARTING_CHAIN_LENGTH", () => {
    const s = chainReducer(baseIdleState, { type: "START", difficulty: "easy", showTutorial: false, problem: BASE_PROBLEM });
    expect(s.chainLength).toBe(STARTING_CHAIN_LENGTH);
    expect(s.round).toBe(0);
    expect(s.correctRounds).toBe(0);
  });

  it("RESTART resets to initial state", () => {
    const dirty: ChainState = { ...inputState, round: 5, correctRounds: 3 };
    const s = chainReducer(dirty, { type: "RESTART", difficulty: "easy", showTutorial: false, problem: BASE_PROBLEM });
    expect(s.phase).toBe("ready");
    expect(s.round).toBe(0);
    expect(s.correctRounds).toBe(0);
  });
});

describe("chainReducer — TUTORIAL_SKIP", () => {
  it("transitions tutorial → ready", () => {
    const s = chainReducer({ ...baseIdleState, phase: "tutorial" }, { type: "TUTORIAL_SKIP" });
    expect(s.phase).toBe("ready");
  });
});

describe("chainReducer — READY_COMPLETE", () => {
  it("transitions ready → showing", () => {
    const s = chainReducer(readyState, { type: "READY_COMPLETE", now: 1000 });
    expect(s.phase).toBe("showing");
    expect(s.startedAt).toBe(1000);
  });

  it("is a no-op when not in ready", () => {
    const s = chainReducer(showingState, { type: "READY_COMPLETE", now: 1000 });
    expect(s.phase).toBe("showing");
  });
});

describe("chainReducer — CHAIN_COMPLETE", () => {
  it("transitions showing → input", () => {
    const s = chainReducer(showingState, { type: "CHAIN_COMPLETE", now: 2000 });
    expect(s.phase).toBe("input");
    expect(s.roundStartedAt).toBe(2000);
  });

  it("is a no-op when not in showing", () => {
    const s = chainReducer(inputState, { type: "CHAIN_COMPLETE", now: 2000 });
    expect(s.phase).toBe("input");
  });
});

describe("chainReducer — KEY_INPUT / BACKSPACE", () => {
  it("appends digit in input phase", () => {
    const s = chainReducer(inputState, { type: "KEY_INPUT", char: "7" });
    expect(s.typedInput).toBe("7");
  });

  it("ignores KEY_INPUT when not in input", () => {
    const s = chainReducer(readyState, { type: "KEY_INPUT", char: "7" });
    expect(s.typedInput).toBe("");
  });

  it("BACKSPACE removes last char", () => {
    const s1 = chainReducer(inputState, { type: "KEY_INPUT", char: "1" });
    const s2 = chainReducer(s1, { type: "KEY_INPUT", char: "2" });
    const s3 = chainReducer(s2, { type: "BACKSPACE" });
    expect(s3.typedInput).toBe("1");
  });

  it("BACKSPACE on empty is safe", () => {
    const s = chainReducer(inputState, { type: "BACKSPACE" });
    expect(s.typedInput).toBe("");
  });
});

describe("chainReducer — SUBMIT_ANSWER", () => {
  const stateWithInput = (input: string): ChainState => ({
    ...inputState,
    typedInput: input,
    currentProblem: makeProblem(5),
  });

  it("correct answer increments correctRounds and grows chainLength", () => {
    const s = chainReducer(stateWithInput("5"), {
      type: "SUBMIT_ANSWER", now: 1000, nextProblem: NEXT_PROBLEM
    });
    expect(s.phase).toBe("feedback");
    expect(s.lastFeedbackCorrect).toBe(true);
    expect(s.correctRounds).toBe(1);
    expect(s.chainLength).toBe(STARTING_CHAIN_LENGTH + 1);
    expect(s.consecutiveErrors).toBe(0);
  });

  it("chainLength does not exceed MAX_CHAIN_LENGTH", () => {
    const maxState: ChainState = { ...stateWithInput("5"), chainLength: MAX_CHAIN_LENGTH };
    const s = chainReducer(maxState, { type: "SUBMIT_ANSWER", now: 1000, nextProblem: null });
    expect(s.chainLength).toBe(MAX_CHAIN_LENGTH);
  });

  it("first wrong answer increments consecutiveErrors but does not shrink chain", () => {
    const s = chainReducer(stateWithInput("9"), {
      type: "SUBMIT_ANSWER", now: 1000, nextProblem: NEXT_PROBLEM
    });
    expect(s.lastFeedbackCorrect).toBe(false);
    expect(s.consecutiveErrors).toBe(1);
    expect(s.chainLength).toBe(STARTING_CHAIN_LENGTH);
  });

  it("second consecutive wrong answer shrinks chainLength", () => {
    const s1 = chainReducer(stateWithInput("9"), {
      type: "SUBMIT_ANSWER", now: 1000, nextProblem: NEXT_PROBLEM
    });
    const s2 = chainReducer({ ...s1, phase: "input", typedInput: "9", roundStartedAt: 0 }, {
      type: "SUBMIT_ANSWER", now: 2000, nextProblem: NEXT_PROBLEM
    });
    expect(s2.chainLength).toBe(STARTING_CHAIN_LENGTH - 1);
    expect(s2.consecutiveErrors).toBe(0);
  });

  it("chainLength does not go below MIN_CHAIN_LENGTH", () => {
    const minState: ChainState = {
      ...stateWithInput("9"), chainLength: MIN_CHAIN_LENGTH, consecutiveErrors: 1
    };
    const s = chainReducer(minState, { type: "SUBMIT_ANSWER", now: 1000, nextProblem: null });
    expect(s.chainLength).toBe(MIN_CHAIN_LENGTH);
  });

  it("increments round by 1", () => {
    const s = chainReducer(stateWithInput("5"), {
      type: "SUBMIT_ANSWER", now: 1000, nextProblem: NEXT_PROBLEM
    });
    expect(s.round).toBe(1);
  });
});

describe("chainReducer — FEEDBACK_COMPLETE", () => {
  it("transitions to result after TOTAL_ROUNDS", () => {
    const atLastRound: ChainState = { ...feedbackState, round: TOTAL_ROUNDS };
    const s = chainReducer(atLastRound, { type: "FEEDBACK_COMPLETE", now: 5000, nextProblem: null });
    expect(s.phase).toBe("result");
    expect(s.finishedAt).toBe(5000);
  });

  it("transitions to ready before TOTAL_ROUNDS with next problem", () => {
    const s = chainReducer(feedbackState, { type: "FEEDBACK_COMPLETE", now: 5000, nextProblem: NEXT_PROBLEM });
    expect(s.phase).toBe("ready");
    expect(s.currentProblem).toEqual(NEXT_PROBLEM);
  });
});

describe("chainReducer — PAUSE", () => {
  it("pauses from showing", () => {
    const s = chainReducer(showingState, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
  });

  it("pauses from input", () => {
    const s = chainReducer(inputState, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
  });

  it("pauses from ready", () => {
    const s = chainReducer(readyState, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
  });

  it("pauses from feedback", () => {
    const s = chainReducer(feedbackState, { type: "PAUSE" });
    expect(s.phase).toBe("paused");
  });

  it("is a no-op from idle", () => {
    const s = chainReducer(baseIdleState, { type: "PAUSE" });
    expect(s.phase).toBe("idle");
  });

  it("is a no-op from result", () => {
    const s = chainReducer({ ...baseIdleState, phase: "result" }, { type: "PAUSE" });
    expect(s.phase).toBe("result");
  });
});

describe("chainReducer — RESUME", () => {
  it("transitions paused → ready with fresh problem", () => {
    const paused: ChainState = { ...baseIdleState, phase: "paused" };
    const s = chainReducer(paused, { type: "RESUME", problem: NEXT_PROBLEM });
    expect(s.phase).toBe("ready");
    expect(s.currentProblem).toEqual(NEXT_PROBLEM);
    expect(s.typedInput).toBe("");
  });

  it("is a no-op when not paused", () => {
    const s = chainReducer(inputState, { type: "RESUME", problem: NEXT_PROBLEM });
    expect(s.phase).toBe("input");
  });
});

describe("chainReducer — QUIT", () => {
  it("transitions to idle", () => {
    const s = chainReducer(inputState, { type: "QUIT" });
    expect(s.phase).toBe("idle");
  });
});

describe("generateChain — intermediate results stay in range", () => {
  const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
  const RNG_SEED = 42;

  it("all intermediates stay within addSubMax for each difficulty (1000 chains)", () => {
    let rngState = RNG_SEED;
    const rng = () => {
      rngState = (rngState * 1664525 + 1013904223) & 0xffffffff;
      return (rngState >>> 0) / 0x100000000;
    };

    for (const diff of DIFFICULTIES) {
      const maxVal = LEVEL_TABLE[diff][1]!.addSubMax;
      for (let i = 0; i < 333; i++) {
        const chainLen = 3 + Math.floor(rng() * 4); // 3-6
        const chain = generateChain(diff, 1, chainLen, rng);

        // Starting number in range
        expect(chain.startingNumber).toBeGreaterThanOrEqual(1);
        expect(chain.startingNumber).toBeLessThanOrEqual(maxVal);

        // All intermediate results in range
        for (const step of chain.steps) {
          expect(step.intermediate).toBeGreaterThanOrEqual(1);
          expect(step.intermediate).toBeLessThanOrEqual(maxVal);
        }

        // Answer matches last intermediate
        if (chain.steps.length > 0) {
          expect(chain.answer).toBe(chain.steps[chain.steps.length - 1]!.intermediate);
        } else {
          expect(chain.answer).toBe(chain.startingNumber);
        }
      }
    }
  });
});
