"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function BackgroundBlobs() {
  const reducedMotion = useAppStore((s) => s.settings.reducedMotion);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 30, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 30, damping: 30 });

  useEffect(() => {
    if (reducedMotion) return;
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [reducedMotion, mouseX, mouseY]);

  const drift = reducedMotion
    ? {}
    : {
        animate: {
          x: ["-10%", "10%", "-10%"],
          y: ["-8%", "8%", "-8%"],
        },
        transition: {
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[var(--color-bg-base)]" />

      {/* Blob 1 — purple */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute -top-40 -start-40 h-[600px] w-[600px] rounded-full bg-[var(--color-bg-blob-1)] opacity-40"
        {...drift}
        transition={{ ...(drift.transition ?? {}), duration: 18 }}
      />

      {/* Blob 2 — blue */}
      <motion.div
        className="absolute top-1/2 -end-60 h-[500px] w-[500px] rounded-full bg-[var(--color-bg-blob-2)] opacity-30"
        {...drift}
        transition={{ ...(drift.transition ?? {}), duration: 24, delay: 4 }}
      />

      {/* Blob 3 — teal */}
      <motion.div
        className="absolute -bottom-40 start-1/3 h-[400px] w-[400px] rounded-full bg-[var(--color-bg-blob-3)] opacity-25"
        {...drift}
        transition={{ ...(drift.transition ?? {}), duration: 22, delay: 8 }}
      />

      {/* Blur layer over blobs */}
      <div
        className="absolute inset-0"
        style={{ backdropFilter: "blur(var(--blur-blob))" }}
      />
    </div>
  );
}
