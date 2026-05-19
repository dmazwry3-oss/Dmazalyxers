import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Download,
  Instagram,
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
  History as HistoryIcon,
  ExternalLink,
  Github,
  Shield,
  Zap,
  Image as ImageIcon,
  Video,
  Music,
  Music2,
  Youtube,
  HardDrive,
  Scissors,
  Settings2,
  Settings as SettingsIcon,
  X,
  MessageCircle,
  Lock,
} from "lucide-react";
import "./App.css";
import { BottomSheet } from "./components/BottomSheet";
import { AuthSheet } from "./components/AuthSheet";
import { UserMenu } from "./components/UserMenu";
import { getSession, logout, type Session } from "./lib/auth";

const DEFAULT_API_KEY = "KAPI-6789ADACCC1091EFDAB55414";
const API_BASE = "https://api.komputerz.site/api/v1/download";
const ADMIN_PASSWORD = "050504";

const STORAGE_KEY = "dmaz_api_key";
const THEME_KEY = "dmaz_theme";
const HISTORY_KEY = "dmaz_history";
const PLATFORM_KEY = "dmaz_platform";

type PlatformId =
  | "instagram"
  | "tiktok"
  | "ytmp4"
  | "ytmp3"
  | "spotify"
  | "terabox"
  | "capcut";

type QualityOption = { label: string; value: string };

type Platform = {
  id: PlatformId;
  label: string;
  short: string;
  endpoint: string;
  placeholder: string;
  description: string;
  example: string;
  icon: LucideIcon;
  gradient: string;
  accentText: string;
  accentBorder: string;
  accentBg: string;
  validate: (u: URL) => boolean;
  validHint: string;
  slowWarning?: string;
  qualityParam?: {
    name: string;
    options: QualityOption[];
    default: string;
  };
};

