import { describe, it, expect, vi } from "vitest";
import { createPAStudyScheduler } from "@/lib/scheduler/paired-associates";
import type { Clock } from "@/lib/scheduler/types";

function makeFakeClock() {
  let now = 0;
  const callbacks: Map<number, { fn: () => void; at: number }> = new Map();
  let nextId = 1;

  const clock: Clock = {
    now: () => now,
    setTimeout(fn, ms) {
      const id = nextId++ as ReturnType<typeof globalThis.setTimeout>;
      callbacks.set(id as unknown as number, { fn, at: now + ms });
      return id;
    },
    clearTimeout(id) {
      callbacks.delete(id as unknown as number);
    },
  };

  function advance(ms: number) {
    const target = now + ms;
    const toFire = [...callbacks.entries()]
      .filter(([, { at }]) => at <= target)
      .sort(([, a], [, b]) => a.at - b.at);
    now = target;
    for (const [id, { fn }] of toFire) {
      callbacks.delete(id);
      fn();
    }
  }

  return { clock, advance };
}

describe("createPAStudyScheduler", () => {
  it("fires onAdvance (pairCount-1) times and onComplete once", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createPAStudyScheduler(clock, { studyDurationMs: 100 });
    const onAdvance = vi.fn();
    const onComplete = vi.fn();

    scheduler.start(4, onAdvance, onComplete);
    advance(500); // 4 pairs × 100ms = 400ms total

    expect(onAdvance).toHaveBeenCalledTimes(3); // pairs 2, 3, 4
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("fires onComplete at pairCount × durationMs", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createPAStudyScheduler(clock, { studyDurationMs: 200 });
    const onComplete = vi.fn();

    scheduler.start(3, vi.fn(), onComplete);
    advance(599);
    expect(onComplete).not.toHaveBeenCalled();
    advance(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("stop() cancels all pending timers", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createPAStudyScheduler(clock, { studyDurationMs: 100 });
    const onAdvance = vi.fn();
    const onComplete = vi.fn();

    scheduler.start(4, onAdvance, onComplete);
    advance(150); // fires first advance
    scheduler.stop();
    advance(500); // nothing should fire

    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("calling start() again clears previous timers", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createPAStudyScheduler(clock, { studyDurationMs: 100 });
    const firstComplete = vi.fn();
    const secondComplete = vi.fn();

    scheduler.start(2, vi.fn(), firstComplete);
    scheduler.start(2, vi.fn(), secondComplete); // restart
    advance(300);

    expect(firstComplete).not.toHaveBeenCalled();
    expect(secondComplete).toHaveBeenCalledTimes(1);
  });

  it("uses default 2000ms duration when no options provided", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createPAStudyScheduler(clock);
    const onComplete = vi.fn();

    scheduler.start(1, vi.fn(), onComplete);
    advance(1999);
    expect(onComplete).not.toHaveBeenCalled();
    advance(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("fires no onAdvance when pairCount is 1", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createPAStudyScheduler(clock, { studyDurationMs: 100 });
    const onAdvance = vi.fn();
    const onComplete = vi.fn();

    scheduler.start(1, onAdvance, onComplete);
    advance(200);

    expect(onAdvance).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
