import { describe, it, expect } from "vitest";
import { createPatternScheduler } from "@/lib/scheduler/pattern";
import type { Clock } from "@/lib/scheduler/types";

function makeFakeClock() {
  let time = 0;
  const pending: Array<{ at: number; fn: () => void; id: number }> = [];
  let nextId = 1;

  const clock: Clock = {
    now: () => time,
    setTimeout(fn, ms) {
      const id = nextId++;
      pending.push({ at: time + ms, fn, id });
      return id as ReturnType<typeof globalThis.setTimeout>;
    },
    clearTimeout(id) {
      const idx = pending.findIndex((p) => p.id === id);
      if (idx !== -1) pending.splice(idx, 1);
    },
  };

  function advance(ms: number) {
    time += ms;
    const fired = pending.filter((p) => p.at <= time);
    fired.forEach((p) => {
      const idx = pending.indexOf(p);
      if (idx !== -1) pending.splice(idx, 1);
      p.fn();
    });
  }

  return { clock, advance };
}

describe("createPatternScheduler", () => {
  it("fires PREVIEW_COMPLETE after durationMs", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createPatternScheduler(clock);
    const events: string[] = [];
    scheduler.start(1000, (e) => events.push(e.type));

    advance(999);
    expect(events).toHaveLength(0);

    advance(1);
    expect(events).toEqual(["PREVIEW_COMPLETE"]);
  });

  it("stop() prevents the event from firing", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createPatternScheduler(clock);
    const events: string[] = [];
    scheduler.start(1000, (e) => events.push(e.type));

    advance(500);
    scheduler.stop();
    advance(600);

    expect(events).toHaveLength(0);
  });

  it("calling start() twice cancels the previous timer", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createPatternScheduler(clock);
    const events: string[] = [];

    scheduler.start(1000, (e) => events.push(e.type));
    advance(500);
    scheduler.start(1000, (e) => events.push(e.type)); // restart
    advance(1000);

    expect(events).toHaveLength(1);
  });

  it("stop() when already stopped is a no-op", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createPatternScheduler(clock);
    expect(() => {
      scheduler.stop();
      scheduler.stop();
    }).not.toThrow();
    advance(100);
  });
});
