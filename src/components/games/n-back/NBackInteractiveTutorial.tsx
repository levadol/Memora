"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { NBackGrid } from "./NBackGrid";
import { GlassButton } from "@/components/ui/GlassButton";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { soundSystem } from "@/lib/audio/webAudio";

// 1-back demo: positions in 3×3 grid (0-8). Targets at indices 1 and 3.
// [4, 4, 7, 7, 2, 4]
//  0  1  2  3  4  5
//  ^  ^     ^
//  prime  target=1  target=3
const DEMO_CELLS = [4, 4, 7, 7, 2, 4];
const IS_TARGET = DEMO_CELLS.map((v, i) => i > 0 && v === DEMO_CELLS[i - 1]);

const DEMO_LETTERS = ["B", "B", "D", "D", "F", "B"];
const IS_TARGET_LETTER = DEMO_LETTERS.map((v, i) => i > 0 && v === DEMO_LETTERS[i - 1]);

const STEP_MS = 3000;
const CELL_ON_MS = 2500;

interface Props {
  n: number;
  mode: "position" | "letter";
  onComplete: () => void;
}

export function NBackInteractiveTutorial({ n, mode, onComplete }: Props) {
  const t = useTranslations();
  const reducedMotion = useReducedMotion();

  // step: -1 = not started, 0-5 = demo steps, 6 = end screen
  const [step, setStep] = useState(-1);
  const [cellVisible, setCellVisible] = useState(false);
  const [responded, setResponded] = useState(false);
  const [pressResult, setPressResult] = useState<"hit" | "fa" | null>(null);
  const demoSequence = mode === "letter" ? DEMO_LETTERS : DEMO_CELLS;
  const isTargetArr = mode === "letter" ? IS_TARGET_LETTER : IS_TARGET;
  const isTarget = step >= 0 && step < demoSequence.length ? isTargetArr[step] ?? false : false;

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setStep((s) => {
      const next = s + 1;
      return next;
    });
    setResponded(false);
    setPressResult(null);
    setCellVisible(true);
  }, []);

  useEffect(() => {
    if (step === -1) return; // not started
    if (step >= demoSequence.length) return; // done — show end screen

    // Hide cell after CELL_ON_MS
    cellTimerRef.current = setTimeout(() => setCellVisible(false), CELL_ON_MS);
    // Advance to next step after STEP_MS
    stepTimerRef.current = setTimeout(() => advance(), STEP_MS);

    return () => {
      if (cellTimerRef.current) clearTimeout(cellTimerRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [step, advance, demoSequence.length]);

  const handleMatchPress = useCallback(() => {
    if (step < 0 || step >= demoSequence.length || responded) return;
    setResponded(true);
    const result = isTarget ? "hit" : "fa";
    setPressResult(result);
    if (result === "hit") soundSystem.playTap();
  }, [step, responded, isTarget, demoSequence.length]);

  // Keyboard: Space or M
  useEffect(() => {
    if (step < 0 || step >= demoSequence.length) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleMatchPress();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [step, handleMatchPress, demoSequence.length]);

  const caption = (() => {
    if (step < 0) return "";
    if (step >= demoSequence.length) return "";
    if (step === 0) return t("games.nBack.tutorial.demoPrime");
    if (isTarget) return t("games.nBack.tutorial.demoSame");
    return t("games.nBack.tutorial.demoDiff");
  })();

  const activeCell = mode === "position" && cellVisible && step >= 0 && step < demoSequence.length
    ? (demoSequence[step] as number)
    : null;
  const activeLetter = mode === "letter" && cellVisible && step >= 0 && step < demoSequence.length
    ? (demoSequence[step] as string)
    : null;

  const feedbackCell = pressResult && mode === "position" ? (demoSequence[step] as number) : null;
  const feedbackType = pressResult === "hit" ? "hit" as const : pressResult === "fa" ? "false_alarm" as const : null;

  const isDone = step >= demoSequence.length;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
        {t("games.nBack.tutorial.demoTitle")}
      </h2>

      {/* Demo area */}
      {!isDone && (
        <>
          <div className="flex flex-col items-center gap-4">
            {mode === "position" ? (
              <NBackGrid
                activeCell={activeCell}
                feedbackCell={feedbackCell}
                feedbackType={pressResult ? feedbackType : null}
              />
            ) : (
              <div
                className="flex h-40 w-40 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-7xl font-bold text-[var(--color-text-primary)]"
                dir="ltr"
              >
                {activeLetter ?? ""}
              </div>
            )}

            {/* Step counter dots */}
            <div className="flex gap-2">
              {demoSequence.map((_, i) => (
                <div
                  key={i}
                  className={[
                    "h-2 w-2 rounded-full transition-all",
                    i === step
                      ? "bg-[var(--color-accent)] scale-125"
                      : i < step
                      ? "bg-[var(--color-text-secondary)] opacity-50"
                      : "bg-[var(--color-border)]",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>

          {/* Caption */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`caption-${step}`}
              className={[
                "max-w-xs text-center text-base font-semibold",
                step > 0 && isTarget
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)]",
              ].join(" ")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
              {caption}
            </motion.p>
          </AnimatePresence>

          {/* Match button */}
          <div className="flex flex-col items-center gap-2">
            <motion.button
              type="button"
              onClick={handleMatchPress}
              disabled={responded || step === 0}
              aria-label={t("game.nBackMatch")}
              whileTap={!reducedMotion && !responded && step > 0 ? { scale: 0.93 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={[
                "rounded-[var(--radius-md)] border px-8 py-4 text-lg font-semibold transition-all",
                step > 0 && isTarget && !responded
                  ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] text-[var(--color-accent)] animate-pulse"
                  : responded
                  ? "opacity-40 cursor-not-allowed border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  : step === 0
                  ? "opacity-30 cursor-not-allowed border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  : "border-[var(--color-accent)] opacity-60 text-[var(--color-accent)]",
              ].join(" ")}
            >
              {t("game.nBackMatch")}
            </motion.button>

            {/* Press result feedback */}
            <AnimatePresence mode="wait">
              {pressResult && (
                <motion.span
                  key={pressResult}
                  className={[
                    "text-sm font-semibold",
                    pressResult === "hit"
                      ? "text-[var(--color-correct)]"
                      : "text-[var(--color-incorrect)]",
                  ].join(" ")}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {pressResult === "hit" ? t("game.correct") : t("game.incorrect")}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* End screen */}
      {isDone && (
        <motion.div
          className="flex flex-col items-center gap-6 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
        >
          <p className="max-w-sm text-base text-[var(--color-text-secondary)]">
            {t("games.nBack.tutorial.demoEnd", { n })}
          </p>
          <GlassButton variant="primary" onClick={onComplete}>
            {t("games.nBack.tutorial.demoPlay")}
          </GlassButton>
        </motion.div>
      )}

      {/* Start button (before demo begins) */}
      {step === -1 && (
        <GlassButton variant="primary" onClick={() => { advance(); }}>
          {t("games.nBack.tutorial.demoTitle")}
        </GlassButton>
      )}
    </div>
  );
}
