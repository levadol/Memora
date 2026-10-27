import type { AppData, SessionRecord } from "./storage/types";

export interface AchievementDef {
  id: string;
  titleKey: string;
  descKey: string;
  check: (data: AppData) => boolean;
}

function maxMetric(
  sessions: SessionRecord[],
  gameId: string,
  field: "maxSpan" | "maxLevel"
): number {
  return Math.max(
    0,
    ...sessions.filter((s) => s.gameId === gameId).map((s) => s[field] ?? 0)
  );
}

function longestStreak(sessions: SessionRecord[]): number {
  const days = new Set(sessions.map((s) => s.timestamp.slice(0, 10)));
  const sorted = [...days].sort();
  if (sorted.length === 0) return 0;
  let max = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1]! + "T12:00:00");
    const b = new Date(sorted[i]! + "T12:00:00");
    if (Math.round((b.getTime() - a.getTime()) / 86400000) === 1) {
      run++;
      if (run > max) max = run;
    } else {
      run = 1;
    }
  }
  return max;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first_session",
    titleKey: "achievements.firstSession.title",
    descKey: "achievements.firstSession.desc",
    check: (d) => d.sessions.length >= 1,
  },
  {
    id: "sessions_10",
    titleKey: "achievements.sessions10.title",
    descKey: "achievements.sessions10.desc",
    check: (d) => d.sessions.length >= 10,
  },
  {
    id: "all_games",
    titleKey: "achievements.allGames.title",
    descKey: "achievements.allGames.desc",
    check: (d) => {
      const played = new Set(d.sessions.map((s) => s.gameId));
      return (
        ["digit-span", "corsi-blocks", "n-back", "pattern-matrix", "paired-associates"] as const
      ).every((id) => played.has(id));
    },
  },
  {
    id: "digit_span_8",
    titleKey: "achievements.digitSpan8.title",
    descKey: "achievements.digitSpan8.desc",
    check: (d) => maxMetric(d.sessions, "digit-span", "maxSpan") >= 8,
  },
  {
    id: "corsi_8",
    titleKey: "achievements.corsi8.title",
    descKey: "achievements.corsi8.desc",
    check: (d) => maxMetric(d.sessions, "corsi-blocks", "maxSpan") >= 8,
  },
  {
    id: "n_back_3",
    titleKey: "achievements.nBack3.title",
    descKey: "achievements.nBack3.desc",
    check: (d) => maxMetric(d.sessions, "n-back", "maxLevel") >= 3,
  },
  {
    id: "pattern_10",
    titleKey: "achievements.pattern10.title",
    descKey: "achievements.pattern10.desc",
    check: (d) => maxMetric(d.sessions, "pattern-matrix", "maxLevel") >= 10,
  },
  {
    id: "pa_perfect",
    titleKey: "achievements.paPerfect.title",
    descKey: "achievements.paPerfect.desc",
    check: (d) =>
      d.sessions.some(
        (s) => s.gameId === "paired-associates" && s.accuracy >= 1.0 && s.score > 0
      ),
  },
  {
    id: "streak_3",
    titleKey: "achievements.streak3.title",
    descKey: "achievements.streak3.desc",
    check: (d) => longestStreak(d.sessions) >= 3,
  },
  {
    id: "streak_7",
    titleKey: "achievements.streak7.title",
    descKey: "achievements.streak7.desc",
    check: (d) => longestStreak(d.sessions) >= 7,
  },
  {
    id: "blitz_first",
    titleKey: "achievements.blitzFirst.title",
    descKey: "achievements.blitzFirst.desc",
    check: (d) => d.sessions.some((s) => s.gameId === "arithmetic-blitz"),
  },
  {
    id: "blitz_20",
    titleKey: "achievements.blitz20.title",
    descKey: "achievements.blitz20.desc",
    check: (d) => d.sessions.some((s) => s.gameId === "arithmetic-blitz" && s.score >= 20),
  },
  {
    id: "chain_first",
    titleKey: "achievements.chainFirst.title",
    descKey: "achievements.chainFirst.desc",
    check: (d) => d.sessions.some((s) => s.gameId === "arithmetic-chain"),
  },
  {
    id: "chain_length_6",
    titleKey: "achievements.chainLength6.title",
    descKey: "achievements.chainLength6.desc",
    check: (d) => maxMetric(d.sessions, "arithmetic-chain", "maxLevel") >= 6,
  },
  {
    id: "tof_first",
    titleKey: "achievements.tofFirst.title",
    descKey: "achievements.tofFirst.desc",
    check: (d) => d.sessions.some((s) => s.gameId === "arithmetic-tof"),
  },
  {
    id: "tof_perfect",
    titleKey: "achievements.tofPerfect.title",
    descKey: "achievements.tofPerfect.desc",
    check: (d) =>
      d.sessions.some(
        (s) => s.gameId === "arithmetic-tof" && s.accuracy >= 1.0 && s.score > 0
      ),
  },
];

export function evaluateNewAchievements(data: AppData): string[] {
  const alreadyUnlocked = new Set(
    data.achievements.filter((a) => a.unlockedAt !== null).map((a) => a.id)
  );
  const newlyUnlocked: string[] = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (!alreadyUnlocked.has(def.id) && def.check(data)) {
      newlyUnlocked.push(def.id);
    }
  }
  return newlyUnlocked;
}
