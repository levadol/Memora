import { describe, it, expect } from "vitest";
import { createNBackScheduler } from "@/lib/scheduler/n-back";
import type { Clock, NBackSchedulerEvent } from "@/lib/scheduler/types";

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

  return { clock, advance };
}

describe("createNBackScheduler", () => {
  it("fires STIMULUS_ON at index 0 at time 0 (or near start)", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createNBackScheduler(clock);
    const events: NBackSchedulerEvent[] = [];
    scheduler.start(3, (e) => events.push(e));

    advance(0);
    const onEvents = events.filter((e) => e.type === "STIMULUS_ON" && (e as { index: number }).index === 0);
    expect(onEvents.length).toBe(1);
  });

  it("fires STIMULUS_ON for each trial", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createNBackScheduler(clock);
    const events: NBackSchedulerEvent[] = [];
    scheduler.start(3, (e) => events.push(e));

    advance(10000);
    const onEvents = events.filter((e) => e.type === "STIMULUS_ON");
    expect(onEvents.length).toBe(3);
  });

  it("fires STIMULUS_OFF for each trial after STIMULUS_ON", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createNBackScheduler(clock);
    const events: NBackSchedulerEvent[] = [];
    scheduler.start(3, (e) => events.push(e));

    advance(10000);
    const offEvents = events.filter((e) => e.type === "STIMULUS_OFF");
    expect(offEvents.length).toBe(3);
  });

  it("STIMULUS_ON fires before STIMULUS_OFF for each trial", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createNBackScheduler(clock);
    const events: NBackSchedulerEvent[] = [];
    scheduler.start(2, (e) => events.push(e));

    advance(10000);
    for (let i = 0; i < 2; i++) {
      const on = events.findIndex(
        (e) => e.type === "STIMULUS_ON" && (e as { index: number }).index === i
      );
      const off = events.findIndex(
        (e) => e.type === "STIMULUS_OFF" && (e as { index: number }).index === i
      );
      expect(on).toBeGreaterThanOrEqual(0);
      expect(off).toBeGreaterThan(on);
    }
  });

  it("fires BLOCK_COMPLETE after all trials", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createNBackScheduler(clock);
    const events: NBackSchedulerEvent[] = [];
    scheduler.start(2, (e) => events.push(e));

    advance(10000);
    const blockComplete = events.filter((e) => e.type === "BLOCK_COMPLETE");
    expect(blockComplete.length).toBe(1);
    // BLOCK_COMPLETE must be last event
    expect(events[events.length - 1]!.type).toBe("BLOCK_COMPLETE");
  });

  it("stop() cancels pending timers — no events after stop", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createNBackScheduler(clock);
    const events: NBackSchedulerEvent[] = [];
    scheduler.start(5, (e) => events.push(e));

    advance(0); // index 0 STIMULUS_ON fires
    scheduler.stop();
    const countAfterStop = events.length;

    advance(20000); // advance far past end
    expect(events.length).toBe(countAfterStop);
  });

  it("fires events with monotonically increasing indices for STIMULUS_ON", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createNBackScheduler(clock);
    const events: NBackSchedulerEvent[] = [];
    scheduler.start(4, (e) => events.push(e));

    advance(15000);
    const onIndices = events
      .filter((e) => e.type === "STIMULUS_ON")
      .map((e) => (e as { index: number }).index);
    expect(onIndices).toEqual([0, 1, 2, 3]);
  });

  it("stimulus on/off indices match across events", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createNBackScheduler(clock);
    const events: NBackSchedulerEvent[] = [];
    scheduler.start(3, (e) => events.push(e));

    advance(15000);
    const onIndices = new Set(
      events.filter((e) => e.type === "STIMULUS_ON").map((e) => (e as { index: number }).index)
    );
    const offIndices = new Set(
      events.filter((e) => e.type === "STIMULUS_OFF").map((e) => (e as { index: number }).index)
    );
    expect(onIndices).toEqual(offIndices);
  });
});
