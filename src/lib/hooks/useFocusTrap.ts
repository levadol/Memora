"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  "details > summary",
].join(", ");

/**
 * Traps focus inside a container when active.
 * Returns a ref to attach to the container element.
 * Also handles:
 * - Auto-focus first focusable element on open
 * - Tab/Shift+Tab cycles within the container
 * - Escape key calls onEscape
 * - Focus returns to the previously focused element on close
 */
export function useFocusTrap(
  active: boolean,
  onEscape?: () => void
): React.RefObject<HTMLElement | null> {
  const containerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save prior focus and restore on deactivation
  useEffect(() => {
    if (active) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    } else {
      const el = previousFocusRef.current;
      if (el && typeof el.focus === "function") {
        // Use a microtask so the DOM has settled after AnimatePresence exit
        Promise.resolve().then(() => el.focus());
      }
    }
  }, [active]);

  // Auto-focus first focusable element when activated
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    const id = setTimeout(() => {
      const first = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[0];
      if (first) first.focus();
    }, 50);
    return () => clearTimeout(id);
  }, [active]);

  // Tab trap + Escape handler
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(e: KeyboardEvent) {
      const container = containerRef.current;
      if (!container) return;

      if (e.key === "Escape") {
        onEscape?.();
        return;
      }

      if (e.key === "Tab") {
        const focusable = [
          ...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ];
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first || !container.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !container.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, onEscape]);

  return containerRef;
}
