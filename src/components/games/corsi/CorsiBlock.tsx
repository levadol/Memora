"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { BLOCK_POSITIONS } from "@/lib/games/corsi/constants";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface CorsiBlockProps {
  index: number;
  isLit: boolean;
  isClickable: boolean;
  onClick: () => void;
  size?: number;
}

const BLOCK_SIZE = 56;

export function CorsiBlock({
  index,
  isLit,
  isClickable,
  onClick,
  size = BLOCK_SIZE,
}: CorsiBlockProps) {
  const t = useTranslations("game");
  const reducedMotion = useReducedMotion();
  const pos = BLOCK_POSITIONS[index];
  if (!pos) return null;

  return (
    <motion.button
      onClick={isClickable ? onClick : undefined}
      animate={{ scale: isLit && !reducedMotion ? 1.12 : 1 }}
      transition={reducedMotion ? { duration: 0.1 } : { type: "spring", stiffness: 400, damping: 20 }}
      whileTap={!reducedMotion && isClickable ? { scale: 0.92 } : {}}
      aria-label={t("blockLabel", { index: index + 1 })}
      aria-pressed={isLit}
      style={{
        position: "absolute",
        insetInlineStart: `${String(pos.inlinePercent)}%`,
        insetBlockStart: `${String(pos.blockPercent)}%`,
        width: size,
        height: size,
        borderRadius: "var(--radius-sm)",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.08)",
        cursor: isClickable ? "pointer" : "default",
        transform: "translate(-50%, -50%)",
        overflow: "hidden",
        padding: 0,
      }}
    >
      {/* Glow layer — only opacity animated */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-[-6px] rounded-full bg-[var(--color-accent)] blur-lg"
        animate={{ opacity: isLit && !reducedMotion ? 0.7 : 0 }}
        transition={{ duration: 0.2 }}
      />
      {/* Fill layer — only opacity animated */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[var(--color-accent)]"
        animate={{ opacity: isLit ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.15 }}
        style={{ borderRadius: "inherit" }}
      />
    </motion.button>
  );
}
