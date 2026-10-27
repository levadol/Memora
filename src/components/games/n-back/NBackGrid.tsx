"use client";

interface NBackGridProps {
  activeCell: number | null;
}

export function NBackGrid({ activeCell }: NBackGridProps) {
  return (
    <div
      role="group"
      aria-label="N-Back grid"
      className="grid grid-cols-3 gap-3"
      dir="ltr"
    >
      {Array.from({ length: 9 }, (_, i) => {
        const isActive = activeCell === i;
        return (
          <div
            key={i}
            className={[
              "h-20 w-20 rounded-[var(--radius-md)] border transition-all duration-150",
              isActive
                ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] shadow-[0_0_16px_var(--color-accent)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]",
            ].join(" ")}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
