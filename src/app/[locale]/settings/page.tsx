"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useStorage } from "@/lib/storage/StorageContext";
import { GlassButton } from "@/components/ui/GlassButton";
import { Modal } from "@/components/ui/Modal";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { listVariants, itemVariants } from "@/lib/hooks/useStaggerVariants";
import type { Locale, Difficulty } from "@/lib/storage/types";
import type { AppSettings } from "@/lib/storage/types";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "he", label: "עברית" },
];

const THEMES: { value: AppSettings["theme"]; key: "dark" | "light" | "system" }[] = [
  { value: "dark", key: "dark" },
  { value: "light", key: "light" },
  { value: "system", key: "system" },
];

const DIFFICULTIES: { value: Difficulty; key: "easy" | "medium" | "hard" }[] = [
  { value: "easy", key: "easy" },
  { value: "medium", key: "medium" },
  { value: "hard", key: "hard" },
];

export default function SettingsPage() {
  const ts = useTranslations("settings");
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const storage = useStorage();
  const router = useRouter();
  const currentLocale = useLocale();
  const reducedMotion = useReducedMotion();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleLocale(locale: Locale) {
    setSettings({ locale });
    storage.updateSettings({ locale });
    router.push(`/${locale}/settings`);
  }

  function handleSound(enabled: boolean) {
    setSettings({ soundEnabled: enabled });
    storage.updateSettings({ soundEnabled: enabled });
  }

  function handleVolume(v: number) {
    setSettings({ volume: v });
    storage.updateSettings({ volume: v });
  }

  function handleReducedMotion(v: boolean) {
    setSettings({ reducedMotion: v });
    storage.updateSettings({ reducedMotion: v });
  }

  function handleTheme(theme: AppSettings["theme"]) {
    setSettings({ theme });
    storage.updateSettings({ theme });
  }

  function handleDifficulty(defaultDifficulty: Difficulty) {
    setSettings({ defaultDifficulty });
    storage.updateSettings({ defaultDifficulty });
  }

  function handleReset() {
    storage.reset();
    setShowConfirm(false);
    router.refresh();
  }

  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-10 space-y-6"
      variants={listVariants(reducedMotion)}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        variants={itemVariants(reducedMotion)}
        className="text-3xl font-bold text-[var(--color-text-primary)]"
      >
        {ts("title")}
      </motion.h1>

      {/* Language */}
      <motion.section
        variants={itemVariants(reducedMotion)}
        className="surface-card rounded-[var(--radius-lg)] p-6 space-y-3"
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          {ts("language")}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {LOCALES.map(({ value, label }) => (
            <GlassButton
              key={value}
              variant={currentLocale === value ? "primary" : "ghost"}
              size="sm"
              onClick={() => handleLocale(value)}
            >
              {label}
            </GlassButton>
          ))}
        </div>
      </motion.section>

      {/* Sound */}
      <motion.section
        variants={itemVariants(reducedMotion)}
        className="surface-card rounded-[var(--radius-lg)] p-6 space-y-4"
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          {ts("sound")}
        </h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => handleSound(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          <span className="text-sm text-[var(--color-text-primary)]">
            {ts("soundEnabled")}
          </span>
        </label>
        {settings.soundEnabled && (
          <label className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-secondary)] w-16">
              {ts("volume")}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => handleVolume(parseFloat(e.target.value))}
              className="flex-1 accent-[var(--color-accent)]"
              aria-label={ts("volume")}
            />
            <span className="text-sm ltr-nums w-8 text-end">
              {Math.round(settings.volume * 100)}%
            </span>
          </label>
        )}
      </motion.section>

      {/* Accessibility */}
      <motion.section
        variants={itemVariants(reducedMotion)}
        className="surface-card rounded-[var(--radius-lg)] p-6 space-y-3"
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          {ts("accessibility")}
        </h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => handleReducedMotion(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          <span className="text-sm text-[var(--color-text-primary)]">
            {ts("reducedMotion")}
          </span>
        </label>
      </motion.section>

      {/* Theme */}
      <motion.section
        variants={itemVariants(reducedMotion)}
        className="surface-card rounded-[var(--radius-lg)] p-6 space-y-3"
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          {ts("theme")}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {THEMES.map(({ value, key }) => (
            <GlassButton
              key={value}
              variant={settings.theme === value ? "primary" : "ghost"}
              size="sm"
              onClick={() => handleTheme(value)}
            >
              {ts(key)}
            </GlassButton>
          ))}
        </div>
      </motion.section>

      {/* Default Difficulty */}
      <motion.section
        variants={itemVariants(reducedMotion)}
        className="surface-card rounded-[var(--radius-lg)] p-6 space-y-3"
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          {ts("defaultDifficulty")}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map(({ value, key }) => (
            <GlassButton
              key={value}
              variant={settings.defaultDifficulty === value ? "primary" : "ghost"}
              size="sm"
              onClick={() => handleDifficulty(value)}
            >
              {ts(key)}
            </GlassButton>
          ))}
        </div>
      </motion.section>

      {/* Reset */}
      <motion.section
        variants={itemVariants(reducedMotion)}
        className="surface-card rounded-[var(--radius-lg)] p-6 space-y-3"
      >
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          {ts("resetData")}
        </h2>
        <GlassButton variant="ghost" onClick={() => setShowConfirm(true)}>
          {ts("resetData")}
        </GlassButton>
      </motion.section>

      {/* Reset confirmation dialog */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={ts("resetData")}
      >
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          {ts("confirmReset")}
        </p>
        <div className="flex gap-3">
          <GlassButton variant="ghost" onClick={handleReset}>
            {ts("resetConfirmYes")}
          </GlassButton>
          <GlassButton variant="ghost" onClick={() => setShowConfirm(false)}>
            {ts("cancel")}
          </GlassButton>
        </div>
      </Modal>
    </motion.div>
  );
}
