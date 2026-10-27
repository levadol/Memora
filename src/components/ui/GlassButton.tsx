"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function GlassButton({
  className,
  variant = "primary",
  size = "md",
  children,
  disabled,
  onClick,
  type = "button",
  ...rest
}: GlassButtonProps) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.button
      type={type}
      whileTap={reducedMotion || disabled ? {} : { scale: 0.96 }}
      whileHover={reducedMotion || disabled ? {} : { scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-sm)] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]",
        variant === "primary" &&
          "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-end)] text-white shadow-lg",
        variant === "ghost" &&
          "bg-[var(--color-surface)] border border-[var(--color-glass-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3.5 text-base",
        disabled && "cursor-not-allowed opacity-40",
        className
      )}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}
