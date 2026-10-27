interface HeatmapCalendarProps {
  activeDates: Set<string>;
  now: Date;
  label?: string;
}

export function HeatmapCalendar({ activeDates, now, label }: HeatmapCalendarProps) {
  const WEEKS = 12;
  const DAYS = 7;

  const cells: { key: string; active: boolean }[] = [];
  for (let i = WEEKS * DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
    cells.push({ key, active: activeDates.has(key) });
  }

  return (
    <div
      className="flex gap-1 flex-wrap"
      role="img"
      aria-label={label ?? "Activity calendar"}
    >
      {Array.from({ length: WEEKS }, (_, w) => (
        <div key={w} className="flex flex-col gap-1">
          {cells.slice(w * DAYS, (w + 1) * DAYS).map((cell) => (
            <div
              key={cell.key}
              title={cell.key}
              className={[
                "h-3 w-3 rounded-sm transition-colors",
                cell.active
                  ? "bg-[var(--color-accent)]"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)]",
              ].join(" ")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
