import type { SessionRecord } from "./storage/types";

export interface StreakInfo {
  current: number;
  longest: number;
  totalActiveDays: number;
}

export function localDateKey(date: Date, timeZone?: string): string {
  const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function yesterdayKey(date: Date, tz: string): string {
  const todayStr = localDateKey(date, tz);
  const [y, m, d] = todayStr.split("-").map(Number) as [number, number, number];
  // Use noon UTC on (y, m, d-1) to avoid DST edge cases
  const yesterdayNoon = new Date(Date.UTC(y, m - 1, d - 1, 12, 0, 0));
  return localDateKey(yesterdayNoon, tz);
}

export function computeStreak(
  sessions: SessionRecord[],
  now: Date,
  timeZone?: string
): StreakInfo {
  if (sessions.length === 0) return { current: 0, longest: 0, totalActiveDays: 0 };

  const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const activeDays = new Set<string>();
  for (const s of sessions) {
    activeDays.add(localDateKey(new Date(s.timestamp), tz));
  }

  const sortedDays = [...activeDays].sort();

  const todayStr = localDateKey(now, tz);
  const ydayStr = yesterdayKey(now, tz);

  const lastActiveDay = sortedDays[sortedDays.length - 1]!;
  const streakIsActive = lastActiveDay === todayStr || lastActiveDay === ydayStr;

  let current = 0;
  if (streakIsActive) {
    current = 1;
    let cursor = lastActiveDay;
    for (let i = sortedDays.length - 2; i >= 0; i--) {
      const prev = sortedDays[i]!;
      const cursorDate = new Date(cursor + "T12:00:00Z");
      const prevDate = new Date(prev + "T12:00:00Z");
      const diffDays = Math.round((cursorDate.getTime() - prevDate.getTime()) / 86400000);
      if (diffDays === 1) {
        current++;
        cursor = prev;
      } else {
        break;
      }
    }
  }

  let longest = sortedDays.length > 0 ? 1 : 0;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(sortedDays[i - 1]! + "T12:00:00Z");
    const curDate = new Date(sortedDays[i]! + "T12:00:00Z");
    const diff = Math.round((curDate.getTime() - prevDate.getTime()) / 86400000);
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, current);

  return { current, longest, totalActiveDays: activeDays.size };
}
