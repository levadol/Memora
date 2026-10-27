"use client";

import type { ReactNode } from "react";
import { useAppStore } from "@/lib/store";

interface PageBackgroundProps {
  children: ReactNode;
}

export function PageBackground({ children }: PageBackgroundProps) {
  const isGameActive = useAppStore((s) => s.activeGame !== null);
  return (
    <div style={isGameActive ? { visibility: "hidden" } : undefined}>
      {children}
    </div>
  );
}
