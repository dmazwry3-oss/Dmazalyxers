import {
  HelpCircle,
  Keyboard,
  Sparkles,
  ShieldCheck,
  Github,
  X,
  Command as CommandIcon,
  Search,
  Send,
  Clipboard,
  Plug,
} from "lucide-react";
import { BottomSheet } from "./BottomSheet";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenCommandPalette: () => void;
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Kenapa download YouTube lambat?",
    a: "API publik biasanya butuh 20–40 detik untuk merender ulang stream YouTube. Sabar — jangan refresh atau tab tetap aktif.",
  },
  {
    q: "Spotify cuma 30 detik?",
    a: "Iya. Track full Spotify dilindungi DRM, yang bisa diambil resmi cuma preview audio 30 detik dari Spotify.",
  },
  {
    q: "Aman pakai ini?",
    a: "Semua proses jalan di browser kamu. API key disimpan di localStorage, bukan di server kami. Hanya gunakan untuk konten publik & punya hak.",
  },
  {
    q: "Riwayat hilang setelah logout?",
    a: "Riwayat per-akun. Login lagi pakai akun yang sama → riwayat balik. Logged-out bucket terpisah (anon).",
  },
  {
    q: "Bisa download banyak link sekaligus?",
    a: "Bisa pakai tombol 'Download Semua' di kartu hasil — semua varian akan dibuka berurutan di tab baru.",
  },
];

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["Ctrl", "K"], label: "Buka command palette" },
  { keys: ["Ctrl", "↵"], label: "Submit form download" },
  { keys: ["Ctrl", "V"], label: "Tempel link dari clipboard" },
  { keys: ["?"], label: "Buka panduan ini" },
  { keys: ["Esc"], label: "Tutup dialog / sheet" },
];

export function HelpSheet({ open, onClose, onOpenCommandPalette }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Bantuan" maxWidth="sm:max-w-xl">
      <div className="flex items-start justify-between gap-3 border-b border-[rgb(var(--border))] px-5 pt-2 pb-4 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-md shadow-indigo-500/30">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[rgb(var(--text))]">
              Pusat Bantuan
            </h3>
            <p className="mt-0.5 text-[12px] text-[rgb(var(--muted))]">
              FAQ, shortcut, & cara pakai
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="touch-target flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg-2))]/60 hover:text-[rgb(var(--text))]"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {/* Quick action */}
        <button
          type="button"
          onClick={() => {
            onClose();
            setTimeout(() => onOpenCommandPalette(), 0);
          }}
          className="touch-target flex w-full items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-3 text-left transition-all hover:border-indigo-400/40 active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/15">
            <CommandIcon className="h-5 w-5 text-indigo-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[rgb(var(--text))]">
              Command Palette
            </div>
            <div className="text-xs text-[rgb(var(--text-2))]">
              Cari aksi & ganti platform cepat
            </div>
          </div>
          <kbd className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/60 px-1.5 py-0.5 font-mono text-[10px] text-[rgb(var(--muted))]">
            ⌘ K
          </kbd>
        </button>

        {/* Shortcuts */}
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--text))]">
            <Keyboard className="h-4 w-4 text-indigo-400" />
            Keyboard Shortcuts
          </h4>
          <div className="space-y-1.5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 p-2">
            {SHORTCUTS.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm"
              >
                <span className="text-[rgb(var(--text-2))]">{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k, i) => (
                    <kbd
                      key={`${s.label}-${i}`}
                      className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-[rgb(var(--text))]"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* How-to */}
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--text))]">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Cara Pakai
          </h4>
          <ol className="space-y-2.5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 p-4 text-xs leading-relaxed text-[rgb(var(--text-2))]">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                1
              </span>
              <span>
                Pilih platform di chip atas — atau biarkan auto-detect saat kamu paste link.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                2
              </span>
              <span>
                Tempel link dari clipboard pakai tombol <Clipboard className="inline h-3 w-3" />{" "}
                <b>Paste</b> atau <kbd className="rounded bg-[rgb(var(--bg))]/60 px-1 font-mono text-[10px]">Ctrl+V</kbd>.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                3
              </span>
              <span>
                Tekan <Send className="inline h-3 w-3" /> <b>Ambil</b> atau{" "}
                <kbd className="rounded bg-[rgb(var(--bg))]/60 px-1 font-mono text-[10px]">Ctrl+Enter</kbd>.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                4
              </span>
              <span>
                Pilih varian (HD/SD/MP3), lalu Download — atau scan QR untuk lanjut di HP.
              </span>
            </li>
          </ol>
        </section>

        {/* FAQ */}
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--text))]">
            <Search className="h-4 w-4 text-fuchsia-400" />
            Pertanyaan Umum
          </h4>
          <div className="space-y-2">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 p-3 open:border-indigo-400/30 open:bg-[rgb(var(--bg-2))]/60"
              >
                <summary className="cursor-pointer list-none text-sm font-medium text-[rgb(var(--text))] outline-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    {f.q}
                    <span className="ml-2 text-[rgb(var(--muted))] transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--text-2))]">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Privacy + repo */}
        <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Privasi
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[rgb(var(--text-2))]">
              Tidak ada data yang dikirim ke server kami. Riwayat & API key disimpan lokal di
              browser ini.
            </p>
          </div>
          <a
            href="https://github.com/dmazwry3-oss/Dmazalyxers"
            target="_blank"
            rel="noreferrer"
            className="touch-target group flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 p-3 transition-all hover:border-indigo-400/40 hover:bg-indigo-500/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--bg))]/60">
              <Github className="h-4 w-4 text-[rgb(var(--text))]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[rgb(var(--text))]">
                Source code
              </div>
              <div className="truncate text-[11px] text-[rgb(var(--text-2))]">
                github.com/dmazwry3-oss/Dmazalyxers
              </div>
            </div>
            <Plug className="h-4 w-4 text-[rgb(var(--muted))] transition-colors group-hover:text-indigo-300" />
          </a>
        </section>
      </div>
    </BottomSheet>
  );
}
