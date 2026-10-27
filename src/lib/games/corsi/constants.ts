export const BLOCK_POSITIONS: readonly { inlinePercent: number; blockPercent: number }[] = [
  { inlinePercent: 15, blockPercent: 70 },
  { inlinePercent: 30, blockPercent: 20 },
  { inlinePercent: 50, blockPercent: 60 },
  { inlinePercent: 65, blockPercent: 15 },
  { inlinePercent: 80, blockPercent: 55 },
  { inlinePercent: 10, blockPercent: 40 },
  { inlinePercent: 45, blockPercent: 85 },
  { inlinePercent: 70, blockPercent: 75 },
  { inlinePercent: 90, blockPercent: 30 },
] as const;

export const BLOCK_COUNT = BLOCK_POSITIONS.length;

export const STARTING_SPAN: Record<string, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

export const MIN_SPAN = 2;
export const MAX_SPAN = BLOCK_COUNT;
export const TOTAL_ROUNDS = 10;
