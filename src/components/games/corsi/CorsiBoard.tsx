"use client";

import { BLOCK_COUNT } from "@/lib/games/corsi/constants";
import { CorsiBlock } from "./CorsiBlock";

interface CorsiBoardProps {
  litBlockIndex: number | null;
  isClickable: boolean;
  onTap: (index: number) => void;
}

export function CorsiBoard({
  litBlockIndex,
  isClickable,
  onTap,
}: CorsiBoardProps) {
  const blocks = Array.from({ length: BLOCK_COUNT }, (_, i) => i);

  return (
    <div
      role="group"
      aria-label="Corsi blocks"
      className="relative mx-auto"
      style={{ width: "min(90vw, 480px)", height: "min(90vw, 480px)" }}
    >
      {blocks.map((i) => (
        <CorsiBlock
          key={i}
          index={i}
          isLit={litBlockIndex === i}
          isClickable={isClickable}
          onClick={() => onTap(i)}
        />
      ))}
    </div>
  );
}
