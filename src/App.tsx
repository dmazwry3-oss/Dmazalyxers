import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Facebook,
  Loader2,
  Link2,
  Key,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  Clipboard,
  Check,
  AlertCircle,
  Trash2,
  History,
  ExternalLink,
  Github,
  Shield,
  Zap,
  Globe,
} from "lucide-react";
import "./App.css";

const DEFAULT_API_KEY = "KAPI-6789ADACCC1091EFDAB55414";
const API_ENDPOINT = "https://api.komputerz.site/api/v1/download/facebook";
const STORAGE_KEY = "dmaz_api_key";
const THEME_KEY = "dmaz_theme";
const HISTORY_KEY = "dmaz_history";

type DownloadVariant = {
  label: string;
  url: string;
  quality?: string;
  isAudio?: boolean;
};

type ParsedResult = {
  title?: string;
  thumbnail?: string;
  duration?: string;
  author?: string;
  variants: DownloadVariant[];
  raw: Record<string, unknown>;
};

type HistoryItem = {
  url: string;
  title: string;
  thumbnail?: string;
  at: number;
};

type ApiResponse = {
  status?: boolean;
  endpoint?: string;
  message?: string;
  result?: unknown;
};

// Pull useful media URLs out of the (loosely-typed) API response.
function parseResult(data: ApiResponse): ParsedResult {
  const result = (data.result ?? {}) as Record<string, unknown>;

  const get = (k: string): string | undefined => {
    const v = result[k];
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  const title =
    get("title") ||
    get("caption") ||
    get("description") ||
    get("name") ||
    "Video Facebook";
  const thumbnail = get("thumbnail") || get("thumb") || get("image") || get("cover");
  const duration = get("duration") || get("length");
  const author = get("author") || get("username") || get("user") || get("uploader");

  const variants: DownloadVariant[] = [];
  const seen = new Set<string>();
  const pushVariant = (v: DownloadVariant) => {
    if (!v.url || seen.has(v.url)) return;
    seen.add(v.url);
    variants.push(v);
  };

  // Common shapes returned by various Facebook downloader backends.
  const hd = get("hd") || get("video_hd") || get("hd_url");
  const sd = get("sd") || get("video_sd") || get("sd_url") || get("video") || get("url");
  const audio = get("audio") || get("mp3") || get("audio_url");

  if (hd) pushVariant({ label: "Video HD", url: hd, quality: "HD" });
  if (sd) pushVariant({ label: "Video SD", url: sd, quality: "SD" });
  if (audio) pushVariant({ label: "Audio MP3", url: audio, isAudio: true });

  // Generic shape: result.media = [{ url, quality, type }]
  const media = result.media;
  if (Array.isArray(media)) {
    for (const item of media as Array<Record<string, unknown>>) {
      const url = typeof item.url === "string" ? item.url : undefined;
      if (!url) continue;
      const quality =
        (typeof item.quality === "string" && item.quality) ||
        (typeof item.resolution === "string" && item.resolution) ||
        (typeof item.label === "string" && item.label) ||
        undefined;
      const type = typeof item.type === "string" ? item.type.toLowerCase() : "";
      const isAudio = type.includes("audio") || /\.mp3(\?|$)/i.test(url);
      pushVariant({
        label: isAudio ? "Audio" : `Video${quality ? ` ${quality}` : ""}`,
        url,
        quality,
        isAudio,
      });
    }
  }

  // Generic shape: result.links / result.downloads
  for (const key of ["links", "downloads", "download"]) {
    const arr = result[key];
    if (Array.isArray(arr)) {
      for (const item of arr as Array<Record<string, unknown>>) {
        const url =
          typeof item.url === "string"
            ? item.url
            : typeof item.link === "string"
              ? item.link
              : undefined;
        if (!url) continue;
        const quality =
          (typeof item.quality === "string" && item.quality) ||
          (typeof item.resolution === "string" && item.resolution) ||
          undefined;
        const label =
          (typeof item.label === "string" && item.label) ||
          (quality ? `Video ${quality}` : "Download");
        pushVariant({ label, url, quality });
      }
    }
  }

  return { title, thumbnail, duration, author, variants, raw: result };
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 8)));
  } catch {
    // ignore storage errors
  }
}

