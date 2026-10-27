export const SCHEMA_VERSION = 1;

export type GameId =
  | "digit-span"
  | "corsi-blocks"
  | "n-back"
  | "pattern-matrix"
  | "paired-associates"
  | "arithmetic-blitz"
  | "arithmetic-chain"
  | "arithmetic-tof";

export type Difficulty = "easy" | "medium" | "hard";

export type Locale = "en" | "ru" | "he";

export interface SessionRecord {
  id: string;
  gameId: GameId;
  mode: string;
  difficulty: Difficulty;
  score: number;
  accuracy: number; // 0–1
  maxSpan: number | null; // null for level-based games
  maxLevel: number | null;
  duration: number; // seconds
  timestamp: string; // UTC ISO string
  extras: Record<string, unknown>;
}

export interface AchievementState {
  id: string;
  unlockedAt: string | null; // UTC ISO string, null = locked
}

export interface AppSettings {
  locale: Locale;
  soundEnabled: boolean;
  volume: number; // 0–1
  reducedMotion: boolean;
  theme: "dark" | "light" | "system";
  defaultDifficulty: Difficulty;
}

export interface DailyTrainingPersisted {
  date: string; // YYYY-MM-DD local date key
  queue: GameId[];
  progress: number;
}

export interface AppData {
  version: number;
  sessions: SessionRecord[];
  achievements: AchievementState[];
  settings: AppSettings;
  dailyTraining?: DailyTrainingPersisted;
  arithmeticDailyTraining?: DailyTrainingPersisted;
}

export const DEFAULT_SETTINGS: AppSettings = {
  locale: "en",
  soundEnabled: true,
  volume: 0.7,
  reducedMotion: false,
  theme: "dark",
  defaultDifficulty: "medium",
};

export const DEFAULT_DATA: AppData = {
  version: SCHEMA_VERSION,
  sessions: [],
  achievements: [],
  settings: DEFAULT_SETTINGS,
};
