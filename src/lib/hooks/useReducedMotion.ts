"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";

/**
 * Returns true when either the in-app "Reduce motion" setting is on
 * or the OS-level prefers-reduced-motion media query is active.
 * Subscribes to OS-level changes so it stays in sync while the page is open.
 */
export function useReducedMotion(): boolean {
  const appSetting = useAppStore((s) => s.settings.reducedMotion);

  const [systemPrefers, setSystemPrefers] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setSystemPrefers(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return appSetting || systemPrefers;
}
