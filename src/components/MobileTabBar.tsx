import type { LucideIcon } from "lucide-react";
import { Clipboard, Command, History as HistoryIcon, Home } from "lucide-react";
import { haptic } from "../lib/haptics";

type TabAction =
  | { id: "home"; label: string }
  | { id: "paste"; label: string }
  | { id: "history"; label: string; badge?: number }
  | { id: "menu"; label: string };

type Props = {
  /** Active section, used to highlight the corresponding tab. */
  active?: "home" | "history" | null;
  /** Number badge shown on the History tab. */
  historyCount?: number;
  /** Whether anything sits in history yet — disables the History tab if not. */
  hasHistory?: boolean;
  onHome: () => void;
  onPaste: () => void;
  onHistory: () => void;
  onMenu: () => void;
};

/**
 * Persistent bottom navigation bar, mobile-only.
 *
 * Acts as a thumb-zone shortcut to the four most-used actions. On screens
 * 640px and up it stays hidden — the desktop nav already exposes everything.
 *
 * Order is left-to-right by frequency: Home (top of form), Paste (clipboard
 * shortcut), History (jump to recent downloads), Menu (command palette).
 */
export function MobileTabBar({
  active,
  historyCount = 0,
  hasHistory = false,
  onHome,
  onPaste,
  onHistory,
  onMenu,
}: Props) {
  const tabs: Array<{
    id: TabAction["id"];
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    activeWhen?: typeof active;
    disabled?: boolean;
    badge?: number;
  }> = [
    { id: "home", label: "Home", icon: Home, onClick: onHome, activeWhen: "home" },
    { id: "paste", label: "Paste", icon: Clipboard, onClick: onPaste },
    {
      id: "history",
      label: "Riwayat",
      icon: HistoryIcon,
      onClick: onHistory,
      activeWhen: "history",
      disabled: !hasHistory,
      badge: historyCount,
    },
    { id: "menu", label: "Menu", icon: Command, onClick: onMenu },
  ];

  return (
    <nav
      aria-label="Menu cepat"
      className="mobile-tab-bar fixed inset-x-0 bottom-0 z-40 sm:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 6px)" }}
    >
      {/* Top blur fade so floating content can peek through */}
      <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-b from-transparent to-[rgb(var(--bg))]/80" />
      <div className="mx-3 flex items-end justify-between gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/80 px-1.5 py-1.5 shadow-xl shadow-black/40 backdrop-blur-xl">
        {tabs.map((t) => {
          const isActive = !!t.activeWhen && active === t.activeWhen;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              disabled={t.disabled}
              onClick={() => {
                haptic("tap");
                t.onClick();
              }}
              aria-label={t.label}
              aria-pressed={isActive}
              className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-all active:scale-95 ${
                t.disabled
                  ? "opacity-40"
                  : isActive
                    ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/15 text-indigo-200"
                    : "text-[rgb(var(--text-2))] hover:text-[rgb(var(--text))]"
              }`}
            >
              <span className="relative">
                <Icon
                  className={`h-[18px] w-[18px] ${isActive ? "text-indigo-300" : ""}`}
                  strokeWidth={isActive ? 2.6 : 2.2}
                />
                {t.badge && t.badge > 0 ? (
                  <span className="absolute -right-2 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-1 font-mono text-[9px] font-bold text-white shadow-md shadow-black/40">
                    {t.badge > 99 ? "99+" : t.badge}
                  </span>
                ) : null}
              </span>
              <span className={`leading-tight ${isActive ? "font-semibold" : ""}`}>
                {t.label}
              </span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -top-px left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
