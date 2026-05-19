import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  AtSign,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Palette,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import {
  AVATAR_GRADIENTS,
  changePassword,
  checkPassword,
  deleteAccount,
  getUserById,
  getUserInitials,
  passwordScore,
  passwordStrengthLabel,
  updateProfile,
  type Session,
} from "../lib/auth";
import { toast } from "../lib/toast";

type Tab = "profile" | "security" | "danger";

type Props = {
  open: boolean;
  session: Session;
  onClose: () => void;
  onSessionUpdate: (session: Session) => void;
  onAccountDeleted: () => void;
};

export function ProfileSheet({
  open,
  session,
  onClose,
  onSessionUpdate,
  onAccountDeleted,
}: Props) {
  const [tab, setTab] = useState<Tab>("profile");

  // Profile form state
  const [username, setUsername] = useState(session.username);
  const [email, setEmail] = useState(session.email);
  const [avatarColor, setAvatarColor] = useState(session.avatarColor);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reset whenever the sheet opens or the session changes (e.g. user updated)
  useEffect(() => {
    if (!open) return;
    setTab("profile");
    setUsername(session.username);
    setEmail(session.email);
    setAvatarColor(session.avatarColor);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowPasswords(false);
    setProfileError(null);
    setPasswordError(null);
    setDeletePassword("");
    setDeleteConfirm("");
    setShowDeletePassword(false);
    setDeleteError(null);
  }, [open, session]);

  const fullUser = useMemo(
    () => (open ? getUserById(session.userId) : null),
    [open, session.userId],
  );

  const passwordChecks = useMemo(
    () => checkPassword(newPassword),
    [newPassword],
  );
  const newScore = useMemo(() => passwordScore(newPassword), [newPassword]);
  const strength = useMemo(
    () => passwordStrengthLabel(newScore),
    [newScore],
  );

  const profileDirty =
    username.trim() !== session.username ||
    email.trim().toLowerCase() !== session.email.toLowerCase() ||
    avatarColor !== session.avatarColor;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setSavingProfile(true);
    try {
      const updated = updateProfile(session.userId, {
        username,
        email,
        avatarColor,
      });
      onSessionUpdate(updated);
      toast.success("Profil diperbarui", "Perubahanmu sudah tersimpan.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Gagal memperbarui profil",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Konfirmasi password tidak cocok");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(session.userId, {
        current: currentPassword,
        next: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success(
        "Password diganti",
        "Login berikutnya pakai password baru ya.",
      );
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Gagal mengganti password",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    if (deleteConfirm !== session.username) {
      setDeleteError(`Ketik "${session.username}" untuk konfirmasi`);
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(session.userId, deletePassword);
      toast.info(
        "Akun dihapus",
        "Semua data akun ini sudah dibersihkan dari browser.",
      );
      onAccountDeleted();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Gagal menghapus akun",
      );
    } finally {
      setDeleting(false);
    }
  };

  const initials = getUserInitials(session.username);
  const memberSince = new Date(session.createdAt);
  const lastLogin = fullUser?.lastLoginAt
    ? new Date(fullUser.lastLoginAt)
    : null;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Profil & keamanan"
      maxWidth="sm:max-w-lg"
    >
      {/* Header */}
      <div className="border-b border-[rgb(var(--border))] px-5 pt-2 pb-4 sm:px-6 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarColor} text-sm font-bold text-white shadow-md shadow-black/30`}
            >
              {initials}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-[rgb(var(--text))]">
                {session.username}
              </h2>
              <p className="mt-0.5 truncate text-[12px] text-[rgb(var(--muted))]">
                {session.email}
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

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Bergabung"
            value={memberSince.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
          <Stat
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Total Login"
            value={`${fullUser?.loginCount ?? session.loginCount}×`}
          />
          <Stat
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Login terakhir"
            value={
              lastLogin
                ? lastLogin.toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"
            }
          />
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Bagian akun"
          className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/50 p-1"
        >
          {(
            [
              { id: "profile", label: "Profil" },
              { id: "security", label: "Keamanan" },
              { id: "danger", label: "Bahaya" },
            ] as Array<{ id: Tab; label: string }>
          ).map(({ id, label }) => {
            const active = tab === id;
            const isDanger = id === "danger";
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setTab(id)}
                className={`relative flex h-9 items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition-all ${
                  active
                    ? isDanger
                      ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                    : isDanger
                      ? "text-red-300 hover:text-red-200"
                      : "text-[rgb(var(--text-2))] hover:text-[rgb(var(--text))]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-4 p-5 sm:p-6">
          <Field
            label="Username"
            icon={<UserIcon className="h-4 w-4" />}
            input={
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                required
              />
            }
          />

          <div>
            <label className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
              <Palette className="h-3.5 w-3.5" />
              Warna avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_GRADIENTS.map((g) => {
                const selected = g === avatarColor;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setAvatarColor(g)}
                    aria-pressed={selected}
                    aria-label={`Pilih warna avatar ${g}`}
                    className={`relative flex h-12 items-center justify-center rounded-xl bg-gradient-to-br ${g} text-white shadow-md shadow-black/20 transition-transform hover:scale-105 active:scale-95 ${
                      selected
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[rgb(var(--bg))]"
                        : ""
                    }`}
                  >
                    {selected && <Check className="h-4 w-4" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {profileError && <ErrorBanner message={profileError} />}

          <button
            type="submit"
            disabled={savingProfile || !profileDirty}
            className="touch-target flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {savingProfile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan perubahan
              </>
            )}
          </button>
        </form>
      )}

      {tab === "security" && (
        <form
          onSubmit={handleChangePassword}
          className="space-y-4 p-5 sm:p-6"
        >
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-[12px] leading-relaxed text-indigo-200/90">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-indigo-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Tips keamanan
            </div>
            Pakai password unik untuk akun ini, kombinasikan huruf besar, kecil,
            angka, dan simbol. Minimal 8 karakter.
          </div>

          <Field
            label="Password sekarang"
            icon={<Lock className="h-4 w-4" />}
            input={
              <input
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="password lama"
                className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                required
              />
            }
            trailing={
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                aria-label={
                  showPasswords ? "Sembunyikan password" : "Tampilkan password"
                }
                className="flex-shrink-0 rounded-md px-2 py-1 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--text))]"
              >
                {showPasswords ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />

          <Field
            label="Password baru"
            icon={<Lock className="h-4 w-4" />}
            input={
              <input
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="minimal 8 karakter"
                minLength={8}
                className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                required
              />
            }
          />

          {newPassword && (
            <div className="px-1">
              <div className="flex h-1 w-full gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-full flex-1 rounded-full transition-colors ${
                      i < newScore
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
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                {[
                  { label: "Minimal 8 karakter", ok: passwordChecks.length },
                  { label: "Huruf besar & kecil", ok: passwordChecks.upperLower },
                  { label: "Mengandung angka", ok: passwordChecks.number },
                  { label: "Simbol (opsional)", ok: passwordChecks.symbol },
                ].map((it) => (
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
            </div>
          )}

          <Field
            label="Konfirmasi password baru"
            icon={<ShieldCheck className="h-4 w-4" />}
            input={
              <input
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="ulangi password baru"
                minLength={8}
                className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                required
              />
            }
            hint={
              confirmNewPassword && confirmNewPassword !== newPassword
                ? "Password belum cocok"
                : confirmNewPassword && confirmNewPassword === newPassword
                  ? "Cocok!"
                  : undefined
            }
            hintTone={
              confirmNewPassword && confirmNewPassword !== newPassword
                ? "warn"
                : confirmNewPassword && confirmNewPassword === newPassword
                  ? "ok"
                  : "muted"
            }
          />

          {passwordError && <ErrorBanner message={passwordError} />}

          <button
            type="submit"
            disabled={savingPassword}
            className="touch-target flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengganti...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Ganti password
              </>
            )}
          </button>
        </form>
      )}

      {tab === "danger" && (
        <form onSubmit={handleDelete} className="space-y-4 p-5 sm:p-6">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-red-300">
              <ShieldAlert className="h-4 w-4" />
              Hapus akun
            </div>
            <p className="text-[12px] leading-relaxed text-red-200/80">
              Tindakan ini permanen. Semua data akunmu di browser ini akan
              dihapus. Riwayat download tidak ikut terhapus.
            </p>
          </div>

          <Field
            label="Password"
            icon={<Lock className="h-4 w-4" />}
            input={
              <input
                type={showDeletePassword ? "text" : "password"}
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="masukkan password"
                className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                required
              />
            }
            trailing={
              <button
                type="button"
                onClick={() => setShowDeletePassword((v) => !v)}
                aria-label={
                  showDeletePassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
                className="flex-shrink-0 rounded-md px-2 py-1 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--text))]"
              >
                {showDeletePassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />

          <Field
            label={`Ketik "${session.username}" untuk konfirmasi`}
            icon={<AtSign className="h-4 w-4" />}
            input={
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={session.username}
                className="w-full bg-transparent py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:outline-none"
                required
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            }
          />

          {deleteError && <ErrorBanner message={deleteError} />}

          <button
            type="submit"
            disabled={
              deleting ||
              deleteConfirm !== session.username ||
              !deletePassword
            }
            className="touch-target flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Hapus akun selamanya
              </>
            )}
          </button>
        </form>
      )}
    </BottomSheet>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-2))]/40 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[rgb(var(--muted))]">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 truncate text-[12px] font-semibold text-[rgb(var(--text))]">
        {value}
      </div>
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200"
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
      <span className="flex-1 leading-relaxed">{message}</span>
    </div>
  );
}
