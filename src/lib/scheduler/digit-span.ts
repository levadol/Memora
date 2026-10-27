import type { Clock, DigitSpanScheduler, DigitSpanSchedulerEvent } from "./types";

const DIGIT_ON_MS = 800;
const DIGIT_BLANK_MS = 200;
const STEP_MS = DIGIT_ON_MS + DIGIT_BLANK_MS;

export function createDigitSpanScheduler(clock: Clock): DigitSpanScheduler {
  let timers: ReturnType<typeof clock.setTimeout>[] = [];

  return {
    start(sequence: number[], onEvent: (e: DigitSpanSchedulerEvent) => void) {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];

      sequence.forEach((digit, i) => {
        const onAt = i * STEP_MS;
        const offAt = onAt + DIGIT_ON_MS;

        timers.push(
          clock.setTimeout(
            () => onEvent({ type: "DIGIT_ON", sequenceIndex: i, digit }),
            onAt
          )
        );
        timers.push(
          clock.setTimeout(
            () => onEvent({ type: "DIGIT_OFF", sequenceIndex: i }),
            offAt
          )
        );
      });

      const doneAt = sequence.length * STEP_MS;
      timers.push(
        clock.setTimeout(() => onEvent({ type: "SEQUENCE_COMPLETE" }), doneAt)
      );
    },

    stop() {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];
    },
  };
}
