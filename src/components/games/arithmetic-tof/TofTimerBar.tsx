"use client";

interface TofTimerBarProps {
  durationMs: number;
  currentIndex: number;
  totalItems: number;
}

export function TofTimerBar({ durationMs, currentIndex, totalItems }: TofTimerBarProps) {
  return (
    <div
      className="flex items-center gap-3"
      style={{ width: "min(calc(100% - 32px), 440px)", margin: "0 auto" }}
    >
      {/* Per-item countdown bar */}
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-glass-border)]"
      >
        <div
          className="tof-timer-fill h-full origin-left rounded-full"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
      {/* Session progress counter */}
      <span
        className="ltr-nums shrink-0 text-sm tabular-nums text-[var(--color-text-secondary)]"
        style={{ direction: "ltr" }}
        aria-label={`Item ${currentIndex + 1} of ${totalItems}`}
      >
        {currentIndex + 1}&thinsp;/&thinsp;{totalItems}
      </span>
    </div>
  );
}
