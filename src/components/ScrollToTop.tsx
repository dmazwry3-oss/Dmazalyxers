import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { haptic } from "../lib/haptics";

type Props = {
  /** Pixels of scroll before the button appears. */
  threshold?: number;
};

/**
 * Floating action button that appears once the user has scrolled past
 * `threshold` and snaps the page back to the top. Includes a thin
 * conic-gradient ring that visualises page progress so it doubles as a
 * scroll indicator.
 *
 * Positioned with safe-area awareness so it never overlaps the iOS home
 * indicator or the mobile tab bar.
 */
export function ScrollToTop({ threshold = 600 }: Props) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const max =
        Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        ) - window.innerHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      setProgress(pct);
      setVisible(y > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [threshold]);

  const handleClick = () => {
    haptic("tap");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Conic-gradient ring: filled portion = scroll progress.
  const ringStyle: React.CSSProperties = {
    background: `conic-gradient(rgb(99 102 241) ${progress * 360}deg, rgba(255,255,255,0.08) 0deg)`,
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Kembali ke atas"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed right-4 z-30 transition-all duration-300 sm:right-6 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
      style={{
        // Above the mobile tab bar on phones, comfortable margin on desktop.
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)",
      }}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full p-[2px] shadow-2xl shadow-black/40"
        style={ringStyle}
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-[rgb(var(--bg))] backdrop-blur-md">
          <ArrowUp className="h-4 w-4 text-indigo-300" strokeWidth={2.6} />
        </span>
      </span>
    </button>
  );
}
