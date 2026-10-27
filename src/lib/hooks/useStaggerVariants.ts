"use client";

import type { Variants } from "framer-motion";

/** Fade-up variants for staggered list entrances. */
export const listVariants = (reducedMotion: boolean): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: reducedMotion ? 0 : 0.07,
    },
  },
});

export const itemVariants = (reducedMotion: boolean): Variants => ({
  hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: reducedMotion
      ? { duration: 0.15 }
      : { type: "spring", stiffness: 350, damping: 28 },
  },
});
