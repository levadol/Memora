"use client";

import type { AppData, AppSettings, DailyTrainingPersisted, SessionRecord } from "./types";
import type { StorageAdapter } from "./StorageAdapter";
import { DEFAULT_DATA, SCHEMA_VERSION } from "./types";
import { migrate } from "./migrations";

const KEY = "memora_v1";

export class LocalStorageAdapter implements StorageAdapter {
  load(): AppData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT_DATA };
      const parsed = JSON.parse(raw) as { version?: number } & Partial<AppData>;
      const fromVersion =
        typeof parsed.version === "number" ? parsed.version : 0;
      if (fromVersion !== SCHEMA_VERSION) return migrate(parsed, fromVersion);
      return parsed as AppData;
    } catch {
      return { ...DEFAULT_DATA };
    }
  }

  save(data: AppData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // storage full or unavailable
    }
  }

  addSession(session: SessionRecord): void {
    const data = this.load();
    data.sessions.push(session);
    this.save(data);
  }

  updateSettings(settings: Partial<AppSettings>): void {
    const data = this.load();
    data.settings = { ...data.settings, ...settings };
    this.save(data);
  }

  unlockAchievement(id: string): void {
    const data = this.load();
    const existing = data.achievements.find((a) => a.id === id);
    if (existing?.unlockedAt) return;
    if (existing) {
      existing.unlockedAt = new Date().toISOString();
    } else {
      data.achievements.push({ id, unlockedAt: new Date().toISOString() });
    }
    this.save(data);
  }

  updateDailyTraining(state: DailyTrainingPersisted | null): void {
    const data = this.load();
    if (state === null) {
      delete data.dailyTraining;
    } else {
      data.dailyTraining = state;
    }
    this.save(data);
  }

  updateArithmeticTraining(state: DailyTrainingPersisted | null): void {
    const data = this.load();
    if (state === null) {
      delete data.arithmeticDailyTraining;
    } else {
      data.arithmeticDailyTraining = state;
    }
    this.save(data);
  }

  reset(): void {
    localStorage.removeItem(KEY);
  }
}
