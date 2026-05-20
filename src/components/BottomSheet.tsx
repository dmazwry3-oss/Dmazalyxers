import { useEffect, useRef, useState, type ReactNode } from "react";
import { haptic } from "../lib/haptics";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Maximum width on desktop. Tailwind class. */
  maxWidth?: string;
  /** When true, prevents closing via backdrop tap. */
  dismissable?: boolean;
  /** Optional aria-label for the dialog. */
  ariaLabel?: string;
};

/** Pixels the user has to drag down before we treat it as a dismiss intent. */
const DISMISS_THRESHOLD = 110;
/** Velocity (px/ms) above which a quicker drag also counts as dismiss. */
const FLING_VELOCITY = 0.55;

/**
 * Mobile-first modal:
 * - On phones: docks at the bottom of the screen with a drag handle and
 *   supports swipe-to-dismiss via the handle (and any non-scrollable area).
 * - On tablets and up: behaves as a centered modal.
 *
 * Closes on backdrop tap and Escape. Body scroll is locked while open.
 */
export function BottomSheet({
  open,
  onClose,
  children,
  maxWidth = "sm:max-w-lg",
  dismissable = true,
  ariaLabel,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ y: number; t: number } | null>(null);
  const lastDeltaRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, dismissable]);

  // Reset drag state every time the sheet (re)opens.
  useEffect(() => {
    if (open) {
      setDragOffset(0);
      setDragging(false);
      dragStartRef.current = null;
      lastDeltaRef.current = 0;
    }
  }, [open]);

  // Only allow swipe-to-dismiss on the mobile (bottom-docked) layout.
  const isMobileLayout = (): boolean =>
    typeof window !== "undefined" && window.innerWidth < 640;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dismissable || !isMobileLayout()) return;
    const t = e.touches[0];
    dragStartRef.current = { y: t.clientY, t: performance.now() };
    setDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    // Only react to downward drags. Tiny upward over-pull is dampened to 0.
    const next = dy > 0 ? dy : Math.max(dy / 6, -10);
    lastDeltaRef.current = next;
    setDragOffset(next);
  };

  const handleTouchEnd = () => {
    if (!dragStartRef.current) return;
    const elapsed = Math.max(1, performance.now() - dragStartRef.current.t);
    const velocity = lastDeltaRef.current / elapsed; // px / ms
    const shouldDismiss =
      lastDeltaRef.current > DISMISS_THRESHOLD || velocity > FLING_VELOCITY;
    dragStartRef.current = null;
    setDragging(false);
    if (shouldDismiss) {
      haptic("soft");
      onClose();
    } else {
      setDragOffset(0);
    }
  };

  if (!open) return null;

  const transform =
    dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined;
  // While dragging we drop the transition for 1:1 finger tracking; we add it
  // back on release so the sheet snaps back smoothly when not dismissed.
  const transition = dragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="bottom-sheet-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (dismissable && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`bottom-sheet-panel glass relative w-full ${maxWidth} flex flex-col border border-[rgb(var(--border))] shadow-2xl shadow-black/40 max-h-[92vh] rounded-t-3xl sm:rounded-2xl sm:max-h-[85vh]`}
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          transform,
          transition,
          touchAction: "pan-y",
        }}
      >
        {/* Drag handle area — also captures the swipe-to-dismiss gesture. */}
        <div
          className="flex justify-center pt-3 pb-1 sm:hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          aria-hidden
        >
          <span className="h-1.5 w-12 rounded-full bg-[rgb(var(--border))]" />
        </div>
        <div className="overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
