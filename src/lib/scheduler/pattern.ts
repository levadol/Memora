import type { Clock, PatternScheduler, PatternSchedulerEvent } from "./types";

export function createPatternScheduler(clock: Clock): PatternScheduler {
  let timerId: ReturnType<typeof clock.setTimeout> | null = null;

  return {
    start(durationMs, onEvent: (e: PatternSchedulerEvent) => void) {
      if (timerId !== null) clock.clearTimeout(timerId);
      timerId = clock.setTimeout(() => {
        timerId = null;
        onEvent({ type: "PREVIEW_COMPLETE" });
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
