"use client";

interface TofEquationProps {
  text: string;
  isTrue: boolean;
  showDataAttr: boolean;
}

export function TofEquation({ text, isTrue, showDataAttr }: TofEquationProps) {
  return (
    <div
      className="ltr-nums flex min-h-[4rem] items-center justify-center rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)] px-8 py-4 text-3xl font-bold text-[var(--color-text-primary)]"
      aria-live="polite"
      {...(showDataAttr ? { "data-is-true": String(isTrue) } : {})}
    >
      {text}
    </div>
  );
}
