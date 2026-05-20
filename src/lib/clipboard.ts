/**
 * Helpers for reading the clipboard safely.
 *
 * The Clipboard API is gated behind several conditions that can change at
 * runtime (HTTPS context, permissions prompt, focus state, browser support),
 * so every helper here must fail soft and never throw to its caller.
 */

/** True if `navigator.clipboard.readText` is available and the page has focus. */
export function canReadClipboard(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!navigator.clipboard || typeof navigator.clipboard.readText !== "function")
    return false;
  if (typeof document !== "undefined" && document.hasFocus && !document.hasFocus())
    return false;
  return true;
}

/**
 * Try to read text from the clipboard. Returns `null` instead of throwing
 * when permission is denied or the API is unavailable.
 */
export async function readClipboardText(): Promise<string | null> {
  if (!canReadClipboard()) return null;
  try {
    const text = await navigator.clipboard.readText();
    return text?.trim() || null;
  } catch {
    return null;
  }
}

/** Quick test for "looks like an http(s) URL". */
export function isLikelyUrl(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 10 || trimmed.length > 2048) return false;
  // Allow "www.x.y/..." too — many users paste those.
  return /^(https?:\/\/|www\.)\S+\.\S+/i.test(trimmed);
}
