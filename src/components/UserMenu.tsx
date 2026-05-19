import { useEffect, useRef, useState } from "react";
import { Calendar, LogIn, LogOut, Mail, User as UserIcon } from "lucide-react";
import { getUserInitials, type Session } from "../lib/auth";

type Props = {
  session: Session | null;
  onLoginClick: () => void;
  onLogout: () => void;
};

export function UserMenu({ session, onLoginClick, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Logged out: show simple "Masuk" pill button
  if (!session) {
    return (
      <button
        type="button"
        onClick={onLoginClick}
        className="touch-target flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-95 sm:text-sm"
      >
        <LogIn className="h-3.5 w-3.5" />
        Masuk
      </button>
    );
  }

  const initials = getUserInitials(session.username);
  const joined = new Date(session.loggedInAt);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Akun ${session.username}`}
        className="touch-target group relative flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-95"
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${session.avatarColor} text-[11px] font-bold text-white shadow-md shadow-black/30 ring-2 ring-[rgb(var(--bg))] transition-transform group-hover:scale-105`}
        >
          {initials}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="user-menu-pop absolute right-0 top-11 z-40 w-64 origin-top-right overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] p-4">
            <span
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${session.avatarColor} text-sm font-bold text-white shadow-md shadow-black/30`}
            >
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--text))]">
                <UserIcon className="h-3 w-3 text-[rgb(var(--muted))]" />
                <span className="truncate">{session.username}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-[rgb(var(--muted))]">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{session.email}</span>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 text-[11px] text-[rgb(var(--muted))]">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>
                Sesi dimulai {joined.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 border-t border-[rgb(var(--border))] px-4 py-3 text-left text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
