import { useEffect, type ReactNode } from "react";

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

/**
 * Mobile-first modal:
 * - On phones: docks at the bottom of the screen with a drag handle.
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

  if (!open) return null;

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
        className={`bottom-sheet-panel glass relative w-full ${maxWidth} flex flex-col border border-[rgb(var(--border))] shadow-2xl shadow-black/40 max-h-[92vh] rounded-t-3xl sm:rounded-2xl sm:max-h-[85vh]`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <span className="h-1.5 w-12 rounded-full bg-[rgb(var(--border))]" />
        </div>
        <div className="overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
