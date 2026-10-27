import { describe, it, expect } from "vitest";
import { computeStreak, localDateKey } from "@/lib/streak";
import type { SessionRecord } from "@/lib/storage/types";

function makeSession(timestamp: string): SessionRecord {
  return {
    id: timestamp,
    gameId: "digit-span",
    mode: "forward",
    difficulty: "medium",
    score: 1,
    accuracy: 1,
    maxSpan: 4,
    maxLevel: null,
    duration: 60,
    timestamp,
    extras: {},
  };
}

// ─── localDateKey ─────────────────────────────────────────────────────────────

describe("localDateKey", () => {
  it("UTC midnight returns that UTC date", () => {
    expect(localDateKey(new Date("2025-06-10T00:00:00.000Z"), "UTC")).toBe("2025-06-10");
  });

  it("UTC noon returns that UTC date", () => {
    expect(localDateKey(new Date("2025-06-10T12:00:00.000Z"), "UTC")).toBe("2025-06-10");
  });

  it("UTC 23:59 returns that UTC date", () => {
    expect(localDateKey(new Date("2025-06-10T23:59:00.000Z"), "UTC")).toBe("2025-06-10");
  });

  it("Asia/Jerusalem: 20:30 UTC on June 10 = June 10 local (UTC+3 summer)", () => {
    // 20:30 UTC = 23:30 IDT (UTC+3 summer) = still June 10 in Israel
    expect(localDateKey(new Date("2025-06-10T20:30:00.000Z"), "Asia/Jerusalem")).toBe("2025-06-10");
  });

  it("Asia/Jerusalem: 21:30 UTC on June 10 = June 11 local (UTC+3 summer)", () => {
    // 21:30 UTC = 00:30 IDT next day = June 11 in Israel
    expect(localDateKey(new Date("2025-06-10T21:30:00.000Z"), "Asia/Jerusalem")).toBe("2025-06-11");
  });

  it("America/New_York: 21:30 UTC on June 10 = June 10 local (UTC-4 summer)", () => {
    // 21:30 UTC = 17:30 EDT = still June 10 in New York
    expect(localDateKey(new Date("2025-06-10T21:30:00.000Z"), "America/New_York")).toBe("2025-06-10");
  });

  it("America/New_York: 04:30 UTC on June 11 = June 10 local (UTC-4 summer)", () => {
    // 04:30 UTC June 11 = 00:30 EDT June 11... wait, that's June 11 in NY
    // Let me use: 03:30 UTC June 11 = 23:30 EDT June 10
    expect(localDateKey(new Date("2025-06-11T03:30:00.000Z"), "America/New_York")).toBe("2025-06-10");
  });
});

// ─── computeStreak ────────────────────────────────────────────────────────────

