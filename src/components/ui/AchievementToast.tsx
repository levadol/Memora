"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { ACHIEVEMENT_DEFS } from "@/lib/achievements";

export function AchievementToast() {
  const toastId = useAppStore((s) => s.achievementToast);
  const setToast = useAppStore((s) => s.setAchievementToast);
  const t = useTranslations();

  useEffect(() => {
    if (!toastId) return;
    const timerId = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timerId);
  }, [toastId, setToast]);

  const def = ACHIEVEMENT_DEFS.find((d) => d.id === toastId);

  return (
    <AnimatePresence>
      {toastId && def && (
        <motion.div
          key={toastId}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 inset-x-0 flex justify-center z-[100] pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="glass rounded-[var(--radius-md)] px-6 py-3 flex items-center gap-3 shadow-lg">
            <span className="text-2xl" aria-hidden="true">🏆</span>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {t(def.titleKey as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t(def.descKey as Parameters<typeof t>[0])}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