function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" ? "light" : "dark";
  });
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_API_KEY,
  );
  const [showKey, setShowKey] = useState(false);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());

  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.classList.add("light");
    else root.classList.remove("light");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, apiKey);
  }, [apiKey]);

  const isValidFb = useMemo(() => {
    if (!url) return false;
    try {
      const u = new URL(url);
      return /(^|\.)facebook\.com$/.test(u.hostname) || u.hostname === "fb.watch";
    } catch {
      return false;
    }
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      setError("Tidak bisa akses clipboard. Tempel manual ya.");
    }
  };

  const handleClear = () => {
    setUrl("");
    setResult(null);
    setError(null);
  };

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Tempel link video Facebook dulu.");
      return;
    }
    if (!isValidFb) {
      setError("URL bukan link Facebook. Pastikan dari facebook.com atau fb.watch.");
      return;
    }
    if (!apiKey.trim()) {
      setError("API Key kosong. Isi di pengaturan dulu.");
      return;
    }

    setLoading(true);
    try {
      const reqUrl = new URL(API_ENDPOINT);
      reqUrl.searchParams.set("apikey", apiKey.trim());
      reqUrl.searchParams.set("url", trimmed);
      const res = await fetch(reqUrl.toString());
      const data = (await res.json()) as ApiResponse;

      if (data.status === false || !res.ok) {
        setError(
          data.message ||
            `Gagal memproses (HTTP ${res.status}). Pastikan video bersifat publik.`,
        );
        return;
      }

      const parsed = parseResult(data);
      if (parsed.variants.length === 0) {
        setError(
          "API merespons tapi tidak ada link download yang terdeteksi. Coba video publik lain.",
        );
        return;
      }
      setResult(parsed);

      // Save to history
      const next: HistoryItem = {
        url: trimmed,
        title: parsed.title || "Video Facebook",
        thumbnail: parsed.thumbnail,
        at: Date.now(),
      };
      const updated = [next, ...history.filter((h) => h.url !== trimmed)].slice(0, 8);
      setHistory(updated);
      saveHistory(updated);

      // Smooth scroll to result on next paint
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `Gagal request: ${err.message}`
          : "Gagal melakukan request ke API.",
      );
    } finally {
      setLoading(false);
    }
  };

  const removeHistoryItem = (u: string) => {
    const updated = history.filter((h) => h.url !== u);
    setHistory(updated);
    saveHistory(updated);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background layers */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />

      {/* Navbar */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
              <Download className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight">
                Dmaz<span className="gradient-text">alyxers</span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[rgb(var(--muted))]">
                Facebook Downloader
              </div>
            </div>
          </a>

          <nav className="flex items-center gap-2">
            <a
              href="https://api.komputerz.site/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/60 px-3 py-1.5 text-xs font-medium text-[rgb(var(--text-2))] transition-colors hover:border-indigo-400/40 hover:text-[rgb(var(--text))] sm:flex"
            >
              <Globe className="h-3.5 w-3.5" />
              KomputerzAPI
            </a>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/60 text-[rgb(var(--text-2))] transition-colors hover:border-indigo-400/40 hover:text-[rgb(var(--text))]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero + Form */}
      <main className="relative z-10">
        <section className="mx-auto max-w-3xl px-5 pb-12 pt-6 md:px-8 md:pt-12">
          <div className="animate-fade-up text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
              </span>
              Powered by KomputerzAPI
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Download Video{" "}
              <span className="gradient-text">Facebook</span>
              <br className="hidden sm:block" /> Cepat & Tanpa Ribet
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[rgb(var(--text-2))] sm:text-base">
              Tempel link video Facebook publik, ambil versi HD/SD atau audionya
              langsung. Tanpa instal apa-apa.
            </p>
          </div>

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="animate-fade-up glass mt-8 rounded-2xl border border-[rgb(var(--border))] p-4 shadow-2xl shadow-indigo-950/20 sm:p-6"
            style={{ animationDelay: "0.08s" }}
          >
            <label className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
              <Link2 className="h-3.5 w-3.5" />
              URL Video Facebook
            </label>
            <div className="group relative flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-3 py-1 transition-colors focus-within:border-indigo-400/60">
              <Facebook className="h-4 w-4 flex-shrink-0 text-indigo-400" />
              <input
                type="url"
                placeholder="https://www.facebook.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none disabled:opacity-50"
                autoComplete="off"
                spellCheck={false}
              />
              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-shrink-0 rounded-md px-2 py-1 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
                  aria-label="Clear"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={handlePaste}
                disabled={loading}
                className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/60 px-2.5 py-1.5 text-xs font-medium text-[rgb(var(--text-2))] transition-colors hover:border-indigo-400/40 hover:text-[rgb(var(--text))] disabled:opacity-50"
              >
                <Clipboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>

            {/* URL validation hint */}
            {url && !isValidFb && (
              <p className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-amber-400">
                <AlertCircle className="h-3 w-3" />
                URL ini bukan dari facebook.com atau fb.watch
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Ambil Video
                </>
              )}
            </button>

            {/* API key panel */}
            <div className="mt-4 border-t border-[rgb(var(--border))] pt-3">
              <button
                type="button"
                onClick={() => setShowKeyPanel((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-xs font-medium text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--text-2))]"
              >
                <span className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  API Key {apiKey === DEFAULT_API_KEY && "(default — bisa diganti)"}
                </span>
                <span className="text-[10px] uppercase tracking-wider">
                  {showKeyPanel ? "Tutup" : "Ubah"}
                </span>
              </button>
              {showKeyPanel && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-3 py-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="KAPI-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="min-w-0 flex-1 bg-transparent py-2 font-mono text-xs text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="flex-shrink-0 rounded-md px-2 py-1 text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
                    aria-label={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="animate-fade-up mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
              <div className="flex-1">
                <div className="font-semibold text-red-300">Gagal</div>
                <div className="mt-0.5 text-red-200/90">{error}</div>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !result && (
            <div className="animate-fade-up mt-5 overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/40">
              <div className="bg-shimmer aspect-video w-full" />
              <div className="space-y-2 p-4">
                <div className="bg-shimmer h-4 w-2/3 rounded" />
                <div className="bg-shimmer h-3 w-1/3 rounded" />
                <div className="mt-3 flex gap-2">
                  <div className="bg-shimmer h-10 flex-1 rounded-lg" />
                  <div className="bg-shimmer h-10 flex-1 rounded-lg" />
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div
              ref={resultRef}
              className="animate-fade-up glass mt-5 overflow-hidden rounded-2xl border border-[rgb(var(--border))] shadow-2xl shadow-indigo-950/20"
            >
              {result.thumbnail && (
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                    <h2 className="line-clamp-2 text-sm font-semibold text-white drop-shadow-md sm:text-base">
                      {result.title}
                    </h2>
                    {result.duration && (
                      <span className="flex-shrink-0 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] font-semibold text-white backdrop-blur">
                        {result.duration}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-5">
                {!result.thumbnail && (
                  <h2 className="mb-2 text-sm font-semibold text-[rgb(var(--text))] sm:text-base">
                    {result.title}
                  </h2>
                )}
                {result.author && (
                  <div className="mb-3 text-xs text-[rgb(var(--muted))]">
                    oleh{" "}
                    <span className="font-medium text-[rgb(var(--text-2))]">
                      {result.author}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  {result.variants.map((v, i) => (
                    <div
                      key={v.url}
                      className="group flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 p-2.5 transition-colors hover:border-indigo-400/40"
                    >
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold uppercase ${
                          v.isAudio
                            ? "bg-amber-500/15 text-amber-300"
                            : v.quality?.toUpperCase().includes("HD")
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-indigo-500/15 text-indigo-300"
                        }`}
                      >
                        {v.isAudio ? "MP3" : v.quality?.toUpperCase().slice(0, 3) || "VID"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[rgb(var(--text))]">
                          {v.label}
                        </div>
                        <div className="truncate font-mono text-[10px] text-[rgb(var(--muted))]">
                          {v.url}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(v.url, i)}
                        className="flex-shrink-0 rounded-md px-2 py-1.5 text-xs text-[rgb(var(--muted))] transition-colors hover:bg-[rgb(var(--bg))]/60 hover:text-[rgb(var(--text))]"
                        aria-label="Copy link"
                      >
                        {copiedIdx === i ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Clipboard className="h-4 w-4" />
                        )}
                      </button>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-95"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="mt-10">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  <History className="h-3.5 w-3.5" />
                  Riwayat ({history.length})
                </div>
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1 text-[11px] text-[rgb(var(--muted))] hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                  Bersihkan
                </button>
              </div>
              <div className="space-y-1.5">
                {history.map((h) => (
                  <div
                    key={h.url}
                    className="group flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 p-2.5 transition-colors hover:border-indigo-400/30"
                  >
                    {h.thumbnail ? (
                      <img
                        src={h.thumbnail}
                        alt=""
                        className="h-10 w-14 flex-shrink-0 rounded-md object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-md bg-indigo-500/10">
                        <Facebook className="h-4 w-4 text-indigo-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-[rgb(var(--text))]">
                        {h.title}
                      </div>
                      <div className="truncate font-mono text-[10px] text-[rgb(var(--muted))]">
                        {h.url}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUrl(h.url);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="flex-shrink-0 rounded-md px-2 py-1 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
                      title="Pakai lagi"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeHistoryItem(h.url)}
                      className="flex-shrink-0 rounded-md px-2 py-1 text-xs text-[rgb(var(--muted))] hover:text-red-300"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl border-t border-[rgb(var(--border))] px-5 py-12 md:px-8 md:py-16">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Cepat",
                desc: "Proses langsung lewat REST API dengan timeout 30 detik. Tidak ada iklan, tidak ada redirect aneh.",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
              {
                icon: Shield,
                title: "Aman",
                desc: "Semua proses jalan di browser kamu. API Key tersimpan di localStorage, bukan di server.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                icon: Sparkles,
                title: "HD & Audio",
                desc: "Tersedia varian HD, SD, sampai audio MP3 — tergantung apa yang dikembalikan oleh sumber.",
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/40 p-5 transition-colors hover:border-indigo-400/30"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.bg}`}
                >
                  <f.icon className={`h-5 w-5 ${f.color}`} strokeWidth={2.2} />
                </div>
                <div className="mt-3 text-sm font-bold">{f.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-[rgb(var(--text-2))]">
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgb(var(--border))]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-[rgb(var(--muted))] md:flex-row md:px-8">
          <div>
            © {new Date().getFullYear()} Dmazalyxers · Built with{" "}
            <a
              href="https://api.komputerz.site/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-indigo-300 hover:text-indigo-200"
            >
              KomputerzAPI
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/dmazwry3-oss/Dmazalyxers"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-[rgb(var(--text-2))]"
            >
              <Github className="h-3.5 w-3.5" />
              Source
            </a>
            <span className="hidden h-3 w-px bg-[rgb(var(--border))] md:block" />
            <span>
              Hanya untuk video <b className="text-[rgb(var(--text-2))]">publik</b>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
