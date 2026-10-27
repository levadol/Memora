import { describe, it, expect, beforeEach } from "vitest";
import { createCorsiScheduler } from "@/lib/scheduler";
import type { Clock, CorsiSchedulerEvent } from "@/lib/scheduler/types";

function makeFakeClock() {
  let now = 0;
  const timers = new Map<number, { fn: () => void; at: number }>();
  let nextId = 1;

  const clock: Clock = {
    now: () => now,
    setTimeout(fn, ms) {
      const id = nextId++;
      timers.set(id, { fn, at: now + ms });
      return id as ReturnType<typeof globalThis.setTimeout>;
    },
    clearTimeout(id) {
      timers.delete(id as unknown as number);
    },
  };

  function advanceTo(target: number) {
    // Fire all timers that are due up to `target`, in order
    let changed = true;
    while (changed) {
      changed = false;
      const due = [...timers.entries()]
        .filter(([, v]) => v.at <= target)
        .sort((a, b) => a[1].at - b[1].at);
      if (due.length > 0) {
        const [id, { fn, at }] = due[0]!;
        timers.delete(id);
        now = at;
        fn();
        changed = true;
      }
    }
    now = target;
  }

  return { clock, advanceTo };
}

describe("createCorsiScheduler", () => {
  let events: CorsiSchedulerEvent[];
  let { clock, advanceTo } = makeFakeClock();

  beforeEach(() => {
    ({ clock, advanceTo } = makeFakeClock());
    events = [];
  });

  it("fires BLOCK_ON → BLOCK_OFF for each block, then SEQUENCE_COMPLETE", () => {
    const scheduler = createCorsiScheduler(clock);
    scheduler.start([2, 5], (e) => events.push(e));

    // t=0: BLOCK_ON block 2
    advanceTo(0);
    expect(events).toEqual([{ type: "BLOCK_ON", sequenceIndex: 0, blockIndex: 2 }]);

    // t=400: BLOCK_OFF block 2
    advanceTo(400);
    expect(events[1]).toEqual({ type: "BLOCK_OFF", sequenceIndex: 0, blockIndex: 2 });

    // t=600: BLOCK_ON block 5
    advanceTo(600);
    expect(events[2]).toEqual({ type: "BLOCK_ON", sequenceIndex: 1, blockIndex: 5 });

    // t=1000: BLOCK_OFF block 5
    advanceTo(1000);
    expect(events[3]).toEqual({ type: "BLOCK_OFF", sequenceIndex: 1, blockIndex: 5 });

    // t=1200: SEQUENCE_COMPLETE
    advanceTo(1200);
    expect(events[4]).toEqual({ type: "SEQUENCE_COMPLETE" });
    expect(events).toHaveLength(5);
  });

  it("stop() cancels all pending timers", () => {
    const scheduler = createCorsiScheduler(clock);
    scheduler.start([0, 1, 2], (e) => events.push(e));

    advanceTo(0); // fires first BLOCK_ON
    scheduler.stop();
    advanceTo(2000); // nothing more should fire

    expect(events).toHaveLength(1); // only the first BLOCK_ON
  });

  it("calling start() twice replaces previous timers", () => {
    const scheduler = createCorsiScheduler(clock);
    scheduler.start([0, 1, 2], () => events.push({ type: "SEQUENCE_COMPLETE" }));
    // Start a new sequence immediately — old timers should be cancelled
    const events2: CorsiSchedulerEvent[] = [];
    scheduler.start([3], (e) => events2.push(e));

    advanceTo(2000);

    // Original callback never received any events
    expect(events).toHaveLength(0);
    // New sequence completed normally
    expect(events2.some((e) => e.type === "SEQUENCE_COMPLETE")).toBe(true);
  });
});
