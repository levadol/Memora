export interface Clock {
  now(): number;
  setTimeout(fn: () => void, ms: number): ReturnType<typeof globalThis.setTimeout>;
  clearTimeout(id: ReturnType<typeof globalThis.setTimeout>): void;
}

export type CorsiSchedulerEvent =
  | { type: "BLOCK_ON"; sequenceIndex: number; blockIndex: number }
  | { type: "BLOCK_OFF"; sequenceIndex: number; blockIndex: number }
  | { type: "SEQUENCE_COMPLETE" };

export interface CorsiScheduler {
  start(sequence: number[], onEvent: (e: CorsiSchedulerEvent) => void): void;
  stop(): void;
}

export type PatternSchedulerEvent = { type: "PREVIEW_COMPLETE" };

export interface PatternScheduler {
  start(durationMs: number, onEvent: (e: PatternSchedulerEvent) => void): void;
  stop(): void;
}

export type DigitSpanSchedulerEvent =
  | { type: "DIGIT_ON"; sequenceIndex: number; digit: number }
  | { type: "DIGIT_OFF"; sequenceIndex: number }
  | { type: "SEQUENCE_COMPLETE" };

export interface DigitSpanScheduler {
  start(sequence: number[], onEvent: (e: DigitSpanSchedulerEvent) => void): void;
  stop(): void;
}

export type NBackSchedulerEvent =
  | { type: "STIMULUS_ON"; index: number }
  | { type: "STIMULUS_OFF"; index: number }
  | { type: "BLOCK_COMPLETE" };

export interface NBackScheduler {
  start(trialCount: number, onEvent: (e: NBackSchedulerEvent) => void): void;
  stop(): void;
}

export type BlitzSchedulerEvent =
  | { type: "TICK" }
  | { type: "TIME_UP" };

export interface BlitzScheduler {
  start(totalSeconds: number, tickIntervalMs: number, onEvent: (e: BlitzSchedulerEvent) => void): void;
  stop(): void;
}

export type ChainSchedulerEvent =
  | { type: "STEP_SHOW"; index: number }
  | { type: "CHAIN_COMPLETE" };

export interface ChainScheduler {
  start(stepCount: number, stepDisplayMs: number, onEvent: (e: ChainSchedulerEvent) => void): void;
  stop(): void;
}

export type TofSchedulerEvent = { type: "TIME_UP" };

export interface TofScheduler {
  startItem(durationMs: number, onEvent: (e: TofSchedulerEvent) => void): void;
  stop(): void;
}
