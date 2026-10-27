"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  animate,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { listVariants, itemVariants } from "@/lib/hooks/useStaggerVariants";

export interface ResultExtra {
  label: string;
  value: string | number;
}

export interface ResultData {
  score: number;
  accuracy: number;
  maxSpan: number | null;
  maxLevel: number | null;
  durationSecs: number;
  personalBest: number | null;
  isNewRecord: boolean;
  prevSessionResult: number | null;
  extras?: ResultExtra[];
}

interface AboutStrings {
  memorySystem: string;
  researchBasis: string;
  evidenceNote: string;
}

interface DailyNextAction {
  label: string;
  onPress: () => void;
}

interface ResultScreenProps {
  data: ResultData;
  about: AboutStrings;
  onPlayAgain: () => void;
  onHome: () => void;
  dailyNext?: DailyNextAction | null;
}

// Animated number driven by a MotionValue — no React re-renders per frame
function AnimatedNumber({ mv, label }: { mv: MotionValue<number>; label: string }) {
  const display = useTransform(mv, (v) => String(Math.round(v)));
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.span className="ltr-nums text-2xl font-bold text-[var(--color-text-primary)]">
        {display}
      </motion.span>
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
}

// Static stat for non-animated values (e.g. duration)
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="ltr-nums text-2xl font-bold text-[var(--color-text-primary)]">
        {value}
      </span>
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
}

// Progress ring using motion.circle pathLength — no dashoffset math, no setState per frame
function AnimatedProgressRing({
  value,
  size = 56,
  strokeWidth = 4,
  reducedMotion,
  ariaLabel,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  reducedMotion: boolean;
  ariaLabel?: string;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const pathLength = useMotionValue(0);

  useEffect(() => {
    const controls = animate(pathLength, clamped, {
      duration: reducedMotion ? 0 : 1,
      ease: "easeOut",
    });
    return controls.stop;
  }, [clamped, reducedMotion, pathLength]);

  return (
    <svg
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="acc-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-accent-end)" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={(size - strokeWidth) / 2}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={(size - strokeWidth) / 2}
        fill="none"
        stroke="url(#acc-grad)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{ pathLength, rotate: -0.25, transformOrigin: "50% 50%" }}
      />
    </svg>
  );
}

// Confetti burst — colored dots that fly outward on mount
const CONFETTI_COLORS = ["#7c5af3", "#22d3a0", "#5a8af5", "#f5a054", "#f25f5c", "#f5e254"];
const PARTICLE_COUNT = 24;
const PARTICLE_DISTS = Array.from({ length: PARTICLE_COUNT }, (_, i) => 80 + ((i * 37 + 17) % 60));

function ConfettiBurst({ active }: { active: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        angle: (i / PARTICLE_COUNT) * 2 * Math.PI,
        dist: PARTICLE_DISTS[i]!,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
      })),
    []
  );

  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map(({ angle, dist, color }, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
          style={{ background: color, x: "-50%", y: "-50%" }}
          initial={{ opacity: 1, scale: 0, x: "-50%", y: "-50%" }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1, 0.6],
            x: `calc(-50% + ${dist * Math.cos(angle)}px)`,
            y: `calc(-50% + ${dist * Math.sin(angle)}px)`,
          }}
          transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.02 }}
        />
      ))}
    </div>
  );
}

