import type { AppData, AppSettings, DailyTrainingPersisted, SessionRecord } from "./types";

export interface StorageAdapter {
  load(): AppData;
  save(data: AppData): void;
  addSession(session: SessionRecord): void;
  updateSettings(settings: Partial<AppSettings>): void;
  unlockAchievement(id: string): void;
  updateDailyTraining(state: DailyTrainingPersisted | null): void;
  updateArithmeticTraining(state: DailyTrainingPersisted | null): void;
  reset(): void;
}
