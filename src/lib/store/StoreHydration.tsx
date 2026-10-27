"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useStorage } from "@/lib/storage/StorageContext";
import type { AppSettings } from "@/lib/storage/types";
import { localDateKey } from "@/lib/streak";

function applyTheme(theme: AppSettings["theme"]) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
  } else if (theme === "dark") {
    root.classList.remove("light");
    root.classList.remove("dark");
  } else {
    // system
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("light", !prefersDark);
    root.classList.remove("dark");
  }
}

export function StoreHydration() {
  const storage = useStorage();
  const theme = useAppStore((s) => s.settings.theme);

  useEffect(() => {
    const data = storage.load();
    useAppStore.getState().setSettings(data.settings);

    // Restore daily training if it's still today's session
    if (data.dailyTraining) {
      const today = localDateKey(new Date());
      if (data.dailyTraining.date === today) {
        const { queue, progress } = data.dailyTraining;
        const store = useAppStore.getState();
        if (progress >= queue.length) {
          // All done — show summary
          store.startDailyTraining();
          // Fast-forward progress to completed state
          for (let i = 0; i < queue.length; i++) {
            store.markDailyGameComplete(queue[i]!);
          }
          store.closeGame();
        } else if (progress > 0) {
          // Partially done — restore paused state without opening a game
          useAppStore.setState({
            dailyQueue: queue,
            dailyProgress: progress,
            dailySummary: false,
          });
        }
        // progress === 0 means just started — don't restore (user can re-start)
      } else {
        // Stale — clear from storage
        storage.updateDailyTraining(null);
      }
    }
  }, [storage]);

  useEffect(() => {
    applyTheme(theme);

    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return null;
}