const PLATFORMS: Platform[] = [
  {
    id: "instagram",
    label: "Instagram",
    short: "IG",
    endpoint: "instagram",
    placeholder: "https://www.instagram.com/p/...",
    description: "Foto, video, reel, IGTV, stories, carousel",
    example: "https://www.instagram.com/p/C5L2NaHMfsV/",
    icon: Instagram,
    gradient: "from-pink-500 via-fuchsia-500 to-amber-500",
    accentText: "text-pink-400",
    accentBorder: "focus-within:border-pink-400/60 hover:border-pink-400/40",
    accentBg: "bg-pink-500/15 text-pink-300",
    validate: (u) =>
      /(^|\.)instagram\.com$/.test(u.hostname) &&
      /^\/(p|reel|reels|tv|stories)\//.test(u.pathname),
    validHint: "Format: instagram.com/p/, /reel/, /tv/, /stories/",
  },
  {
    id: "tiktok",
    label: "TikTok",
    short: "TT",
    endpoint: "tiktok",
    placeholder: "https://www.tiktok.com/@user/video/...",
    description: "Video tanpa watermark + audio MP3",
    example: "https://www.tiktok.com/@tiktok/video/7106594312292453675",
    icon: Music2,
    gradient: "from-cyan-400 via-pink-500 to-fuchsia-500",
    accentText: "text-cyan-400",
    accentBorder: "focus-within:border-cyan-400/60 hover:border-cyan-400/40",
    accentBg: "bg-cyan-500/15 text-cyan-300",
    validate: (u) =>
      /(^|\.)tiktok\.com$/.test(u.hostname) ||
      u.hostname === "vm.tiktok.com" ||
      u.hostname === "vt.tiktok.com",
    validHint: "Format: tiktok.com/@user/video/... atau vt.tiktok.com/...",
  },
  {
    id: "ytmp4",
    label: "YouTube MP4",
    short: "YT",
    endpoint: "ytmp4",
    placeholder: "https://www.youtube.com/watch?v=...",
    description: "Video YouTube format MP4",
    example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    icon: Youtube,
    gradient: "from-red-500 to-rose-600",
    accentText: "text-red-400",
    accentBorder: "focus-within:border-red-400/60 hover:border-red-400/40",
    accentBg: "bg-red-500/15 text-red-300",
    validate: (u) => /(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname),
    validHint: "Format: youtube.com/watch?v=... atau youtu.be/...",
    slowWarning:
      "YouTube biasanya lambat (20–40 detik). Tunggu ya, jangan refresh.",
    qualityParam: {
      name: "quality",
      default: "720",
      options: [
        { label: "360p", value: "360" },
        { label: "480p", value: "480" },
        { label: "720p HD", value: "720" },
        { label: "1080p Full HD", value: "1080" },
      ],
    },
  },
  {
    id: "ytmp3",
    label: "YouTube MP3",
    short: "MP3",
    endpoint: "ytmp3",
    placeholder: "https://www.youtube.com/watch?v=...",
    description: "Audio YouTube format MP3",
    example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    icon: Music,
    gradient: "from-rose-500 to-amber-500",
    accentText: "text-rose-400",
    accentBorder: "focus-within:border-rose-400/60 hover:border-rose-400/40",
    accentBg: "bg-rose-500/15 text-rose-300",
    validate: (u) => /(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname),
    validHint: "Format: youtube.com/watch?v=... atau youtu.be/...",
    slowWarning:
      "YouTube biasanya lambat (20–40 detik). Tunggu ya, jangan refresh.",
  },
  {
    id: "spotify",
    label: "Spotify",
    short: "SPT",
    endpoint: "spotify",
    placeholder: "https://open.spotify.com/track/...",
    description: "Preview 30 detik (Spotify DRM)",
    example: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    icon: Music,
    gradient: "from-emerald-500 to-green-600",
    accentText: "text-emerald-400",
    accentBorder:
      "focus-within:border-emerald-400/60 hover:border-emerald-400/40",
    accentBg: "bg-emerald-500/15 text-emerald-300",
    validate: (u) => u.hostname === "open.spotify.com",
    validHint: "Format: open.spotify.com/track/...",
  },
  {
    id: "terabox",
    label: "TeraBox",
    short: "TB",
    endpoint: "terabox",
    placeholder: "https://terabox.com/s/...",
    description: "Download file dari TeraBox publik",
    example: "https://www.terabox.com/s/1abcdefg",
    icon: HardDrive,
    gradient: "from-blue-500 to-indigo-600",
    accentText: "text-blue-400",
    accentBorder: "focus-within:border-blue-400/60 hover:border-blue-400/40",
    accentBg: "bg-blue-500/15 text-blue-300",
    validate: (u) =>
      /(^|\.)(terabox\.com|teraboxapp\.com|nephobox\.com|4funbox\.com|mirrobox\.com|momerybox\.com|tibibox\.com|terasharelink\.com)$/.test(
        u.hostname,
      ),
    validHint: "Format: terabox.com/s/... (atau domain TeraBox lain)",
  },
  {
    id: "capcut",
    label: "CapCut",
    short: "CC",
    endpoint: "capcut",
    placeholder: "https://www.capcut.com/...",
    description: "Video / template CapCut",
    example: "https://www.capcut.com/discover/template/abc123",
    icon: Scissors,
    gradient: "from-violet-500 to-purple-600",
    accentText: "text-violet-400",
    accentBorder:
      "focus-within:border-violet-400/60 hover:border-violet-400/40",
    accentBg: "bg-violet-500/15 text-violet-300",
    validate: (u) => /(^|\.)capcut\.com$/.test(u.hostname),
    validHint: "Format: capcut.com/...",
  },
];

function getPlatform(id: string): Platform {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];
}

type MediaKind = "video" | "image" | "audio";

type DownloadVariant = {
  label: string;
  url: string;
  quality?: string;
  kind: MediaKind;
};

type ParsedResult = {
  title: string;
  thumbnail?: string;
  duration?: string;
  author?: string;
  note?: string;
  variants: DownloadVariant[];
  raw: Record<string, unknown>;
};

