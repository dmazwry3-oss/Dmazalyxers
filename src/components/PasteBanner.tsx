import type { LucideIcon } from "lucide-react";
import { ArrowRight, Clipboard, X } from "lucide-react";

type Props = {
  /** The URL detected in the clipboard. Banner is hidden when null. */
  url: string | null;
  /** Optional platform label (e.g. "Instagram") to add context. */
  platformLabel?: string;
  /** Optional gradient class — usually the matched platform's gradient. */
  platformGradient?: string;
  /** Optional icon to render in the leading badge. */
  platformIcon?: LucideIcon;
  onAccept: () => void;
  onDismiss: () => void;
};

/**
 * Lightweight banner that surfaces a URL detected in the user's clipboard
 * when they return to the tab.
 *
 * Sized to fit comfortably above the form on mobile without dominating the
 * screen, and visually anchored to the matched platform's gradient when
 * we know it (so the user immediately sees "yes, this is going to TikTok").
 */
export function PasteBanner({
  url,
  platformLabel,
  platformGradient,
  platformIcon: PIcon,
  onAccept,
  onDismiss,
}: Props) {
  if (!url) return null;

  const Icon = PIcon ?? Clipboard;
  const gradient = platformGradient ?? "from-indigo-500 via-purple-500 to-fuchsia-500";

  return (
    <div
      role="region"
      aria-label="Link terdeteksi di clipboard"
      className="paste-banner-in animate-fade-up relative overflow-hidden rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/8 to-transparent p-3 shadow-lg shadow-indigo-950/30"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md shadow-black/30`}
          aria-hidden
        >
          <Icon className="h-4 w-4 text-white" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-300" />
            </span>
            Link terdeteksi
            {platformLabel && (
              <span className="font-mono normal-case tracking-normal text-indigo-200/80">
                · {platformLabel}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-[rgb(var(--text-2))]">
            {url}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onAccept}
            className="touch-target flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-[11px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-95"
            aria-label="Gunakan link dari clipboard"
          >
            Pakai
            <ArrowRight className="h-3 w-3" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="touch-target flex h-8 w-8 items-center justify-center rounded-xl text-[rgb(var(--muted))] transition-colors hover:bg-[rgb(var(--bg-2))]/60 hover:text-[rgb(var(--text))]"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
