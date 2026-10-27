import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { StorageProvider } from "@/lib/storage/StorageContext";
import { useSessionResult } from "@/lib/hooks/useSessionResult";
import type { StorageAdapter } from "@/lib/storage/StorageAdapter";
import type { AppData, AppSettings, SessionRecord } from "@/lib/storage/types";
import { DEFAULT_DATA } from "@/lib/storage/types";

// ── FakeStorageAdapter ────────────────────────────────────────────────────────

class FakeStorageAdapter implements StorageAdapter {
  data: AppData;
  addSessionCalls = 0;

  constructor(sessions: SessionRecord[] = []) {
    this.data = { ...DEFAULT_DATA, sessions: [...sessions] };
  }

  load(): AppData {
    return this.data;
  }
  save(d: AppData): void {
    this.data = d;
  }
  addSession(session: SessionRecord): void {
    this.addSessionCalls++;
    this.data = { ...this.data, sessions: [...this.data.sessions, session] };
  }
  updateSettings(s: Partial<AppSettings>): void {
    this.data = { ...this.data, settings: { ...this.data.settings, ...s } };
  }
  unlockAchievement(_id: string): void {}
  reset(): void {
    this.data = { ...DEFAULT_DATA, sessions: [] };
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function sess(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "s1",
    gameId: "corsi-blocks",
    mode: "default",
    difficulty: "medium",
    score: 5,
    accuracy: 0.5,
    maxSpan: 5,
    maxLevel: null,
    duration: 60,
    timestamp: "2026-01-01T00:00:00.000Z",
    extras: {},
    ...overrides,
  };
}

function makeWrapper(adapter: StorageAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(StorageProvider, { adapter }, children);
  };
}

