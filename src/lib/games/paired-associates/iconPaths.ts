export const OUTER_PATHS: Record<string, string> = {
  ring:     "M16 4 a12 12 0 1 0 0.01 0",
  square:   "M5 5 h22 v22 h-22 z",
  triangle: "M16 3 L30 28 L2 28 z",
  diamond:  "M16 2 L30 16 L16 30 L2 16 z",
  hexagon:  "M16 3 L27.9 9.5 L27.9 22.5 L16 29 L4.1 22.5 L4.1 9.5 z",
  star:     "M16 2 L19.1 11.1 L28.5 11.1 L21.2 16.8 L23.8 26.2 L16 20.8 L8.2 26.2 L10.8 16.8 L3.5 11.1 L12.9 11.1 z",
  pentagon: "M16 3 L28.4 11.9 L23.6 26.5 L8.4 26.5 L3.6 11.9 z",
  shield:   "M16 3 L28 8 V18 Q28 28 16 30 Q4 28 4 18 V8 z",
};

export type MarkType =
  | "none" | "dot" | "circle" | "hdash"
  | "vdash" | "diag" | "x" | "tri";

export interface IconDescriptor {
  outerPath: string;
  markType: MarkType;
}

export function getIconPaths(iconId: string): IconDescriptor {
  const dashIdx = iconId.indexOf("-");
  const shape = dashIdx >= 0 ? iconId.slice(0, dashIdx) : iconId;
  const mark = dashIdx >= 0 ? iconId.slice(dashIdx + 1) : "none";
  return {
    outerPath: OUTER_PATHS[shape] ?? OUTER_PATHS["ring"]!,
    markType: mark as MarkType,
  };
}
