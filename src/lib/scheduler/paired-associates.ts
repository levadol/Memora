import type { Clock } from "./types";

export interface PAStudySchedulerOptions {
  studyDurationMs?: number;
}

export interface PAStudyScheduler {
  start(
    pairCount: number,
    onAdvance: () => void,
    onComplete: () => void
  ): void;
  stop(): void;
}

const DEFAULT_DURATION_MS = 2000;

export function createPAStudyScheduler(
  clock: Clock,
  opts?: PAStudySchedulerOptions
): PAStudyScheduler {
  const durationMs = opts?.studyDurationMs ?? DEFAULT_DURATION_MS;
  let timers: ReturnType<typeof clock.setTimeout>[] = [];

  return {
    start(pairCount, onAdvance, onComplete) {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];
      for (let i = 1; i < pairCount; i++) {
        timers.push(clock.setTimeout(onAdvance, i * durationMs));
      }
      timers.push(clock.setTimeout(onComplete, pairCount * durationMs));
    },
    stop() {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];
    },
  };
}
