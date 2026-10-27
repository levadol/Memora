import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/lib/store";

function resetStore() {
  useAppStore.setState({
    dailyQueue: null,
    dailyProgress: 0,
    dailySummary: false,
    arithmeticDailyQueue: null,
    arithmeticDailyProgress: 0,
    arithmeticDailySummary: false,
    activeGame: null,
  });
}

describe("memory vs arithmetic daily queue independence", () => {
  beforeEach(resetStore);

  it("starting arithmetic training does not affect memory queue", () => {
    const { startArithmeticTraining } = useAppStore.getState();
    startArithmeticTraining();
    const state = useAppStore.getState();
    expect(state.arithmeticDailyQueue).not.toBeNull();
    expect(state.dailyQueue).toBeNull();
    expect(state.dailyProgress).toBe(0);
  });

  it("starting memory training does not affect arithmetic queue", () => {
    const { startDailyTraining } = useAppStore.getState();
    startDailyTraining();
    const state = useAppStore.getState();
    expect(state.dailyQueue).not.toBeNull();
    expect(state.arithmeticDailyQueue).toBeNull();
    expect(state.arithmeticDailyProgress).toBe(0);
  });

  it("both queues can run simultaneously", () => {
    useAppStore.getState().startDailyTraining();
    useAppStore.getState().startArithmeticTraining();
    const state = useAppStore.getState();
    expect(state.dailyQueue).not.toBeNull();
    expect(state.arithmeticDailyQueue).not.toBeNull();
  });

  it("markArithmeticGameComplete only advances arithmetic progress", () => {
    useAppStore.getState().startDailyTraining();
    useAppStore.getState().startArithmeticTraining();
    const { arithmeticDailyQueue } = useAppStore.getState();
    const firstArithmetic = arithmeticDailyQueue![0]!;

    useAppStore.getState().markArithmeticGameComplete(firstArithmetic);

    const state = useAppStore.getState();
    expect(state.arithmeticDailyProgress).toBe(1);
    expect(state.dailyProgress).toBe(0);
  });

  it("markDailyGameComplete only advances memory progress", () => {
    useAppStore.getState().startDailyTraining();
    useAppStore.getState().startArithmeticTraining();
    const { dailyQueue } = useAppStore.getState();
    const firstMemory = dailyQueue![0]!;

    useAppStore.getState().markDailyGameComplete(firstMemory);

    const state = useAppStore.getState();
    expect(state.dailyProgress).toBe(1);
    expect(state.arithmeticDailyProgress).toBe(0);
  });

  it("markArithmeticGameComplete is a no-op when game does not match current position", () => {
    useAppStore.getState().startArithmeticTraining();
    const { arithmeticDailyQueue } = useAppStore.getState();
    const secondGame = arithmeticDailyQueue![1]!;

    useAppStore.getState().markArithmeticGameComplete(secondGame);

    expect(useAppStore.getState().arithmeticDailyProgress).toBe(0);
  });

  it("completing all arithmetic games sets arithmeticDailySummary", () => {
    useAppStore.getState().startArithmeticTraining();
    const { arithmeticDailyQueue } = useAppStore.getState();
    for (const gameId of arithmeticDailyQueue!) {
      useAppStore.getState().markArithmeticGameComplete(gameId);
    }
    const state = useAppStore.getState();
    expect(state.arithmeticDailySummary).toBe(true);
    expect(state.dailySummary).toBe(false);
  });

  it("dismissArithmeticSummary clears only arithmetic state", () => {
    useAppStore.getState().startDailyTraining();
    useAppStore.getState().startArithmeticTraining();
    const { arithmeticDailyQueue } = useAppStore.getState();
    for (const gameId of arithmeticDailyQueue!) {
      useAppStore.getState().markArithmeticGameComplete(gameId);
    }
    useAppStore.getState().dismissArithmeticSummary();

    const state = useAppStore.getState();
    expect(state.arithmeticDailySummary).toBe(false);
    expect(state.arithmeticDailyQueue).toBeNull();
    expect(state.dailyQueue).not.toBeNull();
  });

  it("stopArithmeticTraining clears only arithmetic state", () => {
    useAppStore.getState().startDailyTraining();
    useAppStore.getState().startArithmeticTraining();
    useAppStore.getState().stopArithmeticTraining();

    const state = useAppStore.getState();
    expect(state.arithmeticDailyQueue).toBeNull();
    expect(state.arithmeticDailyProgress).toBe(0);
    expect(state.dailyQueue).not.toBeNull();
  });
});
