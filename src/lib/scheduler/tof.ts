import type { Clock, TofScheduler } from "./types";

export function createTofScheduler(clock: Clock): TofScheduler {
  let timerId: ReturnType<typeof clock.setTimeout> | null = null;

  return {
    startItem(durationMs, onEvent) {
      if (timerId !== null) clock.clearTimeout(timerId);
      timerId = clock.setTimeout(() => {
        timerId = null;
        onEvent({ type: "TIME_UP" });
      }, durationMs);
    },

    stop() {
      if (timerId !== null) {
        clock.clearTimeout(timerId);
        timerId = null;
      }
    },
  };
}
