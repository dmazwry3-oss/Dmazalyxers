/**
 * Lightweight haptic feedback wrapper around the Vibration API.
 *
 * Most desktop browsers ignore navigator.vibrate, and iOS Safari has never
 * implemented it — both cases are handled by an `in` guard so the calls
 * become no-ops there. We only fire short, purposeful patterns so the UI
 * never feels "spammy" on Android phones where it actually buzzes.
 *
 * Patterns are conservative on purpose. Long buzzes feel cheap on phones.
 */

type Pattern = "tap" | "soft" | "success" | "warning" | "error";

const PATTERNS: Record<Pattern, number | number[]> = {
  // Single sharp tap — for primary button presses, toggles, picker selection.
  tap: 10,
  // Even softer — for hover-like confirmations, e.g. paste success.
  soft: 6,
  // Success: short double-tap.
  success: [12, 40, 18],
  // Warning: medium pause double-tap.
  warning: [20, 60, 20],
  // Error: triple tap, more pronounced.
  error: [30, 50, 30, 50, 30],
};

function canVibrate(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    typeof navigator.vibrate === "function"
  );
}

function respectsMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function haptic(pattern: Pattern = "tap"): void {
  if (!canVibrate() || !respectsMotion()) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Some Android browsers throw when called outside a user gesture — ignore.
  }
}

/** Stop any ongoing vibration. Cheap and safe on every platform. */
export function silenceHaptics(): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(0);
  } catch {
    /* ignore */
  }
}
