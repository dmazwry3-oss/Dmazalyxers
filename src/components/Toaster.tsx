import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { dismissToast, useToasts, type ToastItem } from "../lib/toast";

const KIND_STYLES: Record<
  ToastItem["kind"],
  { ring: string; iconBg: string; iconColor: string; icon: typeof CheckCircle2 }
> = {
  success: {
    ring: "border-emerald-500/40",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-300",
    icon: CheckCircle2,
  },
  error: {
    ring: "border-red-500/40",
    iconBg: "bg-red-500/15",
    iconColor: "text-red-300",
    icon: AlertCircle,
  },
  info: {
    ring: "border-indigo-500/40",
    iconBg: "bg-indigo-500/15",
    iconColor: "text-indigo-300",
    icon: Info,
  },
  warning: {
    ring: "border-amber-500/40",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-300",
    icon: AlertTriangle,
  },
};

export function Toaster() {
  const items = useToasts();

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-3 pt-3 sm:right-4 sm:top-4 sm:items-end sm:px-0 sm:pt-0"
      style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0.75rem)" }}
      role="region"
      aria-label="Notifikasi"
      aria-live="polite"
    >
      {items.map((t) => {
        const style = KIND_STYLES[t.kind];
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border ${style.ring} bg-[rgb(var(--bg))]/90 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl`}
            role={t.kind === "error" ? "alert" : "status"}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
              aria-hidden
            >
              <Icon className={`h-4 w-4 ${style.iconColor}`} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="text-sm font-semibold leading-tight text-[rgb(var(--text))]">
                {t.title}
              </div>
              {t.message && (
                <div className="mt-0.5 break-words text-xs leading-relaxed text-[rgb(var(--text-2))]">
                  {t.message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[rgb(var(--muted))] transition-colors hover:bg-[rgb(var(--bg-2))]/60 hover:text-[rgb(var(--text))]"
              aria-label="Tutup notifikasi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
