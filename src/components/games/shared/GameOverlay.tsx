"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { CorsiGame } from "@/components/games/corsi/CorsiGame";
import { PatternGame } from "@/components/games/pattern-matrix/PatternGame";
import { DigitSpanGame } from "@/components/games/digit-span/DigitSpanGame";
import { NBackGame } from "@/components/games/n-back/NBackGame";
import { PairedAssociatesGame } from "@/components/games/paired-associates/PairedAssociatesGame";
import { DifficultyPicker } from "@/components/games/shared/DifficultyPicker";
import { ArithmeticBlitzGame } from "@/components/games/arithmetic-blitz/ArithmeticBlitzGame";
import { ArithmeticChainGame } from "@/components/games/arithmetic-chain/ArithmeticChainGame";
import { ArithmeticTofGame } from "@/components/games/arithmetic-tof/ArithmeticTofGame";
import type { GameId, Difficulty } from "@/lib/storage/types";

export function GameOverlay() {
  const activeGame = useAppStore((s) => s.activeGame);
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {activeGame && (
        <motion.div
          key={activeGame.gameId}
          layoutId={reducedMotion ? undefined : `game-card-${activeGame.gameId}`}
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ background: "var(--color-bg-base)" }}
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.97 }}
          transition={
            reducedMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 300, damping: 30 }
          }
        >
          <GameContent
            gameId={activeGame.gameId}
            mode={activeGame.mode}
            difficulty={activeGame.difficulty}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GameContent({
  gameId,
  mode,
  difficulty,
}: {
  gameId: GameId;
  mode: string;
  difficulty: Difficulty | null;
}) {
  if (difficulty === null) {
    return <DifficultyPicker gameId={gameId} />;
  }

  switch (gameId) {
    case "corsi-blocks":
      return <CorsiGame mode={mode} />;
    case "pattern-matrix":
      return <PatternGame mode={mode} />;
    case "digit-span":
      return <DigitSpanGame mode={mode} />;
    case "n-back":
      return <NBackGame mode={mode} />;
    case "paired-associates":
      return <PairedAssociatesGame mode={mode} />;
    case "arithmetic-blitz":
      return <ArithmeticBlitzGame mode={mode} />;
    case "arithmetic-chain":
      return <ArithmeticChainGame mode={mode} />;
    case "arithmetic-tof":
      return <ArithmeticTofGame mode={mode} />;
    default:
      return (
        <div className="flex min-h-screen items-center justify-center text-[var(--color-text-secondary)]">
          {gameId} — coming soon
        </div>
      );
  }
}
