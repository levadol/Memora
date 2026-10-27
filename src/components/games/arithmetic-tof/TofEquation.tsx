"use client";

interface TofEquationProps {
  text: string;
  isTrue: boolean;
  showDataAttr: boolean;
  /** Tints the card border: true=green, false=red, null=default */
  feedbackCorrect?: boolean | null;
}

export function TofEquation({ text, isTrue, showDataAttr, feedbackCorrect }: TofEquationProps) {
  const borderColor =
    feedbackCorrect === true
      ? "var(--color-correct)"
      : feedbackCorrect === false
      ? "var(--color-incorrect)"
      : "var(--color-glass-border)";

  return (
    <div
      className="ltr-nums flex min-h-[4rem] items-center justify-center rounded-2xl bg-[var(--color-surface)] px-8 py-4 text-3xl font-bold text-[var(--color-text-primary)] transition-colors duration-200"
      style={{
        width: "min(calc(100% - 32px), 440px)",
        margin: "0 auto",
        border: `2px solid ${borderColor}`,
      }}
      aria-live="polite"
      {...(showDataAttr ? { "data-is-true": String(isTrue) } : {})}
    >
      {text}
    </div>
  );
}
