"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { useTranslations } from "next-intl";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import type { TutorialStep } from "@/lib/games/shared/types";

interface TutorialOverlayProps {
  steps: TutorialStep[];
  onComplete: () => void;
}

export function TutorialOverlay({ steps, onComplete }: TutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const t = useTranslations();
  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const trapRef = useFocusTrap(true, onComplete);

  if (!current) return null;

  return (
    <div
      ref={trapRef as React.RefObject<HTMLDivElement>}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      className="flex min-h-screen items-center justify-center px-4"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
        >
          <GlassCard className="max-w-sm text-center">
            <h2
              id="tutorial-title"
              className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]"
            >
              {t(current.titleKey as Parameters<typeof t>[0])}
            </h2>
            <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
              {t(current.bodyKey as Parameters<typeof t>[0])}
            </p>
            <div className="flex justify-center gap-3">
              <GlassButton variant="ghost" size="sm" onClick={onComplete}>
                {t("game.skip")}
              </GlassButton>
              <GlassButton
                size="sm"
                onClick={() => (isLast ? onComplete() : setStepIndex((s) => s + 1))}
              >
                {isLast ? t("game.letsGo") : t("game.next")}
              </GlassButton>
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
