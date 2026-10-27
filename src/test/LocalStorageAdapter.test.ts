import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageAdapter } from "@/lib/storage/LocalStorageAdapter";
import { DEFAULT_DATA, SCHEMA_VERSION } from "@/lib/storage/types";
import type { SessionRecord } from "@/lib/storage/types";

const session: SessionRecord = {
  id: "s1",
  gameId: "digit-span",
  mode: "default",
  difficulty: "easy",
  score: 10,
  accuracy: 0.9,
  maxSpan: 6,
  maxLevel: null,
  duration: 120,
  timestamp: "2026-10-05T00:00:00.000Z",
  extras: {},
};

describe("LocalStorageAdapter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("load returns DEFAULT_DATA when storage is empty", () => {
    const adapter = new LocalStorageAdapter();
    expect(adapter.load()).toEqual(DEFAULT_DATA);
  });

  it("save and load round-trips data", () => {
    const adapter = new LocalStorageAdapter();
    const data = { ...DEFAULT_DATA, sessions: [session] };
    adapter.save(data);
    const loaded = adapter.load();
    expect(loaded.sessions).toHaveLength(1);
    expect(loaded.sessions[0].id).toBe("s1");
  });

  it("addSession appends to sessions", () => {
    const adapter = new LocalStorageAdapter();
    adapter.addSession(session);
    const data = adapter.load();
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].score).toBe(10);
  });

  it("addSession is cumulative across calls", () => {
    const adapter = new LocalStorageAdapter();
    adapter.save({ ...DEFAULT_DATA, sessions: [] });
    adapter.addSession(session);
    adapter.addSession({ ...session, id: "s2" });
    expect(adapter.load().sessions).toHaveLength(2);
  });

  it("updateSettings merges settings", () => {
    const adapter = new LocalStorageAdapter();
    adapter.updateSettings({ soundEnabled: false });
    expect(adapter.load().settings.soundEnabled).toBe(false);
    expect(adapter.load().settings.volume).toBe(0.7);
  });

  it("unlockAchievement adds achievement", () => {
    const adapter = new LocalStorageAdapter();
    adapter.unlockAchievement("first-game");
    const data = adapter.load();
    const ach = data.achievements.find((a) => a.id === "first-game");
    expect(ach).toBeDefined();
    expect(ach!.unlockedAt).not.toBeNull();
  });

  it("unlockAchievement does not overwrite existing unlock", () => {
    const adapter = new LocalStorageAdapter();
    adapter.unlockAchievement("first-game");
    const first = adapter.load().achievements[0].unlockedAt;
    adapter.unlockAchievement("first-game");
    const second = adapter.load().achievements[0].unlockedAt;
    expect(first).toBe(second);
    expect(adapter.load().achievements).toHaveLength(1);
  });

  it("reset removes data", () => {
    const adapter = new LocalStorageAdapter();
    adapter.addSession(session);
    adapter.reset();
    expect(adapter.load()).toEqual(DEFAULT_DATA);
  });

  it("load returns DEFAULT_DATA for corrupt JSON", () => {
    localStorage.setItem("memora_v1", "not-json{{");
    const adapter = new LocalStorageAdapter();
    expect(adapter.load()).toEqual(DEFAULT_DATA);
  });

  it("load triggers migration for old schema version", () => {
    localStorage.setItem("memora_v1", JSON.stringify({ version: 0 }));
    const adapter = new LocalStorageAdapter();
    const data = adapter.load();
    expect(data.version).toBe(SCHEMA_VERSION);
  });

  it("updateArithmeticTraining saves arithmetic daily state", () => {
    const adapter = new LocalStorageAdapter();
    adapter.updateArithmeticTraining({
      date: "2026-10-17",
      queue: ["arithmetic-blitz", "arithmetic-chain", "arithmetic-tof"],
      progress: 1,
    });
    const data = adapter.load();
    expect(data.arithmeticDailyTraining).toBeDefined();
    expect(data.arithmeticDailyTraining!.progress).toBe(1);
    expect(data.arithmeticDailyTraining!.queue).toHaveLength(3);
  });

  it("updateArithmeticTraining with null removes arithmetic daily state", () => {
    const adapter = new LocalStorageAdapter();
    adapter.updateArithmeticTraining({
      date: "2026-10-17",
      queue: ["arithmetic-blitz"],
      progress: 0,
    });
    adapter.updateArithmeticTraining(null);
    const data = adapter.load();
    expect(data.arithmeticDailyTraining).toBeUndefined();
  });

  it("updateDailyTraining and updateArithmeticTraining are independent", () => {
    const adapter = new LocalStorageAdapter();
    adapter.updateDailyTraining({ date: "2026-10-17", queue: ["digit-span"], progress: 0 });
    adapter.updateArithmeticTraining({ date: "2026-10-17", queue: ["arithmetic-blitz"], progress: 0 });
    const data = adapter.load();
    expect(data.dailyTraining).toBeDefined();
    expect(data.arithmeticDailyTraining).toBeDefined();
    adapter.updateArithmeticTraining(null);
    expect(adapter.load().dailyTraining).toBeDefined();
    expect(adapter.load().arithmeticDailyTraining).toBeUndefined();
  });
});
