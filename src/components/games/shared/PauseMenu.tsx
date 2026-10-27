"use client";

import { Modal } from "@/components/ui/Modal";
import { GlassButton } from "@/components/ui/GlassButton";
import { useTranslations } from "next-intl";

interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export function PauseMenu({ open, onResume, onRestart, onQuit }: PauseMenuProps) {
  const t = useTranslations("game");
  return (
    <Modal open={open} onClose={onResume} title={t("pause")}>
      <div className="flex flex-col gap-3">
        <GlassButton onClick={onResume} size="md" className="w-full">
          {t("resume")}
        </GlassButton>
        <GlassButton onClick={onRestart} size="md" variant="ghost" className="w-full">
          {t("restart")}
        </GlassButton>
        <GlassButton onClick={onQuit} size="md" variant="ghost" className="w-full">
          {t("quit")}
        </GlassButton>
      </div>
    </Modal>
  );
}
