import type { Clock, BlitzScheduler } from "./types";

export function createBlitzScheduler(clock: Clock): BlitzScheduler {
  let timers: ReturnType<typeof clock.setTimeout>[] = [];

  return {
    start(totalSeconds, tickIntervalMs, onEvent) {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];

      for (let i = 1; i <= totalSeconds; i++) {
        const t = i * tickIntervalMs;
        timers.push(
          clock.setTimeout(() => onEvent({ type: "TICK" }), t)
        );
      }

      timers.push(
        clock.setTimeout(
          () => onEvent({ type: "TIME_UP" }),
          totalSeconds * tickIntervalMs + 10
        )
      );
    },

    stop() {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];
    },
  };
}
