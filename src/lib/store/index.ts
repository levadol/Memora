"use client";

import { create } from "zustand";
import type { AppSettings, GameId, Difficulty } from "@/lib/storage/types";
import { DEFAULT_SETTINGS } from "@/lib/storage/types";

export type ActiveGame = {
  gameId: GameId;
  mode: string;
  difficulty: Difficulty | null; // null = show difficulty picker before game
} | null;

const DAILY_GAMES: GameId[] = [
  "digit-span",
  "corsi-blocks",
  "n-back",
  "pattern-matrix",
  "paired-associates",
];

const ARITHMETIC_DAILY_GAMES: GameId[] = [
  "arithmetic-blitz",
  "arithmetic-chain",
  "arithmetic-tof",
];

interface AppState {
  settings: AppSettings;
  activeGame: ActiveGame;
  isRoundInProgress: boolean;
  achievementToast: string | null;
  // Daily training — dailyProgress = number of games COMPLETED (0…queue.length)
  dailyQueue: GameId[] | null;
  dailyProgress: number;
  dailySummary: boolean;
  // Arithmetic daily training
  arithmeticDailyQueue: GameId[] | null;
  arithmeticDailyProgress: number;
  arithmeticDailySummary: boolean;
  setSettings: (s: Partial<AppSettings>) => void;
  openGame: (gameId: GameId, mode?: string, difficulty?: Difficulty | null) => void;
  closeGame: () => void;
  setRoundInProgress: (v: boolean) => void;
  setAchievementToast: (id: string | null) => void;
  setGameDifficulty: (d: Difficulty) => void;
  startDailyTraining: () => void;
  markDailyGameComplete: (gameId: GameId) => void;
  continueDaily: () => void;
  stopDailyTraining: () => void;
  dismissDailySummary: () => void;
  startArithmeticTraining: () => void;
  markArithmeticGameComplete: (gameId: GameId) => void;
  continueArithmetic: () => void;
  stopArithmeticTraining: () => void;
  dismissArithmeticSummary: () => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  activeGame: null,
  isRoundInProgress: false,
  achievementToast: null,
  dailyQueue: null,
  dailyProgress: 0,
  dailySummary: false,
  arithmeticDailyQueue: null,
  arithmeticDailyProgress: 0,
  arithmeticDailySummary: false,
  setSettings: (s) =>
    set((state) => ({ settings: { ...state.settings, ...s } })),
  openGame: (gameId, mode = "default", difficulty = null) =>
    set({ activeGame: { gameId, mode, difficulty }, isRoundInProgress: false }),
  closeGame: () => set({ activeGame: null, isRoundInProgress: false }),
  setRoundInProgress: (v) => set({ isRoundInProgress: v }),
  setAchievementToast: (id) => set({ achievementToast: id }),
  setGameDifficulty: (d) =>
    set((state) =>
      state.activeGame ? { activeGame: { ...state.activeGame, difficulty: d } } : {}
    ),
  startDailyTraining: () => {
    const defaultDifficulty = get().settings.defaultDifficulty;
    set({ dailyQueue: DAILY_GAMES, dailyProgress: 0, dailySummary: false });
    get().openGame(DAILY_GAMES[0]!, "default", defaultDifficulty);
  },
  // Called by useSessionResult when a session is saved during daily training.
  // Only advances when the saved game matches the current queue position.
  // Does NOT open the next game — the user navigates home and clicks "Continue".
  markDailyGameComplete: (gameId: GameId) => {
    const { dailyQueue, dailyProgress } = get();
    if (!dailyQueue) return;
    if (dailyQueue[dailyProgress] !== gameId) return;
    const completed = dailyProgress + 1;
    if (completed >= dailyQueue.length) {
      set({ dailyProgress: completed, dailySummary: true });
    } else {
      set({ dailyProgress: completed });
    }
  },
  // Opens the next game in the queue. Called from Home "Continue Training" button.
  continueDaily: () => {
    const { dailyQueue, dailyProgress, settings } = get();
    if (!dailyQueue || dailyProgress >= dailyQueue.length) return;
    get().openGame(dailyQueue[dailyProgress]!, "default", settings.defaultDifficulty);
  },
  stopDailyTraining: () =>
    set({ dailyQueue: null, dailyProgress: 0, dailySummary: false, activeGame: null }),
  dismissDailySummary: () =>
    set({ dailyQueue: null, dailyProgress: 0, dailySummary: false }),
  startArithmeticTraining: () => {
    const defaultDifficulty = get().settings.defaultDifficulty;
    set({ arithmeticDailyQueue: ARITHMETIC_DAILY_GAMES, arithmeticDailyProgress: 0, arithmeticDailySummary: false });
    get().openGame(ARITHMETIC_DAILY_GAMES[0]!, "default", defaultDifficulty);
  },
  markArithmeticGameComplete: (gameId: GameId) => {
    const { arithmeticDailyQueue, arithmeticDailyProgress } = get();
    if (!arithmeticDailyQueue) return;
    if (arithmeticDailyQueue[arithmeticDailyProgress] !== gameId) return;
    const completed = arithmeticDailyProgress + 1;
    if (completed >= arithmeticDailyQueue.length) {
      set({ arithmeticDailyProgress: completed, arithmeticDailySummary: true });
    } else {
      set({ arithmeticDailyProgress: completed });
    }
  },
  continueArithmetic: () => {
    const { arithmeticDailyQueue, arithmeticDailyProgress, settings } = get();
    if (!arithmeticDailyQueue || arithmeticDailyProgress >= arithmeticDailyQueue.length) return;
    get().openGame(arithmeticDailyQueue[arithmeticDailyProgress]!, "default", settings.defaultDifficulty);
  },
  stopArithmeticTraining: () =>
    set({ arithmeticDailyQueue: null, arithmeticDailyProgress: 0, arithmeticDailySummary: false, activeGame: null }),
  dismissArithmeticSummary: () =>
    set({ arithmeticDailyQueue: null, arithmeticDailyProgress: 0, arithmeticDailySummary: false }),
}));

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_E2E === "1") {
  (window as unknown as Record<string, unknown>).__openGame = (
    gameId: string,
    mode: string
  ) => {
    useAppStore.getState().openGame(gameId as import("@/lib/storage/types").GameId, mode);
  };
}
