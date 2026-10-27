"use client";

interface BlitzTimerRingProps {
  timeRemaining: number;
  total: number;
  isUrgent: boolean;
  reducedMotion: boolean;
  size?: number;
}

export function BlitzTimerRing({ timeRemaining, total, isUrgent, size = 96 }: BlitzTimerRingProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = total > 0 ? timeRemaining / total : 0;
  const dashoffset = circumference * (1 - fraction);

  const color = isUrgent ? "var(--color-incorrect)" : "var(--color-accent)";
  const fontSize = size <= 96 ? "1.25rem" : "2.5rem";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-glass-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.3s ease" }}
        />
      </svg>
      <span
        className="ltr-nums relative z-10 font-bold"
        style={{ color, fontSize }}
        aria-live="polite"
        aria-label={`${timeRemaining} seconds remaining`}
      >
        {timeRemaining}
      </span>
    </div>
  );
}
