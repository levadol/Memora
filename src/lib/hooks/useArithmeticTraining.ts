"use client";

import { useAppStore } from "@/lib/store";
import { useStorage } from "@/lib/storage/StorageContext";
import { localDateKey } from "@/lib/streak";

const ARITHMETIC_DAILY_GAMES = [
  "arithmetic-blitz",
  "arithmetic-chain",
  "arithmetic-tof",
] as const;

export function useArithmeticTraining() {
  const storage = useStorage();
  const startArithmeticTrainingStore = useAppStore((s) => s.startArithmeticTraining);
  const continueArithmetic = useAppStore((s) => s.continueArithmetic);
  const arithmeticDailyQueue = useAppStore((s) => s.arithmeticDailyQueue);

  const startArithmeticTraining = () => {
    startArithmeticTrainingStore();
    storage.updateArithmeticTraining({
      date: localDateKey(new Date()),
      queue: [...ARITHMETIC_DAILY_GAMES],
      progress: 0,
    });
  };

  return { startArithmeticTraining, continueArithmetic, arithmeticDailyQueue };
}