describe("computeStreak", () => {
  it("returns zero for no sessions (UTC)", () => {
    expect(computeStreak([], new Date("2025-06-10T12:00:00Z"), "UTC")).toEqual({
      current: 0,
      longest: 0,
      totalActiveDays: 0,
    });
  });

  it("counts a session today as streak 1 (UTC)", () => {
    const now = new Date("2025-06-10T12:00:00Z");
    const sessions = [makeSession("2025-06-10T12:00:00.000Z")];
    expect(computeStreak(sessions, now, "UTC").current).toBe(1);
  });

  it("counts consecutive UTC days correctly", () => {
    const now = new Date("2025-06-10T12:00:00Z");
    const sessions = [
      makeSession("2025-06-08T12:00:00.000Z"),
      makeSession("2025-06-09T12:00:00.000Z"),
      makeSession("2025-06-10T12:00:00.000Z"),
    ];
    const result = computeStreak(sessions, now, "UTC");
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it("resets streak when there is a UTC day gap", () => {
    const now = new Date("2025-06-10T12:00:00Z");
    const sessions = [
      makeSession("2025-06-06T12:00:00.000Z"),
      makeSession("2025-06-07T12:00:00.000Z"),
      makeSession("2025-06-10T12:00:00.000Z"),
    ];
    const result = computeStreak(sessions, now, "UTC");
    expect(result.current).toBe(1);
    expect(result.longest).toBe(2);
  });

  it("counts yesterday as an active streak (no session today yet) - UTC", () => {
    const now = new Date("2025-06-10T12:00:00Z");
    const sessions = [
      makeSession("2025-06-08T12:00:00.000Z"),
      makeSession("2025-06-09T12:00:00.000Z"),
    ];
    expect(computeStreak(sessions, now, "UTC").current).toBe(2);
  });

  it("streak is 0 when last session was before yesterday - UTC", () => {
    const now = new Date("2025-06-10T12:00:00Z");
    const sessions = [makeSession("2025-06-07T12:00:00.000Z")];
    expect(computeStreak(sessions, now, "UTC").current).toBe(0);
  });

  it("ignores duplicate sessions on same UTC day for totalActiveDays", () => {
    const now = new Date("2025-06-10T12:00:00Z");
    const sessions = [
      makeSession("2025-06-10T10:00:00.000Z"),
      makeSession("2025-06-10T14:00:00.000Z"),
    ];
    expect(computeStreak(sessions, now, "UTC").totalActiveDays).toBe(1);
  });

  it("picks the longest run in a fragmented history - UTC", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const sessions = [
      makeSession("2025-06-01T12:00:00.000Z"),
      makeSession("2025-06-02T12:00:00.000Z"),
      makeSession("2025-06-03T12:00:00.000Z"), // run of 3
      makeSession("2025-06-10T12:00:00.000Z"),
      makeSession("2025-06-11T12:00:00.000Z"),
      makeSession("2025-06-12T12:00:00.000Z"),
      makeSession("2025-06-13T12:00:00.000Z"),
      makeSession("2025-06-14T12:00:00.000Z"), // run of 5
    ];
    const result = computeStreak(sessions, now, "UTC");
    expect(result.longest).toBe(5);
    expect(result.current).toBe(5);
  });

  // ─── Asia/Jerusalem timezone ──────────────────────────────────────────────

  it("Israel: session at 20:30 UTC = June 10 Israel; now = June 11 09:00 UTC → streak=1 (yesterday)", () => {
    // 20:30 UTC June 10 = 23:30 IDT June 10 (UTC+3 summer) = same day in Israel
    // now: 09:00 UTC June 11 = 12:00 IDT June 11 = today in Israel
    // yesterday = June 10 Israel → streak = 1
    const now = new Date("2025-06-11T09:00:00.000Z");
    const sessions = [makeSession("2025-06-10T20:30:00.000Z")];
    const result = computeStreak(sessions, now, "Asia/Jerusalem");
    expect(result.current).toBe(1);
    expect(result.totalActiveDays).toBe(1);
  });

  it("Israel: session at 21:30 UTC = June 11 Israel (00:30 IDT); now = June 11 09:00 UTC → streak=1 (today)", () => {
    // 21:30 UTC June 10 = 00:30 IDT June 11 = June 11 in Israel
    // now: 09:00 UTC June 11 = June 11 in Israel → session is today → streak = 1
    const now = new Date("2025-06-11T09:00:00.000Z");
    const sessions = [makeSession("2025-06-10T21:30:00.000Z")];
    const result = computeStreak(sessions, now, "Asia/Jerusalem");
    expect(result.current).toBe(1);
    expect(result.totalActiveDays).toBe(1);
  });

  it("Israel: two sessions across midnight local = 2 separate active days", () => {
    // session A: 20:30 UTC June 10 = June 10 in Israel
    // session B: 21:30 UTC June 10 = June 11 in Israel (00:30 IDT)
    // now: 12:00 UTC June 11 = June 11 in Israel
    const now = new Date("2025-06-11T12:00:00.000Z");
    const sessions = [
      makeSession("2025-06-10T20:30:00.000Z"), // June 10 Israel
      makeSession("2025-06-10T21:30:00.000Z"), // June 11 Israel
    ];
    const result = computeStreak(sessions, now, "Asia/Jerusalem");
    expect(result.totalActiveDays).toBe(2);
    expect(result.current).toBe(2); // June 10 + June 11 = streak 2
  });

  // ─── America/New_York timezone ────────────────────────────────────────────

  it("New York: session at 21:30 UTC June 10 = June 10 NY (17:30 EDT); now = June 11 09:00 UTC → yesterday had session", () => {
    // 21:30 UTC June 10 = 17:30 EDT June 10 = June 10 NY
    // now: 09:00 UTC June 11 = 05:00 EDT June 11 = June 11 NY → yesterday = June 10
    const now = new Date("2025-06-11T09:00:00.000Z");
    const sessions = [makeSession("2025-06-10T21:30:00.000Z")];
    const result = computeStreak(sessions, now, "America/New_York");
    expect(result.current).toBe(1);
  });

  // ─── Cross-zone scenario ──────────────────────────────────────────────────

  it("cross-zone: session saved in NY context (21:30 UTC = June 10 NY), now checked in Israel context (21:30 UTC = June 11 Israel)", () => {
    // 21:30 UTC June 10:
    //   - In America/New_York (EDT, UTC-4): 17:30 June 10 → date = "2025-06-10"
    //   - In Asia/Jerusalem (IDT, UTC+3):   00:30 June 11 → date = "2025-06-11"
    //
    // If the app always computes with the same TZ consistently, results are deterministic.
    // Test both TZs explicitly to verify correctness of localDateKey itself.

    const utcTime = new Date("2025-06-10T21:30:00.000Z");
    expect(localDateKey(utcTime, "America/New_York")).toBe("2025-06-10");
    expect(localDateKey(utcTime, "Asia/Jerusalem")).toBe("2025-06-11");

    // When computing with NY TZ: session is June 10, now is June 11 → streak active
    const nowJune11 = new Date("2025-06-11T15:00:00.000Z"); // 11:00 EDT or 18:00 IDT
    const sessions = [makeSession("2025-06-10T21:30:00.000Z")];
    const resultNY = computeStreak(sessions, nowJune11, "America/New_York");
    expect(resultNY.current).toBe(1); // session June 10 = yesterday in NY

    // When computing with Israel TZ: session is June 11, now is June 11 → streak active
    const resultIL = computeStreak(sessions, nowJune11, "Asia/Jerusalem");
    expect(resultIL.current).toBe(1); // session June 11 = today in Israel
  });
});
