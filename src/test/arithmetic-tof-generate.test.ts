import { describe, it, expect } from "vitest";
import { generateTofSession, isFalsePatternValid } from "@/lib/games/arithmetic-tof/generate";
import { TOTAL_ITEMS, TRUE_ITEMS } from "@/lib/games/arithmetic-tof/constants";

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

describe("generateTofSession", () => {
  it("returns exactly TOTAL_ITEMS items", () => {
    const items = generateTofSession("medium", 1, seededRng(42));
    expect(items).toHaveLength(TOTAL_ITEMS);
  });

  it("has exactly half true items over 1000 generated sessions (each 30 items)", () => {
    let trueCount = 0;
    let total = 0;
    for (let i = 0; i < 1000; i++) {
      const items = generateTofSession("medium", 1, seededRng(i));
      for (const item of items) {
        if (item.isTrue) trueCount++;
        total++;
      }
    }
    // exactly half true since we generate TRUE_ITEMS and FALSE_ITEMS per session
    expect(trueCount).toBe(total / 2);
    expect(trueCount).toBe(1000 * TRUE_ITEMS);
  });

  it("every false item differs from correct answer by an allowed pattern", () => {
    for (let seed = 0; seed < 100; seed++) {
      const items = generateTofSession("hard", 2, seededRng(seed));
      for (const item of items) {
        if (!item.isTrue) {
          const valid = isFalsePatternValid(item.correctAnswer, item.displayedAnswer);
          expect(valid).toBe(true);
        }
      }
    }
  });

  it("false items never equal the correct answer", () => {
    for (let seed = 0; seed < 50; seed++) {
      const items = generateTofSession("easy", 0, seededRng(seed));
      for (const item of items) {
        if (!item.isTrue) {
          expect(item.displayedAnswer).not.toBe(item.correctAnswer);
        }
      }
    }
  });

  it("true items have displayedAnswer equal to correctAnswer", () => {
    const items = generateTofSession("medium", 1, seededRng(99));
    for (const item of items) {
      if (item.isTrue) {
        expect(item.displayedAnswer).toBe(item.correctAnswer);
      }
    }
  });

  it("each false item has text containing the displayedAnswer", () => {
    const items = generateTofSession("medium", 1, seededRng(7));
    for (const item of items.filter((i) => !i.isTrue)) {
      expect(item.text).toContain(String(item.displayedAnswer));
    }
  });

  it("generates items across all difficulties without throwing", () => {
    expect(() => generateTofSession("easy", 0, seededRng(1))).not.toThrow();
    expect(() => generateTofSession("medium", 1, seededRng(2))).not.toThrow();
    expect(() => generateTofSession("hard", 2, seededRng(3))).not.toThrow();
  });
});

describe("isFalsePatternValid", () => {
  it("accepts off by 1", () => {
    expect(isFalsePatternValid(8, 9)).toBe(true);
    expect(isFalsePatternValid(8, 7)).toBe(true);
  });

  it("accepts off by 2", () => {
    expect(isFalsePatternValid(10, 12)).toBe(true);
    expect(isFalsePatternValid(10, 8)).toBe(true);
  });

  it("accepts off by 10", () => {
    expect(isFalsePatternValid(25, 35)).toBe(true);
    expect(isFalsePatternValid(25, 15)).toBe(true);
  });

  it("accepts digit swap", () => {
    expect(isFalsePatternValid(12, 21)).toBe(true);
    expect(isFalsePatternValid(123, 132)).toBe(true);
  });

  it("rejects differences other than 1, 2, 10 without digit swap", () => {
    expect(isFalsePatternValid(8, 14)).toBe(false);
    expect(isFalsePatternValid(100, 105)).toBe(false);
  });
});
