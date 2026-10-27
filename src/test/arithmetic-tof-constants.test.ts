import { describe, it, expect } from "vitest";
import {
  itemTimeLimitMs,
  TIME_LIMIT_E2E_MS,
  TIME_LIMIT_MIN_MS,
  BASE_TIME_LIMIT_MS,
  TIME_LIMIT_STEP_MS,
  FEEDBACK_DURATION_MS,
  READY_DURATION_MS,
  FEEDBACK_DURATION_E2E_MS,
  READY_DURATION_E2E_MS,
} from "@/lib/games/arithmetic-tof/constants";

describe("itemTimeLimitMs", () => {
  it("returns E2E time when isE2E=true regardless of difficulty and subLevel", () => {
    expect(itemTimeLimitMs("easy", 0, true)).toBe(TIME_LIMIT_E2E_MS);
    expect(itemTimeLimitMs("medium", 3, true)).toBe(TIME_LIMIT_E2E_MS);
    expect(itemTimeLimitMs("hard", 5, true)).toBe(TIME_LIMIT_E2E_MS);
  });

  it("returns base limit at subLevel 0 for each difficulty", () => {
    expect(itemTimeLimitMs("easy", 0, false)).toBe(BASE_TIME_LIMIT_MS.easy);
    expect(itemTimeLimitMs("medium", 0, false)).toBe(BASE_TIME_LIMIT_MS.medium);
    expect(itemTimeLimitMs("hard", 0, false)).toBe(BASE_TIME_LIMIT_MS.hard);
  });

  it("reduces by TIME_LIMIT_STEP_MS per subLevel", () => {
    expect(itemTimeLimitMs("medium", 1, false)).toBe(
      BASE_TIME_LIMIT_MS.medium - TIME_LIMIT_STEP_MS
    );
    expect(itemTimeLimitMs("medium", 2, false)).toBe(
      BASE_TIME_LIMIT_MS.medium - 2 * TIME_LIMIT_STEP_MS
    );
  });

  it("never goes below TIME_LIMIT_MIN_MS", () => {
    expect(itemTimeLimitMs("hard", 100, false)).toBe(TIME_LIMIT_MIN_MS);
    expect(itemTimeLimitMs("easy", 100, false)).toBe(TIME_LIMIT_MIN_MS);
  });
});

describe("E2E duration constants", () => {
  it("E2E durations are shorter than normal", () => {
    expect(FEEDBACK_DURATION_E2E_MS).toBeLessThan(FEEDBACK_DURATION_MS);
    expect(READY_DURATION_E2E_MS).toBeLessThan(READY_DURATION_MS);
  });

  it("E2E item limit is shorter than normal limits", () => {
    expect(TIME_LIMIT_E2E_MS).toBeLessThan(BASE_TIME_LIMIT_MS.hard);
  });
});
