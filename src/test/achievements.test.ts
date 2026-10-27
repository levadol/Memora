import { describe, it, expect } from "vitest";
import { evaluateNewAchievements, ACHIEVEMENT_DEFS } from "@/lib/achievements";
import type { AppData, SessionRecord } from "@/lib/storage/types";
import { DEFAULT_DATA } from "@/lib/storage/types";

function session(
  gameId: SessionRecord["gameId"],
  overrides: Partial<SessionRecord> = {}
): SessionRecord {
  return {
    id: `${gameId}-${Math.random()}`,
    gameId,
    mode: "default",
    difficulty: "medium",
    score: 1,
    accuracy: 0.8,
    maxSpan: null,
    maxLevel: null,
    duration: 60,
    timestamp: "2025-06-10T12:00:00.000Z",
    extras: {},
    ...overrides,
  };
}

function data(sessions: SessionRecord[], unlockedIds: string[] = []): AppData {
  return {
    ...DEFAULT_DATA,
    sessions,
    achievements: ACHIEVEMENT_DEFS.map((def) => ({
      id: def.id,
      unlockedAt: unlockedIds.includes(def.id) ? "2025-01-01T00:00:00.000Z" : null,
    })),
  };
}

describe("evaluateNewAchievements", () => {
  it("first_session unlocks after first session", () => {
    const result = evaluateNewAchievements(data([session("digit-span")]));
    expect(result).toContain("first_session");
  });

  it("does not re-unlock an already unlocked achievement", () => {
    const result = evaluateNewAchievements(
      data([session("digit-span")], ["first_session"])
    );
    expect(result).not.toContain("first_session");
  });

  it("sessions_10 unlocks at 10 sessions", () => {
    const sessions = Array.from({ length: 10 }, () => session("digit-span"));
    expect(evaluateNewAchievements(data(sessions))).toContain("sessions_10");
    expect(evaluateNewAchievements(data(sessions.slice(0, 9)))).not.toContain("sessions_10");
  });

  it("digit_span_8 unlocks when maxSpan >= 8", () => {
    const result = evaluateNewAchievements(
      data([session("digit-span", { maxSpan: 8 })])
    );
    expect(result).toContain("digit_span_8");
  });

  it("digit_span_8 does not unlock with maxSpan=7", () => {
    const result = evaluateNewAchievements(
      data([session("digit-span", { maxSpan: 7 })])
    );
    expect(result).not.toContain("digit_span_8");
  });

  it("corsi_8 unlocks when maxSpan >= 8 in corsi-blocks", () => {
    expect(
      evaluateNewAchievements(data([session("corsi-blocks", { maxSpan: 8 })]))
    ).toContain("corsi_8");
  });

  it("n_back_3 unlocks when maxLevel >= 3", () => {
    expect(
      evaluateNewAchievements(data([session("n-back", { maxLevel: 3 })]))
    ).toContain("n_back_3");
  });

  it("pattern_10 unlocks when maxLevel >= 10", () => {
    expect(
      evaluateNewAchievements(data([session("pattern-matrix", { maxLevel: 10 })]))
    ).toContain("pattern_10");
  });

  it("pa_perfect unlocks when accuracy=1 in paired-associates", () => {
    expect(
      evaluateNewAchievements(
        data([session("paired-associates", { accuracy: 1.0, score: 3 })])
      )
    ).toContain("pa_perfect");
  });

  it("pa_perfect does not unlock when score=0", () => {
    expect(
      evaluateNewAchievements(
        data([session("paired-associates", { accuracy: 1.0, score: 0 })])
      )
    ).not.toContain("pa_perfect");
  });

  it("all_games unlocks when all 5 games played", () => {
    const sessions = [
      session("digit-span"),
      session("corsi-blocks"),
      session("n-back"),
      session("pattern-matrix"),
      session("paired-associates"),
    ];
    expect(evaluateNewAchievements(data(sessions))).toContain("all_games");
  });

  it("all_games does not unlock when only 4 games played", () => {
    const sessions = [
      session("digit-span"),
      session("corsi-blocks"),
      session("n-back"),
      session("pattern-matrix"),
    ];
    expect(evaluateNewAchievements(data(sessions))).not.toContain("all_games");
  });

  it("streak_3 unlocks after 3 consecutive days", () => {
    const sessions = [
      session("digit-span", { timestamp: "2025-06-08T12:00:00.000Z" }),
      session("digit-span", { timestamp: "2025-06-09T12:00:00.000Z" }),
      session("digit-span", { timestamp: "2025-06-10T12:00:00.000Z" }),
    ];
    expect(evaluateNewAchievements(data(sessions))).toContain("streak_3");
  });

  it("streak_3 does not unlock without 3 consecutive days", () => {
    const sessions = [
      session("digit-span", { timestamp: "2025-06-08T12:00:00.000Z" }),
      session("digit-span", { timestamp: "2025-06-10T12:00:00.000Z" }),
    ];
    expect(evaluateNewAchievements(data(sessions))).not.toContain("streak_3");
  });

  it("returns empty array when no achievements qualify", () => {
    expect(evaluateNewAchievements(data([]))).toHaveLength(0);
  });

  it("blitz_first unlocks after first arithmetic-blitz session", () => {
    expect(
      evaluateNewAchievements(data([session("arithmetic-blitz")]))
    ).toContain("blitz_first");
  });

  it("blitz_20 unlocks when score >= 20 in arithmetic-blitz", () => {
    expect(
      evaluateNewAchievements(data([session("arithmetic-blitz", { score: 20 })]))
    ).toContain("blitz_20");
  });

  it("blitz_20 does not unlock when score < 20", () => {
    expect(
      evaluateNewAchievements(data([session("arithmetic-blitz", { score: 19 })]))
    ).not.toContain("blitz_20");
  });

  it("chain_first unlocks after first arithmetic-chain session", () => {
    expect(
      evaluateNewAchievements(data([session("arithmetic-chain")]))
    ).toContain("chain_first");
  });

  it("chain_length_6 unlocks when maxLevel >= 6 in arithmetic-chain", () => {
    expect(
      evaluateNewAchievements(data([session("arithmetic-chain", { maxLevel: 6 })]))
    ).toContain("chain_length_6");
  });

  it("chain_length_6 does not unlock when maxLevel < 6", () => {
    expect(
      evaluateNewAchievements(data([session("arithmetic-chain", { maxLevel: 5 })]))
    ).not.toContain("chain_length_6");
  });

  it("tof_first unlocks after first arithmetic-tof session", () => {
    expect(
      evaluateNewAchievements(data([session("arithmetic-tof")]))
    ).toContain("tof_first");
  });

  it("tof_perfect unlocks when accuracy=1.0 and score > 0 in arithmetic-tof", () => {
    expect(
      evaluateNewAchievements(data([session("arithmetic-tof", { accuracy: 1.0, score: 30 })]))
    ).toContain("tof_perfect");
  });

  it("tof_perfect does not unlock when score=0", () => {
    expect(
      evaluateNewAchievements(data([session("arithmetic-tof", { accuracy: 1.0, score: 0 })]))
    ).not.toContain("tof_perfect");
  });

  it("tof_perfect does not unlock when accuracy < 1.0", () => {
    expect(
      evaluateNewAchievements(data([session("arithmetic-tof", { accuracy: 0.9, score: 27 })]))
    ).not.toContain("tof_perfect");
  });
});
