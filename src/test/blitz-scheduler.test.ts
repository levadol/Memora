import { describe, it, expect } from "vitest";
import { createBlitzScheduler } from "@/lib/scheduler/blitz";
import type { Clock, BlitzSchedulerEvent } from "@/lib/scheduler/types";

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
      if (t.time <= now) {
        fired.push(id);
      }
    }
    fired.sort((a, b) => timers.get(a)!.time - timers.get(b)!.time);
    for (const id of fired) {
      const t = timers.get(id);
      timers.delete(id);
      t?.cb();
    }
  }

  function timerCount() {
    return timers.size;
  }

  return { clock, advance, timerCount };
}

describe("createBlitzScheduler", () => {
  it("fires TICK once per second for the total duration", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createBlitzScheduler(clock);
    const events: BlitzSchedulerEvent[] = [];
    scheduler.start(5, 1000, (e) => events.push(e));

    advance(5000);
    const ticks = events.filter((e) => e.type === "TICK");
    expect(ticks).toHaveLength(5);
  });

  it("fires TIME_UP after the last tick", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createBlitzScheduler(clock);
    const events: BlitzSchedulerEvent[] = [];
    scheduler.start(3, 1000, (e) => events.push(e));

    advance(3010);
    const timeUp = events.filter((e) => e.type === "TIME_UP");
    expect(timeUp).toHaveLength(1);
  });

  it("TIME_UP fires after all TICKs", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createBlitzScheduler(clock);
    const events: BlitzSchedulerEvent[] = [];
    scheduler.start(3, 1000, (e) => events.push(e));

    advance(3010);
    const lastTick = events.map((e) => e.type).lastIndexOf("TICK");
    const timeUpIndex = events.map((e) => e.type).indexOf("TIME_UP");
    expect(timeUpIndex).toBeGreaterThan(lastTick);
  });

  it("stop() cancels pending timers so no events fire after stop", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createBlitzScheduler(clock);
    const events: BlitzSchedulerEvent[] = [];
    scheduler.start(5, 1000, (e) => events.push(e));

    advance(2000);
    scheduler.stop();
    advance(5000);

    expect(events.filter((e) => e.type === "TICK")).toHaveLength(2);
    expect(events.filter((e) => e.type === "TIME_UP")).toHaveLength(0);
  });

  it("calling start again replaces the previous timers", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createBlitzScheduler(clock);
    const events: BlitzSchedulerEvent[] = [];
    scheduler.start(5, 1000, (e) => events.push(e));
    scheduler.start(3, 1000, (e) => events.push(e));

    advance(3010);
    const ticks = events.filter((e) => e.type === "TICK");
    expect(ticks).toHaveLength(3);
  });

  it("works with accelerated tick interval (E2E mode)", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createBlitzScheduler(clock);
    const events: BlitzSchedulerEvent[] = [];
    scheduler.start(60, 100, (e) => events.push(e));

    advance(6010);
    const ticks = events.filter((e) => e.type === "TICK");
    expect(ticks).toHaveLength(60);
    expect(events.filter((e) => e.type === "TIME_UP")).toHaveLength(1);
  });
});
