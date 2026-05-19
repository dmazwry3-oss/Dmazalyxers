import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Sparkles,
  User as UserIcon,
  UserPlus,
  X,
} from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { login, register, type Session } from "../lib/auth";

type Mode = "login" | "register";

type Props = {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
  onSuccess: (session: Session) => void;
};

export function AuthSheet({
  open,
  onClose,
  onSuccess,
  initialMode = "login",
}: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset transient state every time the sheet (re)opens.
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setLoading(false);
      setShowPassword(false);
    }
  }, [open, initialMode]);

  const passwordStrength = useMemo(() => {
    if (mode !== "register" || !password) return null;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ["Lemah", "Lumayan", "Cukup", "Kuat", "Sangat kuat"];
    const colors = [
      "bg-red-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-emerald-500",
      "bg-emerald-400",
    ];
    const idx = Math.max(0, Math.min(score - 1, labels.length - 1));
    return { score, label: labels[idx], color: colors[idx] };
  }, [password, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const session = await login({ identifier, password });
        onSuccess(session);
      } else {
        const session = await register({ username, email, password });
        onSuccess(session);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setPassword("");
  };

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Login atau daftar">
      <div className="px-5 pt-2 pb-6 sm:px-7 sm:pt-6 sm:pb-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight text-[rgb(var(--text))] sm:text-xl">
                {mode === "login" ? "Selamat datang kembali" : "Buat akun baru"}
              </h2>
              <p className="mt-0.5 text-[12px] leading-snug text-[rgb(var(--muted))]">
                {mode === "login"
                  ? "Masuk untuk simpan riwayat & pengaturan"
                  : "Sinkron riwayat di perangkat ini"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[rgb(var(--muted))] transition-colors hover:bg-[rgb(var(--bg-2))]/60 hover:text-[rgb(var(--text))]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode tabs */}
        <div
          role="tablist"
          aria-label="Pilih mode"
          className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/50 p-1"
        >
          {(
            [
              { id: "login", label: "Masuk", Icon: LogIn },
              { id: "register", label: "Daftar", Icon: UserPlus },
            ] as Array<{ id: Mode; label: string; Icon: typeof LogIn }>
          ).map(({ id, label, Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => switchMode(id)}
                className={`relative flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-[rgb(var(--text-2))] hover:text-[rgb(var(--text))]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {mode === "login" ? (
            <Field
              label="Username atau Email"
              icon={<AtSign className="h-4 w-4" />}
              input={
                <input
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="username atau email"
                  className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                  required
                />
              }
            />
          ) : (
            <>
              <Field
                label="Username"
                icon={<UserIcon className="h-4 w-4" />}
                input={
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="namamu"
                    minLength={3}
                    maxLength={24}
                    className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                    required
                  />
                }
              />
              <Field
                label="Email"
                icon={<Mail className="h-4 w-4" />}
                input={
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kamu@email.com"
                    className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                    required
                  />
                }
              />
            </>
          )}

          <Field
            label="Password"
            icon={<Lock className="h-4 w-4" />}
            input={
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "login" ? "password" : "minimal 6 karakter"}
                minLength={6}
                className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                required
              />
            }
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="flex-shrink-0 rounded-md px-2 py-1 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--text))]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {/* Password strength meter (register only) */}
          {passwordStrength && (
            <div className="px-1">
              <div className="flex h-1 w-full gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-full flex-1 rounded-full transition-colors ${
                      i < passwordStrength.score
                        ? passwordStrength.color
                        : "bg-[rgb(var(--border))]"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-[rgb(var(--muted))]">
                Kekuatan password: <span className="text-[rgb(var(--text-2))]">{passwordStrength.label}</span>
              </p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="touch-target flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : mode === "login" ? (
              <>
                <LogIn className="h-4 w-4" />
                Masuk
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Daftar Sekarang
              </>
            )}
          </button>

          <p className="pt-1 text-center text-[11px] leading-relaxed text-[rgb(var(--muted))]">
            {mode === "login" ? (
              <>
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  Daftar dulu
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  Masuk
                </button>
              </>
            )}
          </p>

          <p className="pt-2 text-center text-[10px] leading-snug text-[rgb(var(--muted))]/70">
            Akun disimpan lokal di browser ini saja. Tidak ada data yang dikirim ke server.
          </p>
        </form>
      </div>
    </BottomSheet>
  );
}

function Field(props: {
  label: string;
  icon: React.ReactNode;
  input: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
        {props.label}
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-3 transition-colors focus-within:border-indigo-400/60">
        <span className="flex-shrink-0 text-[rgb(var(--muted))]">{props.icon}</span>
        {props.input}
        {props.trailing}
      </div>
    </div>
  );
}
