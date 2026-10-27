import type { Clock, ChainScheduler } from "./types";

export function createChainScheduler(clock: Clock): ChainScheduler {
  let timers: ReturnType<typeof clock.setTimeout>[] = [];

  return {
    start(stepCount, stepDisplayMs, onEvent) {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];

      for (let i = 0; i < stepCount; i++) {
        const idx = i;
        timers.push(
          clock.setTimeout(() => onEvent({ type: "STEP_SHOW", index: idx }), idx * stepDisplayMs)
        );
      }
      timers.push(
        clock.setTimeout(
          () => onEvent({ type: "CHAIN_COMPLETE" }),
          stepCount * stepDisplayMs
        )
      );
    },

    stop() {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];
    },
  };
}
