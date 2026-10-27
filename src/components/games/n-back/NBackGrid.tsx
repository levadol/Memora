"use client";

export type TrialFeedbackType = "hit" | "false_alarm" | "miss" | null;

interface NBackGridProps {
  activeCell: number | null;
  feedbackCell?: number | null;
  feedbackType?: TrialFeedbackType;
}

export function NBackGrid({ activeCell, feedbackCell, feedbackType }: NBackGridProps) {
  return (
    <div
      role="group"
      aria-label="N-Back grid"
      className="grid grid-cols-3 gap-3"
      dir="ltr"
    >
      {Array.from({ length: 9 }, (_, i) => {
        const isActive = activeCell === i;
        const isFeedback = feedbackCell === i && feedbackType !== null;

        let cellClass =
          "h-20 w-20 rounded-[var(--radius-md)] border transition-all duration-150";

        if (isFeedback && feedbackType === "hit") {
          cellClass +=
            " border-[var(--color-correct)] bg-[color-mix(in_srgb,var(--color-correct)_35%,transparent)] shadow-[0_0_16px_var(--color-correct)]";
        } else if (isFeedback && feedbackType === "false_alarm") {
          cellClass +=
            " border-[var(--color-incorrect)] bg-[color-mix(in_srgb,var(--color-incorrect)_25%,transparent)] shadow-[0_0_12px_var(--color-incorrect)]";
        } else if (isFeedback && feedbackType === "miss") {
          cellClass +=
            " border-[var(--color-incorrect)] bg-[var(--color-surface)] shadow-[0_0_0_2px_var(--color-incorrect)]";
        } else if (isActive) {
          cellClass +=
            " border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] shadow-[0_0_16px_var(--color-accent)]";
        } else {
          cellClass += " border-[var(--color-border)] bg-[var(--color-surface)]";
        }

        return (
          <div
            key={i}
            className={cellClass}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
