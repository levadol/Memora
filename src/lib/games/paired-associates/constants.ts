export const MIN_PAIRS = 4;
export const MAX_PAIRS = 10;
export const STARTING_PAIRS: Record<string, number> = {
  easy: 4,
  medium: 5,
  hard: 6,
};
export const STUDY_DURATION_MS = 2000;
export const FEEDBACK_DURATION_MS = 1500;
export const TOTAL_ROUNDS = 6;

// 8 distinct outer shapes × 8 distinct inner marks = 64 unique icons.
// Rotation was dropped as an axis — symmetric shapes look identical at many rotations.
// Worst case (hard mode, all rounds perfect): 6+7+8+9+10+10 = 50 icons → 64 covers it.
export const OUTER_SHAPES = [
  "ring", "square", "triangle", "diamond",
  "hexagon", "star", "pentagon", "shield",
] as const;

export const INNER_MARKS = [
  "none", "dot", "circle", "hdash",
  "vdash", "diag", "x", "tri",
] as const;

export const ICON_IDS: string[] = OUTER_SHAPES.flatMap((shape) =>
  INNER_MARKS.map((mark) => `${shape}-${mark}`)
);

export type IconId = string;
