import { describe, it, expect } from "vitest";
import { createDigitSpanScheduler } from "@/lib/scheduler/digit-span";
import type { Clock, DigitSpanSchedulerEvent } from "@/lib/scheduler/types";

// ── fake clock ────────────────────────────────────────────────────────────────

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
    // collect all callbacks that fire within [now, target] in order
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

// ── tests ─────────────────────────────────────────────────────────────────────

describe("createDigitSpanScheduler", () => {
  it("fires DIGIT_ON at t=0 for first digit", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createDigitSpanScheduler(clock);
    const events: DigitSpanSchedulerEvent[] = [];

    scheduler.start([3, 7], (e) => events.push(e));
    advance(0);

    expect(events).toEqual([{ type: "DIGIT_ON", sequenceIndex: 0, digit: 3 }]);
  });

  it("fires DIGIT_OFF at t=800", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createDigitSpanScheduler(clock);
    const events: DigitSpanSchedulerEvent[] = [];

    scheduler.start([3, 7], (e) => events.push(e));
    advance(800);

    expect(events.at(-1)).toEqual({ type: "DIGIT_OFF", sequenceIndex: 0 });
  });

  it("fires DIGIT_ON for second digit at t=1000", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createDigitSpanScheduler(clock);
    const events: DigitSpanSchedulerEvent[] = [];

    scheduler.start([3, 7], (e) => events.push(e));
    advance(1000);

    const onEvents = events.filter((e) => e.type === "DIGIT_ON");
    expect(onEvents).toHaveLength(2);
    expect(onEvents[1]).toEqual({ type: "DIGIT_ON", sequenceIndex: 1, digit: 7 });
  });

  it("fires SEQUENCE_COMPLETE at t = span * 1000", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createDigitSpanScheduler(clock);
    const events: DigitSpanSchedulerEvent[] = [];

    scheduler.start([3, 7, 1], (e) => events.push(e));
    advance(3000);

    expect(events.at(-1)).toEqual({ type: "SEQUENCE_COMPLETE" });
  });

  it("full sequence of events for 3-digit sequence", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createDigitSpanScheduler(clock);
    const events: DigitSpanSchedulerEvent[] = [];

    scheduler.start([5, 2, 8], (e) => events.push(e));
    advance(3000);

    expect(events).toEqual([
      { type: "DIGIT_ON", sequenceIndex: 0, digit: 5 },
      { type: "DIGIT_OFF", sequenceIndex: 0 },
      { type: "DIGIT_ON", sequenceIndex: 1, digit: 2 },
      { type: "DIGIT_OFF", sequenceIndex: 1 },
      { type: "DIGIT_ON", sequenceIndex: 2, digit: 8 },
      { type: "DIGIT_OFF", sequenceIndex: 2 },
      { type: "SEQUENCE_COMPLETE" },
    ]);
  });

  it("stop() cancels all pending events", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createDigitSpanScheduler(clock);
    const events: DigitSpanSchedulerEvent[] = [];

    scheduler.start([3, 7, 1], (e) => events.push(e));
    advance(0); // fires DIGIT_ON for first digit
    scheduler.stop();
    advance(5000); // nothing more should fire

    expect(events).toEqual([{ type: "DIGIT_ON", sequenceIndex: 0, digit: 3 }]);
  });

  it("restart clears old timers before starting new ones", () => {
    const { clock, advance } = makeFakeClock();
    const scheduler = createDigitSpanScheduler(clock);
    const events: DigitSpanSchedulerEvent[] = [];

    scheduler.start([3, 7], (e) => events.push(e));
    // Restart immediately with a different sequence
    scheduler.start([9], (e) => events.push(e));
    advance(1000);

    const onEvents = events.filter((e) => e.type === "DIGIT_ON");
    // Only the second sequence's DIGIT_ON should fire
    expect(onEvents).toEqual([{ type: "DIGIT_ON", sequenceIndex: 0, digit: 9 }]);
  });
});
