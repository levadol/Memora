"use client";

import { useAppStore } from "@/lib/store";
import { useStorage } from "@/lib/storage/StorageContext";
import { localDateKey } from "@/lib/streak";

export function useDailyTraining() {
  const storage = useStorage();
  const startDailyTrainingStore = useAppStore((s) => s.startDailyTraining);
  const continueDaily = useAppStore((s) => s.continueDaily);
  const dailyQueue = useAppStore((s) => s.dailyQueue);

  const startDailyTraining = () => {
    startDailyTrainingStore();
    // Persist immediately — the queue is the hardcoded DAILY_GAMES order
    const queue = [
      "digit-span",
      "corsi-blocks",
      "n-back",
      "pattern-matrix",
      "paired-associates",
    ] as const;
    storage.updateDailyTraining({
      date: localDateKey(new Date()),
      queue: [...queue],
      progress: 0,
    });
  };

  return { startDailyTraining, continueDaily, dailyQueue };
}
