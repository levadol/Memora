import { PAIcon } from "./PAIcons";

interface PAStudyCardProps {
  iconId: string;
  word: string;
}

export function PAStudyCard({ iconId, word }: PAStudyCardProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex h-36 w-36 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <PAIcon iconId={iconId} size={80} />
      </div>
      <span className="text-2xl font-semibold text-[var(--color-text-primary)]">
        {word}
      </span>
    </div>
  );
}
