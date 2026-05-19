import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  AtSign,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  UserPlus,
  X,
} from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import {
  SECURITY_QUESTIONS,
  checkPassword,
  formatDuration,
  getLockoutRemaining,
  getSecurityQuestion,
  login,
  passwordScore,
  passwordStrengthLabel,
  register,
  resetPasswordWithSecurity,
  type Session,
} from "../lib/auth";
import { toast } from "../lib/toast";

type Mode = "login" | "register" | "forgot";

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

  // Shared
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Register
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState(
    SECURITY_QUESTIONS[0],
  );
  const [securityAnswer, setSecurityAnswer] = useState("");

  // Caps lock detection
  const [capsLock, setCapsLock] = useState(false);

  // Forgot password sub-flow
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotResolvedQuestion, setForgotResolvedQuestion] = useState("");
  const [forgotResolvedUsername, setForgotResolvedUsername] = useState("");
  const [forgotAnswer, setForgotAnswer] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const usernameRef = useRef<HTMLInputElement | null>(null);
  const identifierRef = useRef<HTMLInputElement | null>(null);

  // Reset state every time the sheet (re)opens.
  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setError(null);
    setLoading(false);
    setShowLoginPassword(false);
    setShowRegPassword(false);
    setShowForgotPassword(false);
    setCapsLock(false);
    setLoginPassword("");
    setPassword("");
    setConfirmPassword("");
    setSecurityAnswer("");
    setForgotStep(1);
    setForgotIdentifier("");
    setForgotResolvedQuestion("");
    setForgotResolvedUsername("");
    setForgotAnswer("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
  }, [open, initialMode]);

  // Focus the right field when mode changes
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      if (mode === "register") usernameRef.current?.focus();
      else if (mode === "login") identifierRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(t);
  }, [open, mode]);

  // Lockout countdown ticker (only when relevant)
  useEffect(() => {
    if (mode !== "login" || !identifier) {
      setLockoutSeconds(0);
      return;
    }
    const tick = () => {
      const remaining = Math.ceil(getLockoutRemaining(identifier) / 1000);
      setLockoutSeconds(remaining);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [identifier, mode]);

  const passwordChecks = useMemo(() => checkPassword(password), [password]);
  const passwordScoreVal = useMemo(() => passwordScore(password), [password]);
  const strength = useMemo(
    () => passwordStrengthLabel(passwordScoreVal),
    [passwordScoreVal],
  );

  const forgotPasswordChecks = useMemo(
    () => checkPassword(forgotNewPassword),
    [forgotNewPassword],
  );
  const forgotScore = useMemo(
    () => passwordScore(forgotNewPassword),
    [forgotNewPassword],
  );
  const forgotStrength = useMemo(
    () => passwordStrengthLabel(forgotScore),
    [forgotScore],
  );

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLock(e.getModifierState("CapsLock"));
    }
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setCapsLock(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await login({
        identifier,
        password: loginPassword,
        remember: rememberMe,
      });
      toast.success("Selamat datang!", `Halo ${session.username}, kamu sudah masuk.`);
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    setLoading(true);
    try {
      const session = await register({
        username,
        email,
        password,
        securityQuestion,
        securityAnswer,
        remember: true,
      });
      toast.success(
        "Akun berhasil dibuat",
        `Selamat bergabung, ${session.username}!`,
      );
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const info = getSecurityQuestion(forgotIdentifier);
      setForgotResolvedQuestion(info.question);
      setForgotResolvedUsername(info.username);
      setForgotStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Akun tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithSecurity({
        identifier: forgotIdentifier,
        securityAnswer: forgotAnswer,
        newPassword: forgotNewPassword,
      });
      setForgotStep(3);
      toast.success(
        "Password direset",
        "Password kamu sudah berhasil diperbarui. Silakan masuk.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset password");
    } finally {
      setLoading(false);
    }
  };

  const finishForgotFlow = () => {
    setIdentifier(forgotResolvedUsername || forgotIdentifier);
    setLoginPassword("");
    switchMode("login");
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Login atau daftar">
      <div className="px-5 pt-2 pb-6 sm:px-7 sm:pt-6 sm:pb-7">
        <Header
          mode={mode}
          forgotStep={mode === "forgot" ? forgotStep : undefined}
          onBack={
            mode === "forgot"
              ? () => {
                  if (forgotStep === 1) switchMode("login");
                  else setForgotStep((forgotStep - 1) as 1 | 2);
                  setError(null);
                }
              : undefined
          }
          onClose={onClose}
        />

        {/* Mode tabs (only for login/register) */}
        {mode !== "forgot" && (
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
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
            <Field
              label="Username atau Email"
              icon={<AtSign className="h-4 w-4" />}
              input={
                <input
                  ref={identifierRef}
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="username atau email"
                  className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                  required
                  disabled={isLocked}
                />
              }
            />

            <Field
              label="Password"
              icon={<Lock className="h-4 w-4" />}
              input={
                <input
                  type={showLoginPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={handleKeyEvent}
                  onKeyUp={handleKeyEvent}
                  placeholder="password"
                  className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                  required
                  disabled={isLocked}
                />
              }
              trailing={
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  aria-label={
                    showLoginPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  className="flex-shrink-0 rounded-md px-2 py-1 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--text))]"
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />

            {capsLock && (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">
                <AlertCircle className="h-3 w-3" />
                Caps Lock aktif
              </div>
            )}

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between gap-3 px-1">
              <label className="flex cursor-pointer select-none items-center gap-2 text-[12px] text-[rgb(var(--text-2))]">
                <span className="relative inline-flex h-4 w-4 items-center justify-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="block h-4 w-4 rounded border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/60 transition-colors peer-checked:border-indigo-500 peer-checked:bg-gradient-to-br peer-checked:from-indigo-500 peer-checked:to-purple-600" />
                  {rememberMe && (
                    <Check
                      className="pointer-events-none absolute h-3 w-3 text-white"
                      strokeWidth={3}
                    />
                  )}
                </span>
                Ingat saya
              </label>
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-[12px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Lupa password?
              </button>
            </div>

            {isLocked && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
                <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                <span className="flex-1 leading-relaxed">
                  Akun terkunci sementara karena terlalu banyak percobaan.
                  Coba lagi dalam{" "}
                  <span className="font-mono font-bold">
                    {formatDuration(lockoutSeconds)}
                  </span>
                  .
                </span>
              </div>
            )}

            {error && !isLocked && <ErrorBanner message={error} />}

            <PrimaryButton
              loading={loading}
              disabled={loading || isLocked}
              icon={<LogIn className="h-4 w-4" />}
              label="Masuk"
            />

            <p className="pt-1 text-center text-[11px] leading-relaxed text-[rgb(var(--muted))]">
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Daftar dulu
              </button>
            </p>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister} className="mt-5 space-y-3.5">
            <Field
              label="Username"
              icon={<UserIcon className="h-4 w-4" />}
              input={
                <input
                  ref={usernameRef}
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
              hint="3–24 karakter. Huruf, angka, titik, atau underscore."
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

            <Field
              label="Password"
              icon={<Lock className="h-4 w-4" />}
              input={
                <input
                  type={showRegPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyEvent}
                  onKeyUp={handleKeyEvent}
                  placeholder="minimal 8 karakter"
                  minLength={8}
                  className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                  required
                />
              }
              trailing={
                <button
                  type="button"
                  onClick={() => setShowRegPassword((v) => !v)}
                  aria-label={
                    showRegPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  className="flex-shrink-0 rounded-md px-2 py-1 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--text))]"
                >
                  {showRegPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />

            {/* Strength meter */}
            {password && (
              <div className="px-1">
                <div className="flex h-1 w-full gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-full flex-1 rounded-full transition-colors ${
                        i < passwordScoreVal
                          ? strength.color
                          : "bg-[rgb(var(--border))]"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-[rgb(var(--muted))]">
                  Kekuatan password:{" "}
                  <span className="font-medium text-[rgb(var(--text-2))]">
                    {strength.label}
                  </span>
                </p>
                <PasswordChecklist checks={passwordChecks} />
              </div>
            )}

            <Field
              label="Konfirmasi Password"
              icon={<ShieldCheck className="h-4 w-4" />}
              input={
                <input
                  type={showRegPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyEvent}
                  onKeyUp={handleKeyEvent}
                  placeholder="ulangi password"
                  minLength={8}
                  className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                  required
                />
              }
              hint={
                confirmPassword && confirmPassword !== password
                  ? "Password belum cocok"
                  : confirmPassword && confirmPassword === password
                    ? "Cocok!"
                    : undefined
              }
              hintTone={
                confirmPassword && confirmPassword !== password
                  ? "warn"
                  : confirmPassword && confirmPassword === password
                    ? "ok"
                    : "muted"
              }
            />

            {capsLock && (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">
                <AlertCircle className="h-3 w-3" />
                Caps Lock aktif
              </div>
            )}

            {/* Security question */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/30 p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                Pertanyaan keamanan
              </div>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/60 px-3 py-2.5 text-sm text-[rgb(var(--text))] focus:border-indigo-400/60 focus:outline-none"
              >
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Jawaban kamu (case-insensitive)"
                className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/60 px-3 py-2.5 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:border-indigo-400/60 focus:outline-none"
                required
                minLength={2}
              />
              <p className="mt-1.5 text-[11px] leading-snug text-[rgb(var(--muted))]">
                Dipakai untuk reset password jika kamu lupa.
              </p>
            </div>

            {error && <ErrorBanner message={error} />}

            <PrimaryButton
              loading={loading}
              disabled={loading}
              icon={<UserPlus className="h-4 w-4" />}
              label="Daftar Sekarang"
            />

            <p className="pt-1 text-center text-[11px] leading-relaxed text-[rgb(var(--muted))]">
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Masuk
              </button>
            </p>

            <p className="text-center text-[10px] leading-snug text-[rgb(var(--muted))]/70">
              Akun disimpan di browser ini saja. Tidak ada data yang dikirim
              ke server.
            </p>
          </form>
        )}

        {mode === "forgot" && forgotStep === 1 && (
          <form onSubmit={handleForgotStep1} className="mt-5 space-y-3.5">
            <Field
              label="Username atau Email"
              icon={<AtSign className="h-4 w-4" />}
              input={
                <input
                  type="text"
                  autoComplete="username"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="masukkan username atau email"
                  className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                  required
                />
              }
              hint="Kami akan menampilkan pertanyaan keamananmu."
            />

            {error && <ErrorBanner message={error} />}

            <PrimaryButton
              loading={loading}
              disabled={loading}
              icon={<KeyRound className="h-4 w-4" />}
              label="Lanjut"
            />

            <p className="pt-1 text-center text-[11px] leading-relaxed text-[rgb(var(--muted))]">
              Ingat passwordmu?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Kembali ke login
              </button>
            </p>
          </form>
        )}

        {mode === "forgot" && forgotStep === 2 && (
          <form onSubmit={handleForgotStep2} className="mt-5 space-y-3.5">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/30 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                Pertanyaan keamanan untuk{" "}
                <span className="text-[rgb(var(--text-2))]">
                  {forgotResolvedUsername}
                </span>
              </div>
              <div className="mt-1 text-sm font-medium text-[rgb(var(--text))]">
                {forgotResolvedQuestion}
              </div>
            </div>

            <Field
              label="Jawabanmu"
              icon={<HelpCircle className="h-4 w-4" />}
              input={
                <input
                  type="text"
                  value={forgotAnswer}
                  onChange={(e) => setForgotAnswer(e.target.value)}
                  placeholder="jawaban (case-insensitive)"
                  className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                  required
                  minLength={2}
                />
              }
            />

            <Field
              label="Password Baru"
              icon={<Lock className="h-4 w-4" />}
              input={
                <input
                  type={showForgotPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  onKeyDown={handleKeyEvent}
                  onKeyUp={handleKeyEvent}
                  placeholder="minimal 8 karakter"
                  minLength={8}
                  className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                  required
                />
              }
              trailing={
                <button
                  type="button"
                  onClick={() => setShowForgotPassword((v) => !v)}
                  aria-label={
                    showForgotPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  className="flex-shrink-0 rounded-md px-2 py-1 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--text))]"
                >
                  {showForgotPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />

            {forgotNewPassword && (
              <div className="px-1">
                <div className="flex h-1 w-full gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-full flex-1 rounded-full transition-colors ${
                        i < forgotScore
                          ? forgotStrength.color
                          : "bg-[rgb(var(--border))]"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-[rgb(var(--muted))]">
                  Kekuatan password:{" "}
                  <span className="font-medium text-[rgb(var(--text-2))]">
                    {forgotStrength.label}
                  </span>
                </p>
                <PasswordChecklist checks={forgotPasswordChecks} />
              </div>
            )}

            <Field
              label="Konfirmasi Password Baru"
              icon={<ShieldCheck className="h-4 w-4" />}
              input={
                <input
                  type={showForgotPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="ulangi password"
                  minLength={8}
                  className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                  required
                />
              }
              hint={
                forgotConfirmPassword &&
                forgotConfirmPassword !== forgotNewPassword
                  ? "Password belum cocok"
                  : forgotConfirmPassword &&
                      forgotConfirmPassword === forgotNewPassword
                    ? "Cocok!"
                    : undefined
              }
              hintTone={
                forgotConfirmPassword &&
                forgotConfirmPassword !== forgotNewPassword
                  ? "warn"
                  : forgotConfirmPassword &&
                      forgotConfirmPassword === forgotNewPassword
                    ? "ok"
                    : "muted"
              }
            />

            {error && <ErrorBanner message={error} />}

            <PrimaryButton
              loading={loading}
              disabled={loading}
              icon={<KeyRound className="h-4 w-4" />}
              label="Reset Password"
            />
          </form>
        )}

        {mode === "forgot" && forgotStep === 3 && (
          <div className="mt-6 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <div className="text-base font-bold text-[rgb(var(--text))]">
                Password berhasil direset
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--text-2))]">
                Sekarang masuk pakai password baru kamu.
              </p>
            </div>
            <button
              type="button"
              onClick={finishForgotFlow}
              className="touch-target flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-[0.99]"
            >
              <LogIn className="h-4 w-4" />
              Lanjut ke Login
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function Header(props: {
  mode: Mode;
  forgotStep?: 1 | 2 | 3;
  onBack?: () => void;
  onClose: () => void;
}) {
  const titles = useMemo(() => {
    if (props.mode === "login") {
      return {
        title: "Selamat datang kembali",
        sub: "Masuk untuk simpan riwayat & pengaturan",
      };
    }
    if (props.mode === "register") {
      return {
        title: "Buat akun baru",
        sub: "Cuma butuh 30 detik. Aman, tanpa server.",
      };
    }
    if (props.forgotStep === 3) {
      return {
        title: "Selesai!",
        sub: "Passwordmu sudah diperbarui.",
      };
    }
    return {
      title: "Lupa password?",
      sub: `Langkah ${props.forgotStep ?? 1} dari 2 — pakai pertanyaan keamanan.`,
    };
  }, [props.mode, props.forgotStep]);

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {props.onBack ? (
          <button
            type="button"
            onClick={props.onBack}
            aria-label="Kembali"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 text-[rgb(var(--text-2))] transition-colors hover:border-indigo-400/40 hover:text-[rgb(var(--text))]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5 text-white" strokeWidth={2.4} />
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold leading-tight text-[rgb(var(--text))] sm:text-xl">
            {titles.title}
          </h2>
          <p className="mt-0.5 text-[12px] leading-snug text-[rgb(var(--muted))]">
            {titles.sub}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={props.onClose}
        aria-label="Tutup"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[rgb(var(--muted))] transition-colors hover:bg-[rgb(var(--bg-2))]/60 hover:text-[rgb(var(--text))]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function Field(props: {
  label: string;
  icon: React.ReactNode;
  input: React.ReactNode;
  trailing?: React.ReactNode;
  hint?: string;
  hintTone?: "ok" | "warn" | "muted";
}) {
  const tone =
    props.hintTone === "ok"
      ? "text-emerald-400"
      : props.hintTone === "warn"
        ? "text-amber-400"
        : "text-[rgb(var(--muted))]";
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
        {props.label}
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-3 transition-colors focus-within:border-indigo-400/60">
        <span className="flex-shrink-0 text-[rgb(var(--muted))]">
          {props.icon}
        </span>
        {props.input}
        {props.trailing}
      </div>
      {props.hint && (
        <p className={`mt-1 px-1 text-[11px] leading-snug ${tone}`}>
          {props.hint}
        </p>
      )}
    </div>
  );
}

function PasswordChecklist({
  checks,
}: {
  checks: ReturnType<typeof checkPassword>;
}) {
  const items: Array<{ label: string; ok: boolean }> = [
    { label: "Minimal 8 karakter", ok: checks.length },
    { label: "Huruf besar & kecil", ok: checks.upperLower },
    { label: "Mengandung angka", ok: checks.number },
    { label: "Simbol (opsional)", ok: checks.symbol },
  ];
  return (
    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
      {items.map((it) => (
        <li
          key={it.label}
          className={`flex items-center gap-1.5 text-[11px] ${
            it.ok ? "text-emerald-400" : "text-[rgb(var(--muted))]"
          }`}
        >
          {it.ok ? (
            <Check className="h-3 w-3" strokeWidth={3} />
          ) : (
            <span className="block h-2.5 w-2.5 rounded-full border border-[rgb(var(--border))]" />
          )}
          {it.label}
        </li>
      ))}
    </ul>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
      <span className="flex-1 leading-relaxed">{message}</span>
    </div>
  );
}

function PrimaryButton(props: {
  loading: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={props.disabled}
      className="touch-target flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {props.loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Memproses...
        </>
      ) : (
        <>
          {props.icon}
          {props.label}
        </>
      )}
    </button>
  );
}
