"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations("app");
  const tn = useTranslations("nav");
  const locale = useLocale();

  return (
    <header className="glass sticky top-0 z-40 flex items-center justify-between px-6 py-3">
      <Link
        href={`/${locale}`}
        className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]"
      >
        {t("title")}
      </Link>
      <nav className="flex items-center gap-4">
        <Link
          href={`/${locale}/statistics`}
          className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          {tn("statistics")}
        </Link>
        <Link
          href={`/${locale}/settings`}
          className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          {tn("settings")}
        </Link>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
