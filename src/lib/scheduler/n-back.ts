import type { Clock, NBackScheduler, NBackSchedulerEvent } from "./types";

const DEFAULT_STIMULUS_ON_MS = 2000;
const DEFAULT_STEP_MS = 2500;

export interface NBackSchedulerOptions {
  stimulusOnMs?: number;
  stepMs?: number;
}

export function createNBackScheduler(
  clock: Clock,
  opts?: NBackSchedulerOptions
): NBackScheduler {
  const stimulusOnMs = opts?.stimulusOnMs ?? DEFAULT_STIMULUS_ON_MS;
  const stepMs = opts?.stepMs ?? DEFAULT_STEP_MS;
  let timers: ReturnType<typeof clock.setTimeout>[] = [];

  return {
    start(trialCount, onEvent: (e: NBackSchedulerEvent) => void) {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];
      for (let i = 0; i < trialCount; i++) {
        const idx = i;
        timers.push(
          clock.setTimeout(
            () => onEvent({ type: "STIMULUS_ON", index: idx }),
            idx * stepMs
          )
        );
        timers.push(
          clock.setTimeout(
            () => onEvent({ type: "STIMULUS_OFF", index: idx }),
            idx * stepMs + stimulusOnMs
          )
        );
      }
      timers.push(
        clock.setTimeout(
          () => onEvent({ type: "BLOCK_COMPLETE" }),
          trialCount * stepMs
        )
      );
    },
    stop() {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];
    },
  };
}
