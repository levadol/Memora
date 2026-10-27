"use client";

interface TofTimerBarProps {
  durationMs: number;
}

export function TofTimerBar({ durationMs }: TofTimerBarProps) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-glass-border)]">
      <div
        className="tof-timer-fill h-full origin-left rounded-full"
        style={{ animationDuration: `${durationMs}ms` }}
      />
    </div>
  );
}
