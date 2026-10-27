import type { AppData } from "./types";
import { DEFAULT_DATA, SCHEMA_VERSION } from "./types";

export function migrate(raw: unknown, fromVersion: number): AppData {
  if (fromVersion === SCHEMA_VERSION) return raw as AppData;
  // Future migrations: if (fromVersion < 2) { applyV2Migration(raw); }
  console.warn(
    `[storage] Unknown schema version ${fromVersion}, resetting to defaults`
  );
  return {
    version: SCHEMA_VERSION,
    sessions: [],
    achievements: [],
    settings: { ...DEFAULT_DATA.settings },
  };
}
