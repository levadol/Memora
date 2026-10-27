import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { PAIcon } from "./PAIcons";

interface PATestCardProps {
  iconId: string;
  options: string[];
  disabled: boolean;
  onAnswer: (word: string) => void;
  correctWord?: string;
}

export function PATestCard({
  iconId,
  options,
  disabled,
  onAnswer,
  correctWord,
}: PATestCardProps) {
  const reducedMotion = useReducedMotion();
  const dataAttr =
    correctWord !== undefined ? { "data-pa-correct-word": correctWord } : {};

  return (
    <div className="flex flex-col items-center gap-6" {...dataAttr}>
      <div className="flex h-36 w-36 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <PAIcon iconId={iconId} size={80} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((word) => (
          <motion.button
            key={word}
            type="button"
            onClick={() => onAnswer(word)}
            disabled={disabled}
            whileTap={!reducedMotion && !disabled ? { scale: 0.94 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={[
              "rounded-[var(--radius-md)] border border-[var(--color-border)] px-6 py-3 text-base font-medium text-[var(--color-text-primary)] transition-all",
              disabled
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] hover:border-[var(--color-accent)]",
            ].join(" ")}
          >
            {word}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
