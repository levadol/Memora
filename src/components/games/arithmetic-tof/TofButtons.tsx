"use client";

import { GlassButton } from "@/components/ui/GlassButton";
import { useTranslations } from "next-intl";

interface TofButtonsProps {
  onAnswer: (choice: boolean) => void;
  disabled: boolean;
}

export function TofButtons({ onAnswer, disabled }: TofButtonsProps) {
  const t = useTranslations("game");

  // In RTL locale (Hebrew) the document flex direction reverses,
  // so rendering [True][False] visually produces [False][True] in RTL.
  // This is the desired mirrored layout per spec.
  return (
    <div className="flex justify-center gap-4">
      <GlassButton
        onClick={() => onAnswer(true)}
        disabled={disabled}
        variant="primary"
        size="lg"
        aria-label={t("tofTrue")}
      >
        {t("tofTrue")}
      </GlassButton>
      <GlassButton
        onClick={() => onAnswer(false)}
        disabled={disabled}
        variant="ghost"
        size="lg"
        aria-label={t("tofFalse")}
      >
        {t("tofFalse")}
      </GlassButton>
    </div>
  );
}