const BASE = {
  gameId: "corsi-blocks" as const,
  mode: "default",
  difficulty: "medium" as const,
  score: 6,
  accuracy: 0.6,
  maxSpan: 6,
  maxLevel: null,
  round: 10,
  correctRounds: 6,
  startedAt: 0,
  finishedAt: 60_000,
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe("useSessionResult", () => {
  it("first ever session: isNewRecord=true, personalBest=current, no prevSessionResult", () => {
    const adapter = new FakeStorageAdapter([]);
    const { result } = renderHook(
      () => useSessionResult({ ...BASE, phase: "result" }),
      { wrapper: makeWrapper(adapter) }
    );
    expect(result.current.isNewRecord).toBe(true);
    expect(result.current.personalBest).toBe(6);
    expect(result.current.prevSessionResult).toBeNull();
  });

  it("new record: isNewRecord=true, personalBest = max(prev, current)", () => {
    const adapter = new FakeStorageAdapter([sess({ maxSpan: 4 })]);
    const { result } = renderHook(
      () => useSessionResult({ ...BASE, maxSpan: 7, phase: "result" }),
      { wrapper: makeWrapper(adapter) }
    );
    expect(result.current.isNewRecord).toBe(true);
    expect(result.current.personalBest).toBe(7);
  });

  it("not a record: isNewRecord=false, personalBest = previous best", () => {
    const adapter = new FakeStorageAdapter([sess({ maxSpan: 8 })]);
    const { result } = renderHook(
      () => useSessionResult({ ...BASE, maxSpan: 5, phase: "result" }),
      { wrapper: makeWrapper(adapter) }
    );
    expect(result.current.isNewRecord).toBe(false);
    expect(result.current.personalBest).toBe(8);
  });

  it("prevSessionResult returns the maxSpan of the most recent previous session", () => {
    const adapter = new FakeStorageAdapter([
      sess({ id: "old", maxSpan: 4, timestamp: "2025-06-01T00:00:00.000Z" }),
      sess({ id: "new", maxSpan: 7, timestamp: "2026-09-01T00:00:00.000Z" }),
    ]);
    const { result } = renderHook(
      () => useSessionResult({ ...BASE, phase: "result" }),
      { wrapper: makeWrapper(adapter) }
    );
    expect(result.current.prevSessionResult).toBe(7);
  });

  it("filters by mode: other modes are ignored", () => {
    const adapter = new FakeStorageAdapter([
      sess({ mode: "fast", maxSpan: 9 }), // different mode — should be ignored
      sess({ mode: "default", maxSpan: 4 }),
    ]);
    const { result } = renderHook(
      () => useSessionResult({ ...BASE, maxSpan: 5, phase: "result" }),
      { wrapper: makeWrapper(adapter) }
    );
    // prevBest from "default" mode only = 4; current = 5 → isNewRecord = true
    expect(result.current.isNewRecord).toBe(true);
    expect(result.current.personalBest).toBe(5);
    expect(result.current.prevSessionResult).toBe(4);
  });

  it("filters by difficulty: other difficulties are ignored", () => {
    const adapter = new FakeStorageAdapter([
      sess({ difficulty: "hard", maxSpan: 9 }), // different difficulty — ignored
      sess({ difficulty: "medium", maxSpan: 3 }),
    ]);
    const { result } = renderHook(
      () => useSessionResult({ ...BASE, maxSpan: 5, phase: "result" }),
      { wrapper: makeWrapper(adapter) }
    );
    expect(result.current.isNewRecord).toBe(true); // beats medium best of 3
    expect(result.current.prevSessionResult).toBe(3);
  });

  it("saves the session exactly once (no double save on re-render)", () => {
    const adapter = new FakeStorageAdapter([]);
    const { rerender } = renderHook(
      () => useSessionResult({ ...BASE, phase: "result" }),
      { wrapper: makeWrapper(adapter) }
    );
    rerender(); // re-render with same props
    rerender();
    expect(adapter.addSessionCalls).toBe(1);
  });

  it("returned values do not change after the session is written", () => {
    const adapter = new FakeStorageAdapter([]);
    const { result, rerender } = renderHook(
      ({ score }: { score: number }) =>
        useSessionResult({ ...BASE, score, phase: "result" }),
      {
        initialProps: { score: 6 },
        wrapper: makeWrapper(adapter),
      }
    );
    const before = result.current;
    // Change score (an effect dep) — should NOT recompute the displayed stats
    rerender({ score: 7 });
    expect(result.current.personalBest).toBe(before.personalBest);
    expect(result.current.isNewRecord).toBe(before.isNewRecord);
    expect(result.current.prevSessionResult).toBe(before.prevSessionResult);
    // But still only saved once
    expect(adapter.addSessionCalls).toBe(1);
  });

  it("saves a session even when correctRounds=0 but rounds were played", () => {
    const adapter = new FakeStorageAdapter([]);
    renderHook(
      () => useSessionResult({ ...BASE, correctRounds: 0, round: 10, phase: "result" }),
      { wrapper: makeWrapper(adapter) }
    );
    expect(adapter.addSessionCalls).toBe(1);
  });

  it("does not save when round=0 (no rounds played)", () => {
    const adapter = new FakeStorageAdapter([]);
    renderHook(
      () => useSessionResult({ ...BASE, round: 0, correctRounds: 0, phase: "result" }),
      { wrapper: makeWrapper(adapter) }
    );
    expect(adapter.addSessionCalls).toBe(0);
  });

  it("does not save when phase is not 'result'", () => {
    const adapter = new FakeStorageAdapter([]);
    renderHook(
      () => useSessionResult({ ...BASE, phase: "ready" }),
      { wrapper: makeWrapper(adapter) }
    );
    expect(adapter.addSessionCalls).toBe(0);
  });

  it("resets save guard on phase transition so Play Again can save again", () => {
    const adapter = new FakeStorageAdapter([]);
    const { result, rerender } = renderHook(
      ({ phase }: { phase: string }) =>
        useSessionResult({ ...BASE, phase }),
      {
        initialProps: { phase: "result" },
        wrapper: makeWrapper(adapter),
      }
    );
    expect(adapter.addSessionCalls).toBe(1);
    void result.current; // use result to avoid lint warning

    // Simulate Play Again: phase goes to "ready" then back to "result"
    rerender({ phase: "ready" });
    rerender({ phase: "result" });
    expect(adapter.addSessionCalls).toBe(2);
  });
});
