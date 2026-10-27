import { describe, it, expect, vi, afterEach } from "vitest";
import { realClock } from "@/lib/scheduler/realClock";

describe("realClock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("now() returns a positive number", () => {
    expect(typeof realClock.now()).toBe("number");
    expect(realClock.now()).toBeGreaterThan(0);
  });

  it("setTimeout fires the callback after the delay", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    realClock.setTimeout(fn, 50);
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clearTimeout cancels the callback", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const id = realClock.setTimeout(fn, 50);
    realClock.clearTimeout(id);
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});
