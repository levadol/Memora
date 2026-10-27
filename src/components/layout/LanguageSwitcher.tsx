"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  ru: "RU",
  he: "HE",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isRoundInProgress = useAppStore((s) => s.isRoundInProgress);

  const handleChange = (nextLocale: string) => {
    if (isRoundInProgress) return;
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex gap-1" role="group" aria-label="Language">
      {Object.entries(LOCALE_LABELS).map(([loc, label]) => (
        <button
          key={loc}
          type="button"
          onClick={() => handleChange(loc)}
          disabled={isRoundInProgress}
          aria-pressed={loc === locale}
          className={[
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            loc === locale
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
            isRoundInProgress ? "cursor-not-allowed opacity-40" : "",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