export function ResultScreen({ data, about, onPlayAgain, onHome, dailyNext }: ResultScreenProps) {
  const t = useTranslations("results");
  const reducedMotion = useReducedMotion();
  const mins = Math.floor(data.durationSecs / 60);
  const secs = data.durationSecs % 60;
  const durationStr = `${String(mins)}:${String(secs).padStart(2, "0")}`;

  // MotionValues for count-up — initialized to final value when reducedMotion to skip animation
  const scoreMV = useMotionValue(reducedMotion ? data.score : 0);
  const pbMV = useMotionValue(reducedMotion ? (data.personalBest ?? 0) : 0);
  const spanMV = useMotionValue(reducedMotion ? (data.maxSpan ?? 0) : 0);
  const levelMV = useMotionValue(reducedMotion ? (data.maxLevel ?? 0) : 0);

  useEffect(() => {
    if (reducedMotion) return;
    const c1 = animate(scoreMV, data.score, { duration: 0.7, ease: "easeOut" });
    const c2 = animate(pbMV, data.personalBest ?? 0, { duration: 0.9, ease: "easeOut" });
    const c3 = animate(spanMV, data.maxSpan ?? 0, { duration: 0.9, ease: "easeOut" });
    const c4 = animate(levelMV, data.maxLevel ?? 0, { duration: 0.9, ease: "easeOut" });
    return () => { c1.stop(); c2.stop(); c3.stop(); c4.stop(); };
  }, [reducedMotion, data.score, data.personalBest, data.maxSpan, data.maxLevel, scoreMV, pbMV, spanMV, levelMV]);

  const confettiFired = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (data.isNewRecord && !confettiFired.current && !reducedMotion) {
      confettiFired.current = true;
      setShowConfetti(true);
      const id = setTimeout(() => setShowConfetti(false), 1200);
      return () => clearTimeout(id);
    }
  }, [data.isNewRecord, reducedMotion]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <ConfettiBurst active={showConfetti} />

      <AnimatePresence>
        {data.isNewRecord && (
          <motion.p
            className="text-lg font-semibold text-[var(--color-correct)]"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reducedMotion ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 20 }}
          >
            {t("newRecord")}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div
        className="w-full max-w-md"
        variants={listVariants(reducedMotion)}
        initial="hidden"
        animate="show"
      >
        <GlassCard>
          <motion.h2
            variants={itemVariants(reducedMotion)}
            className="mb-6 text-xl font-bold text-[var(--color-text-primary)]"
          >
            {t("title")}
          </motion.h2>
          <motion.div variants={listVariants(reducedMotion)} className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVariants(reducedMotion)}>
              <AnimatedNumber mv={scoreMV} label={t("score")} />
            </motion.div>
            <motion.div variants={itemVariants(reducedMotion)} className="flex flex-col items-center gap-2">
              <AnimatedProgressRing
                value={data.accuracy}
                size={56}
                reducedMotion={reducedMotion}
                ariaLabel={`${t("accuracy")}: ${Math.round(data.accuracy * 100)}%`}
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {t("accuracy")}{" "}
                <span className="ltr-nums">{Math.round(data.accuracy * 100)}%</span>
              </span>
            </motion.div>
            {data.maxSpan != null && (
              <motion.div variants={itemVariants(reducedMotion)}>
                <AnimatedNumber mv={spanMV} label={t("maxSpan")} />
              </motion.div>
            )}
            {data.maxLevel != null && (
              <motion.div variants={itemVariants(reducedMotion)}>
                <AnimatedNumber mv={levelMV} label={t("maxLevel")} />
              </motion.div>
            )}
            <motion.div variants={itemVariants(reducedMotion)}>
              <Stat label={t("duration")} value={durationStr} />
            </motion.div>
            {data.personalBest != null && (
              <motion.div variants={itemVariants(reducedMotion)}>
                <AnimatedNumber mv={pbMV} label={t("personalBest")} />
              </motion.div>
            )}
            {data.prevSessionResult != null && data.maxSpan != null && (
              <motion.div variants={itemVariants(reducedMotion)}>
                <VsDelta
                  delta={data.maxSpan - data.prevSessionResult}
                  label={t("vsLastSession")}
                />
              </motion.div>
            )}
            {data.extras?.map((extra) => (
              <motion.div key={extra.label} variants={itemVariants(reducedMotion)}>
                <Stat label={extra.label} value={String(extra.value)} />
              </motion.div>
            ))}
          </motion.div>
        </GlassCard>
      </motion.div>

      <motion.div
        className="w-full max-w-md"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0.15, delay: 0.1 } : { delay: 0.4, type: "spring", stiffness: 320, damping: 28 }}
      >
        <GlassCard>
          <details>
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-secondary)]">
              {t("about")}
            </summary>
            <div className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
              <p>{about.memorySystem}</p>
              <p>{about.researchBasis}</p>
              <p>{about.evidenceNote}</p>
            </div>
          </details>
        </GlassCard>
      </motion.div>

      <motion.div
        className="flex flex-wrap justify-center gap-4"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0.15, delay: 0.15 } : { delay: 0.55, type: "spring", stiffness: 320, damping: 28 }}
      >
        {dailyNext ? (
          <GlassButton onClick={dailyNext.onPress} size="lg" variant="primary">
            {dailyNext.label}
          </GlassButton>
        ) : (
          <GlassButton onClick={onPlayAgain} size="lg">
            {t("playAgain")}
          </GlassButton>
        )}
        <GlassButton onClick={onHome} size="lg" variant="ghost">
          {t("home")}
        </GlassButton>
      </motion.div>
    </div>
  );
}

function VsDelta({ delta, label }: { delta: number; label: string }) {
  const sign = delta > 0 ? "+" : "";
  const color =
    delta > 0
      ? "var(--color-correct)"
      : delta < 0
        ? "var(--color-incorrect)"
        : "var(--color-text-secondary)";
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="ltr-nums text-2xl font-bold"
        style={{ color }}
        aria-live="polite"
      >
        {sign}
        {String(delta)}
      </span>
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
}
