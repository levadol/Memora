import { describe, it, expect } from "vitest";
import { createTofScheduler } from "@/lib/scheduler/tof";
import type { Clock } from "@/lib/scheduler/types";

function makeFakeClock() {
  const timers: Map<number, { cb: () => void; time: number }> = new Map();
  let nextId = 1;
  let now = 0;

  const clock: Clock = {
    now: () => now,
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

describe("createTofScheduler", () => {
  it("fires TIME_UP after the given duration", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createTofScheduler(clock);
    const events: { type: string }[] = [];

    scheduler.startItem(1000, (e) => events.push(e));
    advance(999);
    expect(events).toHaveLength(0);
    advance(1);
    expect(events).toEqual([{ type: "TIME_UP" }]);
  });

  it("stop() prevents TIME_UP from firing", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createTofScheduler(clock);
    const events: unknown[] = [];

    scheduler.startItem(500, (e) => events.push(e));
    scheduler.stop();
    advance(1000);

    expect(events).toHaveLength(0);
  });

  it("calling startItem again cancels the previous timer", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createTofScheduler(clock);
    const events: unknown[] = [];

    scheduler.startItem(1000, (e) => events.push(e));
    advance(400);
    scheduler.startItem(200, (e) => events.push(e)); // restart with shorter duration
    advance(200);

    expect(events).toHaveLength(1); // only the second timer fired
  });
});
