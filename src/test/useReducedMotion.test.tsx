import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

vi.mock("@/lib/store", () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from "@/lib/store";

type FakeMediaQueryList = {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchChange: (newMatches: boolean) => void;
};

function mockMatchMedia(initialMatches: boolean): FakeMediaQueryList {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  const mql: FakeMediaQueryList = {
    matches: initialMatches,
    addEventListener: vi.fn((_type: string, fn: (e: MediaQueryListEvent) => void) => {
      listeners.push(fn);
    }),
    removeEventListener: vi.fn(),
    dispatchChange(newMatches: boolean) {
      listeners.forEach((fn) => fn({ matches: newMatches } as MediaQueryListEvent));
    },
  };
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockReturnValue(mql),
  });
  return mql;
}

function setupStore(reducedMotion: boolean) {
  vi.mocked(useAppStore).mockImplementation(
    (sel: (s: { settings: { reducedMotion: boolean } }) => boolean) =>
      sel({ settings: { reducedMotion } })
  );
}

describe("useReducedMotion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when app setting is on and system preference is off", () => {
    mockMatchMedia(false);
    setupStore(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("returns true when system prefers reduced motion and app setting is off", () => {
    mockMatchMedia(true);
    setupStore(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("returns false when both app setting and system preference are off", () => {
    mockMatchMedia(false);
    setupStore(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("updates when the system media query fires a change event", () => {
    const mql = mockMatchMedia(false);
    setupStore(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => {
      mql.dispatchChange(true);
    });
    expect(result.current).toBe(true);
  });
});
