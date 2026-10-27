import type { Clock, CorsiScheduler } from "./types";

const BLOCK_ON_MS = 400;
const BLOCK_OFF_MS = 200;

export function createCorsiScheduler(clock: Clock): CorsiScheduler {
  let timers: ReturnType<typeof clock.setTimeout>[] = [];

  return {
    start(sequence, onEvent) {
      timers.forEach((id) => clock.clearTimeout(id));
      timers = [];

      sequence.forEach((blockIndex, i) => {
        const onAt = i * (BLOCK_ON_MS + BLOCK_OFF_MS);
        const offAt = onAt + BLOCK_ON_MS;

        timers.push(
          clock.setTimeout(
            () => onEvent({ type: "BLOCK_ON", sequenceIndex: i, blockIndex }),
            onAt
          )
        );
        timers.push(
          clock.setTimeout(
            () => onEvent({ type: "BLOCK_OFF", sequenceIndex: i, blockIndex }),
            offAt
          )
        );
      });

      const doneAt = sequence.length * (BLOCK_ON_MS + BLOCK_OFF_MS);
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
