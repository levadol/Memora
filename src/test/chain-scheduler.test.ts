import { describe, it, expect } from "vitest";
import { createChainScheduler } from "@/lib/scheduler/chain";
import type { Clock } from "@/lib/scheduler/types";

function makeFakeClock() {
  const timers: Map<number, { cb: () => void; time: number }> = new Map();
  let nextId = 1;
  let now = 0;

  const clock: Clock = {
    setTimeout(cb, delay) {
      const id = nextId++;
      timers.set(id, { cb, time: now + delay });
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeout(id) {
      timers.delete(id as unknown as number);
    },
  };

  function advance(ms: number) {
    now += ms;
    const fired: number[] = [];
    for (const [id, t] of timers) {
      if (t.time <= now) fired.push(id);
    }
    fired.sort((a, b) => timers.get(a)!.time - timers.get(b)!.time);
    for (const id of fired) {
      const t = timers.get(id);
      timers.delete(id);
      t?.cb();
    }
  }

  return { clock, advance };
}

describe("createChainScheduler", () => {
  it("fires STEP_SHOW events at stepDisplayMs intervals starting at time 0", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createChainScheduler(clock);
    const events: { type: string; index?: number }[] = [];

    scheduler.start(3, 100, (e) => events.push(e));

    advance(0);
    expect(events).toEqual([{ type: "STEP_SHOW", index: 0 }]);

    advance(100);
    expect(events).toEqual([
      { type: "STEP_SHOW", index: 0 },
      { type: "STEP_SHOW", index: 1 },
    ]);

    advance(100);
    expect(events).toEqual([
      { type: "STEP_SHOW", index: 0 },
      { type: "STEP_SHOW", index: 1 },
      { type: "STEP_SHOW", index: 2 },
    ]);
  });

  it("fires CHAIN_COMPLETE after all steps", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createChainScheduler(clock);
    const events: { type: string }[] = [];

    scheduler.start(2, 100, (e) => events.push(e));
    advance(200); // step 0 at 0ms, step 1 at 100ms, COMPLETE at 200ms
    advance(100); // fire the CHAIN_COMPLETE timer

    const types = events.map((e) => e.type);
    expect(types).toContain("CHAIN_COMPLETE");
  });

  it("fires exactly stepCount+1 total events (N STEP_SHOW + 1 CHAIN_COMPLETE)", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createChainScheduler(clock);
    const events: unknown[] = [];

    scheduler.start(4, 50, (e) => events.push(e));
    // Advance through all 5 timers (4 steps + 1 complete)
    for (let i = 0; i < 5; i++) advance(50);

    expect(events).toHaveLength(5);
  });

  it("stop() prevents future events from firing", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createChainScheduler(clock);
    const events: unknown[] = [];

    scheduler.start(3, 100, (e) => events.push(e));
    advance(0); // fires STEP_SHOW index 0
    scheduler.stop();
    advance(100); // would fire index 1 but scheduler is stopped
    advance(100); // would fire index 2
    advance(100); // would fire COMPLETE

    expect(events).toHaveLength(1);
  });

  it("calling start() again cancels pending timers from previous run", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createChainScheduler(clock);
    const events: unknown[] = [];

    scheduler.start(3, 100, (e) => events.push(e));
    // Do NOT advance — restart before any timer fires to prove old timers are purged
    const freshEvents: unknown[] = [];
    scheduler.start(2, 50, (e) => freshEvents.push(e));

    advance(200); // enough time for both the fresh 2-step chain (0, 50, 100ms) to complete

    // Old run had 3 steps at 100ms intervals — those timers were cancelled,
    // so their events should NOT appear in freshEvents
    const freshStepShows = freshEvents.filter((e) => (e as { type: string }).type === "STEP_SHOW");
    expect(freshStepShows).toHaveLength(2); // exactly 2 steps from the fresh run
    // The old timers at 100ms, 200ms, 300ms were cancelled, so no stale events in freshEvents
    expect(events).toHaveLength(0); // no old-run events (all cancelled before firing)
  });
});
