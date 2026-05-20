import { useEffect, useRef, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { haptic } from "../lib/haptics";

/**
 * BeforeInstallPromptEvent isn't in lib.dom yet — type just enough to be safe.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "dmaz_install_prompt_dismissed_at";
/** How long to suppress the prompt after the user dismisses it (3 days). */
const SUPPRESS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * PWA install banner.
 *
 * Listens for the `beforeinstallprompt` event (Chrome/Edge/Android) and shows
 * a small bottom-anchored card on mobile only. Dismissals are sticky for a
 * few days so the prompt isn't annoying.
 *
 * If the browser doesn't fire the event (Safari/Firefox), the component
 * stays silent and renders nothing.
 */
export function InstallPrompt() {
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already installed? Most browsers expose this via display-mode media query.
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        // iOS Safari quirk: navigator.standalone is non-standard but reliable.
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (standalone) return;
    }

    // Honour recent dismissals.
    try {
      const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
      if (dismissedAt && Date.now() - dismissedAt < SUPPRESS_MS) return;
    } catch {
      /* ignore */
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };
    const onInstalled = () => {
      promptRef.current = null;
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    haptic("tap");
    const evt = promptRef.current;
    if (!evt) {
      setVisible(false);
      return;
    }
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice.outcome === "dismissed") {
        try {
          localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
      } else {
        haptic("success");
      }
    } catch {
      /* ignore */
    } finally {
      promptRef.current = null;
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    haptic("soft");
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Install aplikasi"
      className="install-prompt-in fixed inset-x-3 z-30 sm:left-auto sm:right-4 sm:max-w-sm"
      // Sit just above the mobile tab bar; on desktop pin to the bottom-right.
      style={{
        bottom:
          "calc(env(safe-area-inset-bottom, 0px) + 80px)",
      }}
    >
      <div className="glass relative overflow-hidden rounded-2xl border border-indigo-400/30 p-3 shadow-2xl shadow-black/40">
        {/* Decorative gradient halo */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/20 to-transparent blur-2xl"
          aria-hidden
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30">
            <Smartphone className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[rgb(var(--text))]">
              Pasang ke Home Screen
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[rgb(var(--text-2))]">
              Akses lebih cepat, full-screen, dan jalan offline saat tersedia.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleInstall}
                className="touch-target flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-[11px] font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-95"
              >
                <Download className="h-3 w-3" strokeWidth={3} />
                Pasang
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="touch-target rounded-xl px-2.5 py-2 text-[11px] font-medium text-[rgb(var(--muted))] transition-colors hover:bg-[rgb(var(--bg-2))]/60 hover:text-[rgb(var(--text))]"
              >
                Nanti saja
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="touch-target flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[rgb(var(--muted))] transition-colors hover:bg-[rgb(var(--bg-2))]/60 hover:text-[rgb(var(--text))]"
            aria-label="Tutup"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
