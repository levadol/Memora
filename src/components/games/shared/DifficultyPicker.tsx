"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { GlassButton } from "@/components/ui/GlassButton";
import { useAppStore } from "@/lib/store";
import type { Difficulty, GameId } from "@/lib/storage/types";
import { TOTAL_BLOCKS_SHORT, TRIALS_PER_BLOCK_SHORT } from "@/lib/games/n-back/constants";

interface DifficultyPickerProps {
  gameId: GameId;
}

const DIFFICULTY_KEYS: Difficulty[] = ["easy", "medium", "hard"];

type GameTranslationKey =
  | "digitSpan"
  | "corsiBlocks"
  | "nBack"
  | "patternMatrix"
  | "pairedAssociates"
  | "arithmeticBlitz"
  | "arithmeticChain"
  | "arithmeticTof";

const GAME_TRANSLATION_MAP: Record<GameId, GameTranslationKey> = {
  "digit-span": "digitSpan",
  "corsi-blocks": "corsiBlocks",
  "n-back": "nBack",
  "pattern-matrix": "patternMatrix",
  "paired-associates": "pairedAssociates",
  "arithmetic-blitz": "arithmeticBlitz",
  "arithmetic-chain": "arithmeticChain",
  "arithmetic-tof": "arithmeticTof",
};

export function DifficultyPicker({ gameId }: DifficultyPickerProps) {
  const t = useTranslations();
  const settings = useAppStore((s) => s.settings);
  const setGameDifficulty = useAppStore((s) => s.setGameDifficulty);
  const setNBackShortSession = useAppStore((s) => s.setNBackShortSession);
  const closeGame = useAppStore((s) => s.closeGame);
  const [selected, setSelected] = useState<Difficulty>(settings.defaultDifficulty);
  const [shortSession, setShortSession] = useState(false);
  const isNBack = gameId === "n-back";

  const gameKey = GAME_TRANSLATION_MAP[gameId];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "1") setSelected("easy");
      else if (e.key === "2") setSelected("medium");
      else if (e.key === "3") setSelected("hard");
      else if (e.key === "Enter") { if (isNBack) setNBackShortSession(shortSession); setGameDifficulty(selected); }
      else if (e.key === "Escape") closeGame();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, shortSession, isNBack, setGameDifficulty, setNBackShortSession, closeGame]);

  function getDesc(difficulty: Difficulty): string {
    // Each game key and difficulty is statically known — translated in messages files
    if (gameKey === "digitSpan") {
      if (difficulty === "easy") return t("difficultyPicker.games.digitSpan.easy");
      if (difficulty === "medium") return t("difficultyPicker.games.digitSpan.medium");
      return t("difficultyPicker.games.digitSpan.hard");
    }
    if (gameKey === "corsiBlocks") {
      if (difficulty === "easy") return t("difficultyPicker.games.corsiBlocks.easy");
      if (difficulty === "medium") return t("difficultyPicker.games.corsiBlocks.medium");
      return t("difficultyPicker.games.corsiBlocks.hard");
    }
    if (gameKey === "nBack") {
      if (difficulty === "easy") return t("difficultyPicker.games.nBack.easy");
      if (difficulty === "medium") return t("difficultyPicker.games.nBack.medium");
      return t("difficultyPicker.games.nBack.hard");
    }
    if (gameKey === "patternMatrix") {
      if (difficulty === "easy") return t("difficultyPicker.games.patternMatrix.easy");
      if (difficulty === "medium") return t("difficultyPicker.games.patternMatrix.medium");
      return t("difficultyPicker.games.patternMatrix.hard");
    }
    if (gameKey === "pairedAssociates") {
      if (difficulty === "easy") return t("difficultyPicker.games.pairedAssociates.easy");
      if (difficulty === "medium") return t("difficultyPicker.games.pairedAssociates.medium");
      return t("difficultyPicker.games.pairedAssociates.hard");
    }
    if (gameKey === "arithmeticBlitz") {
      if (difficulty === "easy") return t("difficultyPicker.games.arithmeticBlitz.easy");
      if (difficulty === "medium") return t("difficultyPicker.games.arithmeticBlitz.medium");
      return t("difficultyPicker.games.arithmeticBlitz.hard");
    }
    if (gameKey === "arithmeticChain") {
      if (difficulty === "easy") return t("difficultyPicker.games.arithmeticChain.easy");
      if (difficulty === "medium") return t("difficultyPicker.games.arithmeticChain.medium");
      return t("difficultyPicker.games.arithmeticChain.hard");
    }
    // arithmeticTof
    if (difficulty === "easy") return t("difficultyPicker.games.arithmeticTof.easy");
    if (difficulty === "medium") return t("difficultyPicker.games.arithmeticTof.medium");
    return t("difficultyPicker.games.arithmeticTof.hard");
  }

  const gameName = (() => {
    if (gameKey === "digitSpan") return t("games.digitSpan.name");
    if (gameKey === "corsiBlocks") return t("games.corsiBlocks.name");
    if (gameKey === "nBack") return t("games.nBack.name");
    if (gameKey === "patternMatrix") return t("games.patternMatrix.name");
    if (gameKey === "pairedAssociates") return t("games.pairedAssociates.name");
    if (gameKey === "arithmeticBlitz") return t("games.arithmeticBlitz.name");
    if (gameKey === "arithmeticChain") return t("games.arithmeticChain.name");
    return t("games.arithmeticTof.name");
  })();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-4"
      role="main"
      aria-label={t("difficultyPicker.title")}
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{gameName}</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">{t("difficultyPicker.title")}</p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3">
        {DIFFICULTY_KEYS.map((d, i) => {
          const isSelected = selected === d;
          return (
            <button
              key={d}
              onClick={() => setSelected(d)}
              className={[
                "flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all",
                isSelected
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-text-primary)]"
                  : "border-[var(--color-glass-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/50",
              ].join(" ")}
              aria-pressed={isSelected}
            >
              <span className="w-6 shrink-0 text-center text-sm font-mono text-[var(--color-text-secondary)]">
                {i + 1}
              </span>
              <div>
                <div className="font-semibold">{t(`difficulty.${d}`)}</div>
                <div className="text-sm opacity-70">{getDesc(d)}</div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[var(--color-text-secondary)]">{t("difficultyPicker.keyHint")}</p>

      {isNBack && (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface)] px-5 py-3 text-[var(--color-text-primary)] transition-all hover:border-[var(--color-accent)]/50">
          <input
            type="checkbox"
            checked={shortSession}
            onChange={(e) => setShortSession(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          <div>
            <div className="font-semibold">{t("game.nBackShortSession")}</div>
            <div className="text-sm opacity-70">
              {t("game.nBackShortSessionDesc", { blocks: TOTAL_BLOCKS_SHORT, trials: TRIALS_PER_BLOCK_SHORT })}
            </div>
          </div>
        </label>
      )}

      <div className="flex gap-3">
        <GlassButton variant="ghost" onClick={closeGame}>
          {t("game.quit")}
        </GlassButton>
        <GlassButton variant="primary" onClick={() => { if (isNBack) setNBackShortSession(shortSession); setGameDifficulty(selected); }}>
          {t("difficultyPicker.start")}
        </GlassButton>
      </div>
    </div>
  );
}
