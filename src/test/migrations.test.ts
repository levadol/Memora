import { describe, it, expect } from "vitest";
import { migrate } from "@/lib/storage/migrations";
import { DEFAULT_DATA, SCHEMA_VERSION } from "@/lib/storage/types";

describe("migrate", () => {
  it("returns data as-is for current version", () => {
    const data = { ...DEFAULT_DATA, sessions: [] };
    const result = migrate(data, SCHEMA_VERSION);
    expect(result).toBe(data);
  });

  it("resets to DEFAULT_DATA for unknown older version", () => {
    const result = migrate({ version: 0, garbage: true }, 0);
    expect(result).toEqual(DEFAULT_DATA);
    expect(result).not.toBe(DEFAULT_DATA);
  });

  it("resets to DEFAULT_DATA for future unknown version", () => {
    const result = migrate({ version: 99 }, 99);
    // version 99 !== SCHEMA_VERSION (1), so it resets
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("returned DEFAULT_DATA clone has correct version", () => {
    const result = migrate(null, 0);
    expect(result.version).toBe(SCHEMA_VERSION);
  });

  it("returned clone is mutable without affecting DEFAULT_DATA", () => {
    const result = migrate(null, 0);
    result.sessions.push({
      id: "x",
      gameId: "digit-span",
      mode: "default",
      difficulty: "easy",
      score: 0,
      accuracy: 1,
      maxSpan: null,
      maxLevel: null,
      duration: 0,
      timestamp: new Date().toISOString(),
      extras: {},
    });
    expect(DEFAULT_DATA.sessions).toHaveLength(0);
  });
});
