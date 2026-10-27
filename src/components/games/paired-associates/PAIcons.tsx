"use client";

import { getIconPaths } from "@/lib/games/paired-associates/iconPaths";
import type { MarkType } from "@/lib/games/paired-associates/iconPaths";

interface PAIconProps {
  iconId: string;
  size?: number;
  className?: string;
}

function renderMark(markType: MarkType): React.ReactNode {
  switch (markType) {
    case "none":
      return null;
    case "dot":
      return <circle cx="16" cy="16" r="3.5" fill="currentColor" />;
    case "circle":
      return (
        <circle
          cx="16" cy="16" r="5"
          fill="none" stroke="currentColor" strokeWidth="1.5"
        />
      );
    case "hdash":
      return (
        <line
          x1="10" y1="16" x2="22" y2="16"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        />
      );
    case "vdash":
      return (
        <line
          x1="16" y1="10" x2="16" y2="22"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        />
      );
    case "diag":
      return (
        <line
          x1="10" y1="10" x2="22" y2="22"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        />
      );
    case "x":
      return (
        <>
          <line
            x1="10" y1="10" x2="22" y2="22"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          />
          <line
            x1="10" y1="22" x2="22" y2="10"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          />
        </>
      );
    case "tri":
      return (
        <polygon
          points="16,10 22,21 10,21"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
}

export function PAIcon({ iconId, size = 64, className = "" }: PAIconProps) {
  const { outerPath, markType } = getIconPaths(iconId);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      style={{ color: "var(--color-accent)" }}
    >
      <path
        d={outerPath}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {renderMark(markType)}
    </svg>
  );
}