type HistoryItem = {
  platform: PlatformId;
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

// Classify a URL into video/image/audio based on extension or hint.
function guessKind(url: string, hint?: string): MediaKind {
  const h = (hint || "").toLowerCase();
  if (h.includes("audio") || /\.(mp3|m4a|aac|ogg|wav)(\?|$)/i.test(url))
    return "audio";
  if (
    h.includes("image") ||
    h.includes("photo") ||
    h.includes("thumbnail") ||
    /\.(jpe?g|png|webp|heic|gif)(\?|$)/i.test(url)
  )
    return "image";
  return "video";
}

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
    "Media";
  const thumbnail =
    get("thumbnail") ||
    get("thumb") ||
    get("cover") ||
    get("display_url") ||
    get("image");
  const duration = get("duration") || get("length");
  const author =
    get("author") ||
    get("artist") ||
    get("username") ||
    get("user") ||
    get("uploader") ||
    get("owner");
  const note = get("note") || get("info");

  const variants: DownloadVariant[] = [];
  const seen = new Set<string>();
  const pushVariant = (v: DownloadVariant) => {
    if (!v.url || seen.has(v.url)) return;
    seen.add(v.url);
    variants.push(v);
  };

  // Common single-value shapes
  const hd = get("hd") || get("video_hd") || get("hd_url");
  const sd =
    get("sd") || get("video_sd") || get("sd_url") || get("video") || get("video_url");
  const audio = get("audio") || get("mp3") || get("audio_url");
  const image =
    get("image_url") ||
    get("display_url") ||
    get("image") ||
    get("photo") ||
    get("download_url");

  if (hd) pushVariant({ label: "Video HD", url: hd, quality: "HD", kind: "video" });
  if (sd) pushVariant({ label: "Video SD", url: sd, quality: "SD", kind: "video" });
  if (audio) pushVariant({ label: "Audio", url: audio, kind: "audio" });
  if (image) {
    const kind = guessKind(image);
    pushVariant({
      label: kind === "image" ? "Foto" : "Video",
      url: image,
      kind,
    });
  }

  // Generic array shapes
  for (const key of ["media", "items", "downloads", "download", "links", "resources"]) {
    const arr = result[key];
    if (!Array.isArray(arr)) continue;
    for (const itemRaw of arr as Array<Record<string, unknown>>) {
      const item = itemRaw;
      const url =
        (typeof item.url === "string" && item.url) ||
        (typeof item.link === "string" && item.link) ||
        (typeof item.download_url === "string" && item.download_url) ||
        (typeof item.image_url === "string" && item.image_url) ||
        (typeof item.video_url === "string" && item.video_url) ||
        (typeof item.display_url === "string" && item.display_url) ||
        undefined;
      if (!url) continue;
      const quality =
        (typeof item.quality === "string" && item.quality) ||
        (typeof item.resolution === "string" && item.resolution) ||
        undefined;
      const type =
        (typeof item.type === "string" && item.type) ||
        (typeof item.media_type === "string" && item.media_type) ||
        "";
      const kind = guessKind(url, type);
      const baseLabel =
        (typeof item.label === "string" && item.label) ||
        (kind === "image" ? "Foto" : kind === "audio" ? "Audio" : "Video");
      const finalLabel = quality
        ? baseLabel.toLowerCase().includes(quality.toLowerCase())
          ? baseLabel
          : `${baseLabel} ${quality}`
        : baseLabel;
      pushVariant({ label: finalLabel, url, quality, kind });
    }
  }

  return { title, thumbnail, duration, author, note, variants, raw: result };
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
  } catch {
    // ignore storage errors
  }
}

