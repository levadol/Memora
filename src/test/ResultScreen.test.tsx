import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResultScreen, type ResultData } from "@/components/games/shared/ResultScreen";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/hooks/useReducedMotion", () => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("@/lib/hooks/useStaggerVariants", () => ({
  listVariants: () => ({ hidden: {}, show: {} }),
  itemVariants: () => ({ hidden: {}, show: {} }),
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");

  // MotionValue that stores its initial value so useTransform can read it
  function makeMotionValue(initial: number) {
    let current = initial;
    return {
      get: () => current,
      set: (v: number) => { current = v; },
    };
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const motionEl = (tag: string): React.FC<any> => {
    const MotionStub: React.FC<any> = ({ children, style: _s, ...props }) => {
      void _s;
      return React.createElement(tag, props, children);
    };
    MotionStub.displayName = `Motion(${tag})`;
    return MotionStub;
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    motion: new Proxy({} as Record<string, unknown>, {
      get: (_t, tag: string) => motionEl(tag),
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    animate: () => ({ stop: () => {} }),
    useMotionValue: makeMotionValue,
    // useTransform: call fn with current value of the MotionValue
    useTransform: (mv: ReturnType<typeof makeMotionValue>, fn: (v: number) => string) =>
      fn(mv.get()),
  };
});

const BASE_DATA: ResultData = {
  score: 42,
  accuracy: 0.85,
  maxSpan: 7,
  maxLevel: null,
  durationSecs: 90,
  personalBest: 8,
  isNewRecord: false,
  prevSessionResult: null,
};

const ABOUT = {
  memorySystem: "about.memory",
  researchBasis: "about.research",
  evidenceNote: "about.evidence",
};

function renderResult(data: Partial<ResultData> = {}) {
  return render(
    <ResultScreen
      data={{ ...BASE_DATA, ...data }}
      about={ABOUT}
      onPlayAgain={vi.fn()}
      onHome={vi.fn()}
    />
  );
}

async function setReducedMotion(value: boolean) {
  const { useReducedMotion } = await import("@/lib/hooks/useReducedMotion");
  vi.mocked(useReducedMotion).mockReturnValue(value);
}

describe("ResultScreen — reduced motion ON", () => {
  beforeEach(() => setReducedMotion(true));

  it("shows final score value immediately (no count-up animation)", () => {
    // With reducedMotion=true, scoreMV is initialized to data.score (42)
    // so useTransform immediately returns "42" — no animation needed
    renderResult({ score: 42 });
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("does not render confetti when isNewRecord is true", () => {
    // confetti effect is gated on !reducedMotion, so showConfetti stays false
    const { container } = renderResult({ isNewRecord: true });
    const confettiDots = container.querySelectorAll(".h-2.w-2.rounded-full");
    expect(confettiDots.length).toBe(0);
  });
});

describe("ResultScreen — reduced motion OFF", () => {
  beforeEach(() => setReducedMotion(false));

  it("renders title and action buttons", () => {
    renderResult();
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("playAgain")).toBeInTheDocument();
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("shows 0 for animated stats initially when reducedMotion is off (count-up starts from 0)", () => {
    // With reducedMotion=false, all MVs initialized to 0
    renderResult({ score: 42, personalBest: 8 });
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
  });

  it("renders confetti particles on new record", async () => {
    // showConfetti fires via useEffect when isNewRecord=true + !reducedMotion
    const { container } = renderResult({ isNewRecord: true });
    await waitFor(() => {
      const dots = container.querySelectorAll(".h-2.w-2.rounded-full");
      expect(dots.length).toBeGreaterThan(0);
    });
  });

  it("shows newRecord label when isNewRecord is true", () => {
    renderResult({ isNewRecord: true });
    expect(screen.getByText("newRecord")).toBeInTheDocument();
  });

  it("does not show newRecord label when isNewRecord is false", () => {
    renderResult({ isNewRecord: false });
    expect(screen.queryByText("newRecord")).toBeNull();
  });

  it("renders maxSpan stat when provided", () => {
    renderResult({ maxSpan: 6 });
    expect(screen.getByText("maxSpan")).toBeInTheDocument();
  });

  it("does not render maxSpan when null", () => {
    renderResult({ maxSpan: null });
    expect(screen.queryByText("maxSpan")).toBeNull();
  });

  it("renders duration as MM:SS", () => {
    renderResult({ durationSecs: 90 });
    expect(screen.getByText("1:30")).toBeInTheDocument();
  });

  it("renders dailyNext button instead of playAgain when provided", () => {
    const onPress = vi.fn();
    render(
      <ResultScreen
        data={BASE_DATA}
        about={ABOUT}
        onPlayAgain={vi.fn()}
        onHome={vi.fn()}
        dailyNext={{ label: "Next game", onPress }}
      />
    );
    expect(screen.getByText("Next game")).toBeInTheDocument();
    expect(screen.queryByText("playAgain")).toBeNull();
  });
});
