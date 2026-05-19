import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Search, CornerDownLeft } from "lucide-react";

export type CommandItem = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  shortcut?: string;
  /** Optional className applied to icon container (e.g. gradient bg). */
  iconClass?: string;
  /** Optional class on the icon itself. */
  iconColor?: string;
  action: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
  placeholder?: string;
};

/**
 * Spotlight-style command palette.
 * - Opens with ⌘K / Ctrl+K (handled by parent).
 * - Filters across labels, groups, and hints.
 * - Arrow keys to navigate, Enter to run, Esc to close.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
  placeholder = "Cari aksi atau platform…",
}: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Reset state every time the palette opens.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.group} ${c.hint ?? ""}`.toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Group items, preserving order.
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const c of filtered) {
      if (!map.has(c.group)) map.set(c.group, []);
      map.get(c.group)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Keep `active` in range when filter changes.
  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered.length, active]);

  // Scroll active item into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${active}"]`,
    );
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(
        (i) => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1),
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[active];
      if (cmd) {
        onClose();
        // Defer so the close animation doesn't fight with the next sheet.
        setTimeout(() => cmd.action(), 0);
      }
    }
  };

  let runningIndex = -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="modal-backdrop fixed inset-0 z-[55] flex items-start justify-center bg-black/60 px-3 pt-[12vh] backdrop-blur-sm sm:pt-[18vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content glass w-full max-w-xl overflow-hidden rounded-2xl border border-[rgb(var(--border))] shadow-2xl shadow-black/50">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-[rgb(var(--border))] px-4 py-3">
          <Search className="h-4 w-4 flex-shrink-0 text-[rgb(var(--muted))]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
          />
          <kbd className="hidden flex-shrink-0 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/60 px-1.5 py-0.5 font-mono text-[10px] text-[rgb(var(--muted))] sm:inline">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="scrollbar-thin max-h-[60vh] overflow-y-auto py-1.5"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[rgb(var(--muted))]">
              Tidak ada hasil untuk{" "}
              <span className="font-mono text-[rgb(var(--text-2))]">
                "{query}"
              </span>
            </div>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-1.5">
                <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  {group}
                </div>
                <div>
                  {items.map((cmd) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const isActive = idx === active;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        data-cmd-index={idx}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => {
                          onClose();
                          setTimeout(() => cmd.action(), 0);
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                          isActive
                            ? "bg-indigo-500/15 text-[rgb(var(--text))]"
                            : "text-[rgb(var(--text-2))] hover:bg-[rgb(var(--bg-2))]/40"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                            cmd.iconClass ?? "bg-[rgb(var(--bg-2))]/60"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${cmd.iconColor ?? "text-[rgb(var(--text-2))]"}`}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[rgb(var(--text))]">
                            {cmd.label}
                          </span>
                          {cmd.hint && (
                            <span className="block truncate text-[11px] text-[rgb(var(--muted))]">
                              {cmd.hint}
                            </span>
                          )}
                        </span>
                        {cmd.shortcut && (
                          <kbd className="hidden flex-shrink-0 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/60 px-1.5 py-0.5 font-mono text-[10px] text-[rgb(var(--muted))] sm:inline">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        {isActive && (
                          <CornerDownLeft className="h-3.5 w-3.5 flex-shrink-0 text-[rgb(var(--muted))]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-4 py-2 text-[10px] text-[rgb(var(--muted))]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/60 px-1.5 py-0.5 font-mono">
                ↑↓
              </kbd>
              navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/60 px-1.5 py-0.5 font-mono">
                ↵
              </kbd>
              pilih
            </span>
          </div>
          <span>{filtered.length} hasil</span>
        </div>
      </div>
    </div>
  );
}