function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" ? "light" : "dark";
  });

  const [platformId, setPlatformId] = useState<PlatformId>(() => {
    const stored = localStorage.getItem(PLATFORM_KEY);
    if (stored && PLATFORMS.some((p) => p.id === stored))
      return stored as PlatformId;
    return "instagram";
  });
  const platform = useMemo(() => getPlatform(platformId), [platformId]);

  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_API_KEY,
  );
  const [quality, setQuality] = useState<string>(
    () => platform.qualityParam?.default ?? "",
  );
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [resultPlatform, setResultPlatform] = useState<Platform | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  
  // Settings menu states
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Account / login state
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [showAuth, setShowAuth] = useState(false);

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

  useEffect(() => {
    localStorage.setItem(PLATFORM_KEY, platformId);
    // Reset quality to platform default when changing platform
    setQuality(platform.qualityParam?.default ?? "");
    setError(null);
  }, [platformId, platform]);

  const isValidUrl = useMemo(() => {
    if (!url) return false;
    try {
      const u = new URL(url);
      return platform.validate(u);
    } catch {
      return false;
    }
  }, [url, platform]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      setError("Tidak bisa akses clipboard. Tempel manual ya.");
    }
  };

  const handleExample = () => {
    setUrl(platform.example);
    setError(null);
  };

  const handleClear = () => {
    setUrl("");
    setResult(null);
    setResultPlatform(null);
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
    setResultPlatform(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError(`Tempel link ${platform.label} dulu.`);
      return;
    }
    if (!isValidUrl) {
      setError(`URL bukan link ${platform.label}. ${platform.validHint}`);
      return;
    }
    if (!apiKey.trim()) {
      setError("API Key kosong. Isi di pengaturan dulu.");
      return;
    }

    setLoading(true);
    try {
      const reqUrl = new URL(`${API_BASE}/${platform.endpoint}`);
      reqUrl.searchParams.set("apikey", apiKey.trim());
      reqUrl.searchParams.set("url", trimmed);
      if (platform.qualityParam && quality) {
        reqUrl.searchParams.set(platform.qualityParam.name, quality);
      }
      const res = await fetch(reqUrl.toString());
      const data = (await res.json()) as ApiResponse;

      if (data.status === false || !res.ok) {
        setError(
          data.message ||
            `Gagal memproses (HTTP ${res.status}). Coba pastikan link valid dan publik.`,
        );
        return;
      }

      const parsed = parseResult(data);
      if (parsed.variants.length === 0) {
        setError(
          "API merespons tapi tidak ada link download yang terdeteksi. Coba link publik lain.",
        );
        return;
      }
      setResult(parsed);
      setResultPlatform(platform);

      const next: HistoryItem = {
        platform: platform.id,
        url: trimmed,
        title: parsed.title,
        thumbnail: parsed.thumbnail,
        at: Date.now(),
      };
      const updated = [next, ...history.filter((h) => h.url !== trimmed)].slice(
        0,
        12,
      );
      setHistory(updated);
      saveHistory(updated);

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

  const reuseHistory = (h: HistoryItem) => {
    setPlatformId(h.platform);
    setUrl(h.url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSettingsClick = () => {
    // Logged-in users skip the legacy admin password gate.
    if (session) {
      setIsAuthenticated(true);
      setShowSettings(true);
      return;
    }
    setShowPasswordPrompt(true);
    setPasswordInput("");
    setPasswordError(false);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
      setShowSettings(true);
      setPasswordInput("");
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const closeSettings = () => {
    setShowSettings(false);
    setIsAuthenticated(false);
  };

  const closePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setPasswordInput("");
    setPasswordError(false);
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
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${platform.gradient} shadow-lg shadow-black/30 transition-all`}
            >
              <Download className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight">
                Dmaz<span className="gradient-text">alyxers</span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[rgb(var(--muted))]">
                All-in-One Downloader
              </div>
            </div>
          </a>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="touch-target flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/60 text-[rgb(var(--text-2))] transition-colors hover:border-indigo-400/40 hover:text-[rgb(var(--text))]"
              aria-label="Ganti tema"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleSettingsClick}
              className="touch-target flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/60 text-[rgb(var(--text-2))] transition-colors hover:border-indigo-400/40 hover:text-[rgb(var(--text))]"
              aria-label="Pengaturan"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
            <UserMenu
              session={session}
              onLoginClick={() => setShowAuth(true)}
              onLogout={() => {
                logout();
                setSession(null);
              }}
            />
          </nav>
        </div>
      </header>

      {/* Hero + Form */}
      <main className="relative z-10">
        <section className="mx-auto max-w-3xl px-5 pb-12 pt-6 md:px-8 md:pt-12">
          <div className="animate-fade-up text-center">
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Download dari{" "}
              <span className="gradient-text">7 Platform</span>
              <br className="hidden sm:block" /> dalam Satu Tempat
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[rgb(var(--text-2))] sm:text-base">
              Instagram, TikTok, YouTube (MP4 & MP3), Spotify, TeraBox, dan
              CapCut. Pilih platform, tempel link, ambil hasilnya.
            </p>
          </div>

          {/* Platform picker */}
          <div
            className="animate-fade-up scrollbar-thin mt-8 -mx-1 overflow-x-auto px-1 pb-1"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="flex w-max gap-2 sm:w-full sm:grid sm:grid-cols-4 lg:grid-cols-7">
              {PLATFORMS.map((p) => {
                const selected = p.id === platform.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatformId(p.id)}
                    className={`group relative flex min-w-[88px] flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
                      selected
                        ? "border-transparent bg-gradient-to-br text-white shadow-lg shadow-black/30 " +
                          p.gradient
                        : "border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 text-[rgb(var(--text-2))] hover:border-[rgb(var(--text-2))]/30 hover:text-[rgb(var(--text))]"
                    }`}
                    aria-pressed={selected}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.3} />
                    <span className="text-[11px] font-semibold leading-tight">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p
            className="animate-fade-up mt-2 px-1 text-center text-[11px] text-[rgb(var(--muted))]"
            style={{ animationDelay: "0.05s" }}
          >
            {platform.description}
          </p>

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="animate-fade-up glass mt-5 rounded-2xl border border-[rgb(var(--border))] p-4 shadow-2xl shadow-indigo-950/20 sm:p-6"
            style={{ animationDelay: "0.08s" }}
          >
            <label className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
              <Link2 className="h-3.5 w-3.5" />
              URL {platform.label}
            </label>
            <div
              className={`group relative flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-3 py-1 transition-colors ${platform.accentBorder}`}
            >
              <platform.icon
                className={`h-4 w-4 flex-shrink-0 ${platform.accentText}`}
              />
              <input
                type="url"
                placeholder={platform.placeholder}
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
                className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/60 px-2.5 py-1.5 text-xs font-medium text-[rgb(var(--text-2))] transition-colors hover:border-[rgb(var(--text-2))]/40 hover:text-[rgb(var(--text))] disabled:opacity-50"
              >
                <Clipboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>

            {/* URL validation hint */}
            {url && !isValidUrl && (
              <p className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-amber-400">
                <AlertCircle className="h-3 w-3" />
                {platform.validHint}
              </p>
            )}

            {/* Quality picker for ytmp4 */}
            {platform.qualityParam && (
              <div className="mt-3">
                <label className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  <Settings2 className="h-3 w-3" />
                  Kualitas
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {platform.qualityParam.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setQuality(opt.value)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                        quality === opt.value
                          ? `border-transparent bg-gradient-to-br ${platform.gradient} text-white shadow-md`
                          : "border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 text-[rgb(var(--text-2))] hover:border-[rgb(var(--text-2))]/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Slow warning */}
            {platform.slowWarning && (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2 text-[11px] text-amber-300/90">
                <Zap className="mt-0.5 h-3 w-3 flex-shrink-0" />
                {platform.slowWarning}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${platform.gradient} font-semibold text-white shadow-lg shadow-black/30 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Ambil {platform.id === "ytmp3" || platform.id === "spotify" ? "Audio" : platform.id === "terabox" ? "File" : "Media"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExample}
              disabled={loading}
              className="mt-2 w-full rounded-lg px-3 py-1.5 text-[11px] text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--text-2))] disabled:opacity-50"
            >
              Coba contoh URL
            </button>
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
                <div className="mt-0.5 break-words text-red-200/90">
                  {error}
                </div>
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
          {result && resultPlatform && (
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
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                    <resultPlatform.icon className="h-3 w-3" />
                    {resultPlatform.label}
                  </div>
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
                  <div className="mb-1 text-xs text-[rgb(var(--muted))]">
                    oleh{" "}
                    <span className="font-medium text-[rgb(var(--text-2))]">
                      {result.author}
                    </span>
                  </div>
                )}
                {result.note && (
                  <div className="mb-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-300/90">
                    {result.note}
                  </div>
                )}

                <div className="space-y-2">
                  {result.variants.map((v, i) => (
                    <div
                      key={v.url}
                      className={`group flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 p-2.5 transition-colors ${resultPlatform.accentBorder}`}
                    >
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                          v.kind === "audio"
                            ? "bg-amber-500/15 text-amber-300"
                            : v.kind === "image"
                              ? "bg-fuchsia-500/15 text-fuchsia-300"
                              : v.quality?.toUpperCase().includes("HD") ||
                                  v.quality?.includes("1080") ||
                                  v.quality?.includes("720")
                                ? "bg-emerald-500/15 text-emerald-300"
                                : resultPlatform.accentBg
                        }`}
                        aria-hidden
                      >
                        {v.kind === "image" ? (
                          <ImageIcon className="h-4 w-4" />
                        ) : v.kind === "audio" ? (
                          <Music className="h-4 w-4" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
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
                        className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r ${resultPlatform.gradient} px-3 py-2 text-xs font-semibold text-white shadow-md shadow-black/30 transition-all hover:brightness-110 active:scale-95`}
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
                  <HistoryIcon className="h-3.5 w-3.5" />
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
                {history.map((h) => {
                  const p = getPlatform(h.platform);
                  const PIcon = p.icon;
                  return (
                    <div
                      key={h.url + h.at}
                      className="group flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 p-2.5 transition-colors hover:border-[rgb(var(--text-2))]/30"
                    >
                      {h.thumbnail ? (
                        <div className="relative h-10 w-14 flex-shrink-0">
                          <img
                            src={h.thumbnail}
                            alt=""
                            className="h-full w-full rounded-md object-cover"
                            loading="lazy"
                          />
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${p.gradient} ring-2 ring-[rgb(var(--bg))]`}
                          >
                            <PIcon className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${p.gradient}`}
                        >
                          <PIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${p.accentBg}`}
                          >
                            {p.short}
                          </span>
                          <div className="truncate text-sm text-[rgb(var(--text))]">
                            {h.title}
                          </div>
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[10px] text-[rgb(var(--muted))]">
                          {h.url}
                        </div>
                      </div>
                      <button
                        onClick={() => reuseHistory(h)}
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
                  );
                })}
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
                title: "7 Platform",
                desc: "Instagram, TikTok, YouTube MP4/MP3, Spotify, TeraBox, dan CapCut — semuanya dalam satu UI.",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
              {
                icon: Shield,
                title: "Aman",
                desc: "Semua proses jalan di browser. API Key tersimpan di localStorage, bukan di server kami.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                icon: Sparkles,
                title: "Foto, Video, Audio",
                desc: "Dukungan otomatis untuk semua tipe media — video HD/SD, MP3, foto, dan carousel.",
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/40 p-5 transition-colors hover:border-[rgb(var(--text-2))]/30"
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
            © {new Date().getFullYear()} Dmazalyxers · All-in-One Downloader
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
              Hanya untuk konten <b className="text-[rgb(var(--text-2))]">publik</b>
            </span>
          </div>
        </div>
      </footer>

      {/* Password Prompt — bottom sheet on mobile, centered on desktop */}
      <BottomSheet
        open={showPasswordPrompt}
        onClose={closePasswordPrompt}
        ariaLabel="Masukkan password"
        maxWidth="sm:max-w-md"
      >
        <div className="px-5 pt-2 pb-6 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[rgb(var(--text))]">
                  Akses Pengaturan
                </h3>
                <p className="mt-0.5 text-[12px] leading-snug text-[rgb(var(--muted))]">
                  Masukkan password admin atau{" "}
                  <button
                    type="button"
                    onClick={() => {
                      closePasswordPrompt();
                      setShowAuth(true);
                    }}
                    className="font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    masuk dengan akun
                  </button>
                </p>
              </div>
            </div>
            <button
              onClick={closePasswordPrompt}
              className="touch-target flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg-2))]/60 hover:text-[rgb(var(--text))]"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              placeholder="Password admin"
              className={`w-full rounded-2xl border px-4 py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none ${
                passwordError
                  ? "border-red-500/50 bg-red-500/5"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 focus:border-indigo-400/60"
              }`}
              autoFocus
            />
            {passwordError && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Password salah, coba lagi
              </p>
            )}
            <button
              onClick={handlePasswordSubmit}
              className="touch-target flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-[0.99]"
            >
              Buka Pengaturan
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Settings — bottom sheet on mobile, centered on desktop */}
      <BottomSheet
        open={showSettings && isAuthenticated}
        onClose={closeSettings}
        ariaLabel="Pengaturan"
        maxWidth="sm:max-w-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[rgb(var(--border))] px-5 pt-2 pb-4 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30">
              <Settings2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[rgb(var(--text))]">
                Pengaturan
              </h3>
              <p className="mt-0.5 text-[12px] text-[rgb(var(--muted))]">
                Kelola API key & kontak
              </p>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="touch-target flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg-2))]/60 hover:text-[rgb(var(--text))]"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {/* API Key Section */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--text))]">
              <Key className="h-4 w-4 text-indigo-400" />
              API Key
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-3 py-1 transition-colors focus-within:border-indigo-400/60">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="KAPI-xxxxxxxxxxxxxxxxxxxxxxxx"
                className="min-w-0 flex-1 bg-transparent py-2.5 font-mono text-xs text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="touch-target flex-shrink-0 rounded-md px-2 py-1 text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
                aria-label={showKey ? "Sembunyikan API key" : "Tampilkan API key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[rgb(var(--muted))]">
              API key disimpan di browser ini (localStorage)
            </p>
          </div>

          {/* Contact Section */}
          <div className="space-y-3 border-t border-[rgb(var(--border))] pt-6">
            <h4 className="text-sm font-semibold text-[rgb(var(--text))]">
              Kontak Developer
            </h4>

            <a
              href="https://wa.me/6289603659756"
              target="_blank"
              rel="noreferrer"
              className="touch-target flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 p-3 transition-all hover:border-green-500/40 hover:bg-green-500/5 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15">
                <MessageCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[rgb(var(--text))]">
                  WhatsApp
                </div>
                <div className="truncate text-xs text-[rgb(var(--text-2))]">
                  +62 896-0365-9756
                </div>
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-[rgb(var(--muted))]" />
            </a>

            <a
              href="https://instagram.com/dmasmaul05"
              target="_blank"
              rel="noreferrer"
              className="touch-target flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 p-3 transition-all hover:border-pink-500/40 hover:bg-pink-500/5 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-amber-500">
                <Instagram className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[rgb(var(--text))]">
                  Instagram
                </div>
                <div className="truncate text-xs text-[rgb(var(--text-2))]">
                  @dmasmaul05
                </div>
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-[rgb(var(--muted))]" />
            </a>
          </div>

          <button
            onClick={closeSettings}
            className="touch-target w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-4 py-2.5 text-sm font-medium text-[rgb(var(--text-2))] transition-colors hover:border-[rgb(var(--text-2))]/40 hover:text-[rgb(var(--text))]"
          >
            Tutup
          </button>
        </div>
      </BottomSheet>

      {/* Login / Register sheet */}
      <AuthSheet
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={(s) => {
          setSession(s);
          setShowAuth(false);
        }}
      />
    </div>
  );
}

export default App;
