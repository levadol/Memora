"use client";

import { useTranslations } from "next-intl";

interface NumericKeypadProps {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  showMinus?: boolean;
  disabled?: boolean;
}

export function NumericKeypad({
  onDigit,
  onBackspace,
  onSubmit,
  showMinus = false,
  disabled = false,
}: NumericKeypadProps) {
  const t = useTranslations();

  const btnClass =
    "flex h-14 w-full items-center justify-center rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface)] text-xl font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-glass-bg)] active:scale-95 disabled:opacity-40 ltr-nums";

  return (
    <div
      className="w-full max-w-[280px] select-none"
      role="group"
      aria-label={t("game.digitPad")}
    >
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            className={btnClass}
            onClick={() => onDigit(d)}
            disabled={disabled}
            aria-label={t("game.digitAriaLabel", { digit: d })}
          >
            {d}
          </button>
        ))}
        {/* Bottom row: [−] [0] [←] or [ ] [0] [←] */}
        <button
          type="button"
          className={btnClass}
          onClick={() => onDigit("-")}
          disabled={disabled || !showMinus}
          aria-label="minus"
          style={showMinus ? undefined : { visibility: "hidden" }}
        >
          −
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={() => onDigit("0")}
          disabled={disabled}
          aria-label={t("game.digitAriaLabel", { digit: "0" })}
        >
          0
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={onBackspace}
          disabled={disabled}
          aria-label="Backspace"
        >
          ←
        </button>
      </div>
      <button
        type="button"
        className="mt-2 flex h-14 w-full items-center justify-center rounded-xl bg-[var(--color-accent)] text-lg font-semibold text-white transition-colors hover:opacity-90 active:scale-95 disabled:opacity-40"
        onClick={onSubmit}
        disabled={disabled}
        aria-label="Submit answer"
      >
        ✓
      </button>
    </div>
  );
}
