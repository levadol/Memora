"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

export function PageTransition({ children, dir }: { children: React.ReactNode; dir: "ltr" | "rtl" }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const sign = dir === "rtl" ? -1 : 1;

  return (
    <motion.div
      key={pathname}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: sign * 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reducedMotion
          ? { duration: 0.15 }
          : { type: "spring", stiffness: 320, damping: 30 }
      }
    >
      {children}
    </motion.div>
  );
}
