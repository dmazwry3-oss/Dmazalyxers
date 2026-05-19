import { useEffect, useState } from "react";
import { Check, Clipboard, Download, ExternalLink, X } from "lucide-react";

type Props = {
  open: boolean;
  url: string | null;
  title?: string;
  onClose: () => void;
};

/**
 * Lightweight QR popup. Renders the target URL as a QR via a public
 * encoder so a phone can scan it and continue the download elsewhere.
 *
 * The image is purely a representation of the URL — no data is sent
 * to qrserver.com beyond the URL string itself, which is also the
 * exact thing the user is about to download.
 */
export function QRPopup({ open, url, title, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !url) return null;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&qzone=2&data=${encodeURIComponent(url)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="QR Code"
      className="modal-backdrop fixed inset-0 z-[58] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content glass relative w-full max-w-sm overflow-hidden rounded-3xl border border-[rgb(var(--border))] shadow-2xl shadow-black/50">
        <button
          type="button"
          onClick={onClose}
          className="touch-target absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-amber-500/10 px-6 pb-3 pt-5 text-center">
          <h3 className="text-base font-bold text-[rgb(var(--text))]">
            Scan untuk download
          </h3>
          {title && (
            <p className="mt-0.5 line-clamp-1 text-xs text-[rgb(var(--text-2))]">
              {title}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center bg-white p-5">
          <img
            src={qrSrc}
            alt="QR code untuk URL download"
            width={260}
            height={260}
            className="h-[260px] w-[260px]"
            loading="lazy"
          />
        </div>

        <div className="space-y-2 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-3 py-2 font-mono text-[10px] text-[rgb(var(--muted))]">
            <span className="truncate">{url}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <CopyButton onCopy={handleCopy} />
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="touch-target flex items-center justify-center gap-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-3 py-2.5 text-xs font-medium text-[rgb(var(--text-2))] transition-colors hover:border-indigo-400/40 hover:text-[rgb(var(--text))]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Buka
            </a>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              download
              className="touch-target flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-black/30 transition-all hover:brightness-110"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </div>
          <p className="pt-1 text-center text-[10px] text-[rgb(var(--muted))]">
            QR di-render lewat api.qrserver.com — link aslinya sama persis.
          </p>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ onCopy }: { onCopy: () => void | Promise<void> }) {
  const [copied, setCopied] = useCopiedState();
  return (
    <button
      type="button"
      onClick={async () => {
        await onCopy();
        setCopied();
      }}
      className="touch-target flex items-center justify-center gap-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-3 py-2.5 text-xs font-medium text-[rgb(var(--text-2))] transition-colors hover:border-indigo-400/40 hover:text-[rgb(var(--text))]"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Clipboard className="h-3.5 w-3.5" />
      )}
      {copied ? "Disalin" : "Salin"}
    </button>
  );
}

function useCopiedState(): [boolean, () => void] {
  const [copied, setCopied] = useState(false);
  const trigger = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return [copied, trigger];
}
