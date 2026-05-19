// Local-only "demo" auth backed by localStorage / sessionStorage.
//
// Security model (best-effort for a static, no-backend SPA):
//  - Passwords hashed with PBKDF2-SHA-256, 100k iterations, per-user random salt
//  - Security question + answer (also PBKDF2-hashed) for offline password reset
//  - Login rate-limit & lockout after too many failed attempts
//  - Sessions can be persistent ("remember me" → localStorage) or
//    transient (sessionStorage, lasts only as long as the tab)
//  - Account profile, password change, and account deletion APIs
//
// This is NOT a substitute for real server-side authentication, but it is a
// significantly more careful local-only auth flow than a single SHA-256.

export type StoredUser = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  securityQuestion: string;
  securityAnswerHash: string;
  securityAnswerSalt: string;
  avatarColor: string;
  createdAt: number;
  lastLoginAt?: number;
  loginCount: number;
};

export type Session = {
  userId: string;
  username: string;
  email: string;
  avatarColor: string;
  createdAt: number;
  loggedInAt: number;
  loginCount: number;
  remember: boolean;
};

const USERS_KEY = "dmaz_users_v2";
const SESSION_KEY = "dmaz_session_v2";
const ATTEMPTS_KEY = "dmaz_login_attempts_v2";

export const SECURITY_QUESTIONS: ReadonlyArray<string> = [
  "Nama hewan peliharaan pertamamu?",
  "Nama panggilan masa kecilmu?",
  "Kota tempat kamu dilahirkan?",
  "Makanan favoritmu sewaktu kecil?",
  "Nama sekolah dasarmu?",
  "Nama guru favoritmu?",
];

export const AVATAR_GRADIENTS: ReadonlyArray<string> = [
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-cyan-400 via-blue-500 to-indigo-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-rose-500 via-pink-500 to-fuchsia-500",
  "from-amber-400 via-orange-500 to-red-500",
  "from-violet-500 via-purple-600 to-indigo-600",
  "from-lime-400 via-green-500 to-emerald-600",
  "from-sky-400 via-blue-500 to-violet-600",
];

const PBKDF2_ITERATIONS = 100_000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes after too many failures

// ---------------------------------------------------------------------------
// Hashing utilities (PBKDF2-SHA-256 with random salt)
// ---------------------------------------------------------------------------

function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function makeSalt(byteLength = 16): string {
  const arr = new Uint8Array(byteLength);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

async function pbkdf2(secret: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const salt = hexToBytes(saltHex);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
      salt,
    },
    baseKey,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

// Compare two hex strings in (mostly) constant time. Best-effort in JS.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function persistSession(session: Session) {
  const payload = JSON.stringify(session);
  if (session.remember) {
    localStorage.setItem(SESSION_KEY, payload);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, payload);
    localStorage.removeItem(SESSION_KEY);
  }
}

function makeSession(user: StoredUser, remember: boolean): Session {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
    loggedInAt: Date.now(),
    loginCount: user.loginCount,
    remember,
  };
}

export function getSession(): Session | null {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ||
      sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.userId) return null;
    // Validate that the user still exists (e.g. account was deleted on
    // another tab).
    const user = readUsers().find((u) => u.id === parsed.userId);
    if (!user) {
      logout();
      return null;
    }
    // Refresh denormalised fields in case they changed elsewhere.
    return {
      ...parsed,
      username: user.username,
      email: user.email,
      avatarColor: user.avatarColor,
    };
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export type PasswordCheck = {
  length: boolean;
  upperLower: boolean;
  number: boolean;
  symbol: boolean;
};

export function checkPassword(password: string): PasswordCheck {
  return {
    length: password.length >= 8,
    upperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function passwordScore(password: string): number {
  if (!password) return 0;
  const c = checkPassword(password);
  let score = 0;
  if (password.length >= 6) score++;
  if (c.length) score++;
  if (c.upperLower) score++;
  if (c.number) score++;
  if (c.symbol) score++;
  if (password.length >= 14) score++;
  return Math.min(score, 5);
}

export function passwordStrengthLabel(score: number): {
  label: string;
  color: string;
} {
  switch (score) {
    case 0:
    case 1:
      return { label: "Lemah", color: "bg-red-500" };
    case 2:
      return { label: "Lumayan", color: "bg-amber-500" };
    case 3:
      return { label: "Cukup", color: "bg-yellow-500" };
    case 4:
      return { label: "Kuat", color: "bg-emerald-500" };
    default:
      return { label: "Sangat kuat", color: "bg-emerald-400" };
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "owner",
  "system",
  "support",
  "moderator",
  "kiro",
  "dmazalyxers",
]);

function validateUsername(username: string) {
  if (username.length < 3) throw new Error("Username minimal 3 karakter");
  if (username.length > 24) throw new Error("Username maksimal 24 karakter");
  if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    throw new Error("Username hanya boleh huruf, angka, titik, atau underscore");
  }
  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    throw new Error("Username ini tidak diperbolehkan");
  }
}

function validatePasswordForRegister(password: string) {
  if (password.length < 8) {
    throw new Error("Password minimal 8 karakter");
  }
  if (passwordScore(password) < 2) {
    throw new Error("Password terlalu lemah, kombinasikan huruf & angka");
  }
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function pickAvatarColor(seed: number): string {
  const idx =
    ((seed % AVATAR_GRADIENTS.length) + AVATAR_GRADIENTS.length) %
    AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

// ---------------------------------------------------------------------------
// Login attempt tracking / lockout
// ---------------------------------------------------------------------------

type AttemptMap = Record<string, { count: number; lockUntil?: number }>;

function readAttempts(): AttemptMap {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as AttemptMap) : {};
  } catch {
    return {};
  }
}

function writeAttempts(map: AttemptMap) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(map));
}

function attemptKey(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export function getLockoutRemaining(identifier: string): number {
  const map = readAttempts();
  const e = map[attemptKey(identifier)];
  if (!e?.lockUntil) return 0;
  return Math.max(0, e.lockUntil - Date.now());
}

function recordFailure(identifier: string) {
  const map = readAttempts();
  const k = attemptKey(identifier);
  const cur = map[k] ?? { count: 0 };
  cur.count = (cur.count ?? 0) + 1;
  if (cur.count >= MAX_LOGIN_ATTEMPTS) {
    cur.lockUntil = Date.now() + LOCKOUT_MS;
    cur.count = 0;
  }
  map[k] = cur;
  writeAttempts(map);
}

function clearAttempts(identifier: string) {
  const map = readAttempts();
  delete map[attemptKey(identifier)];
  writeAttempts(map);
}

// ---------------------------------------------------------------------------
// Public API: register, login, recover, profile mgmt
// ---------------------------------------------------------------------------

export async function register(input: {
  username: string;
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
  remember?: boolean;
}): Promise<Session> {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const securityQuestion = input.securityQuestion.trim();
  const securityAnswer = input.securityAnswer.trim();
  const remember = input.remember ?? true;

  validateUsername(username);
  if (!isValidEmail(email)) throw new Error("Format email tidak valid");
  validatePasswordForRegister(password);
  if (!securityQuestion) throw new Error("Pilih pertanyaan keamanan");
  if (securityAnswer.length < 2) {
    throw new Error("Jawaban keamanan minimal 2 karakter");
  }

  const users = readUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username sudah dipakai");
  }
  if (users.some((u) => u.email.toLowerCase() === email)) {
    throw new Error("Email sudah terdaftar");
  }

  const passwordSalt = makeSalt();
  const passwordHash = await pbkdf2(password, passwordSalt);
  const securityAnswerSalt = makeSalt();
  const securityAnswerHash = await pbkdf2(
    securityAnswer.toLowerCase(),
    securityAnswerSalt,
  );

  const newUser: StoredUser = {
    id: genId(),
    username,
    email,
    passwordHash,
    passwordSalt,
    securityQuestion,
    securityAnswerHash,
    securityAnswerSalt,
    avatarColor: pickAvatarColor(users.length),
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    loginCount: 1,
  };
  users.push(newUser);
  writeUsers(users);

  const session = makeSession(newUser, remember);
  persistSession(session);
  return session;
}

export async function login(input: {
  identifier: string;
  password: string;
  remember?: boolean;
}): Promise<Session> {
  const identifierRaw = input.identifier.trim();
  const identifier = identifierRaw.toLowerCase();
  const password = input.password;
  const remember = input.remember ?? false;

  if (!identifier) throw new Error("Masukkan username atau email");
  if (!password) throw new Error("Masukkan password");

  const lockoutRemaining = getLockoutRemaining(identifier);
  if (lockoutRemaining > 0) {
    const seconds = Math.ceil(lockoutRemaining / 1000);
    throw new Error(
      `Terlalu banyak percobaan. Coba lagi dalam ${formatDuration(seconds)}.`,
    );
  }

  const users = readUsers();
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === identifier ||
      u.email.toLowerCase() === identifier,
  );
  if (!user) {
    recordFailure(identifier);
    throw new Error("Username/email atau password salah");
  }

  const candidate = await pbkdf2(password, user.passwordSalt);
  if (!timingSafeEqual(candidate, user.passwordHash)) {
    recordFailure(identifier);
    const remainingAttempts = MAX_LOGIN_ATTEMPTS - (readAttempts()[identifier]?.count ?? 0);
    if (remainingAttempts > 0 && remainingAttempts <= 2) {
      throw new Error(
        `Username/email atau password salah. Sisa ${remainingAttempts} percobaan.`,
      );
    }
    throw new Error("Username/email atau password salah");
  }

  // Successful login: clear failures, bump stats
  clearAttempts(identifier);
  user.lastLoginAt = Date.now();
  user.loginCount = (user.loginCount ?? 0) + 1;
  writeUsers(users);

  const session = makeSession(user, remember);
  persistSession(session);
  return session;
}

// Step 1: look up the user's security question by identifier.
export function getSecurityQuestion(identifier: string): {
  username: string;
  question: string;
} {
  const id = identifier.trim().toLowerCase();
  if (!id) throw new Error("Masukkan username atau email");
  const users = readUsers();
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === id || u.email.toLowerCase() === id,
  );
  if (!user) throw new Error("Akun tidak ditemukan");
  return { username: user.username, question: user.securityQuestion };
}

// Step 2: reset password by answering the security question correctly.
export async function resetPasswordWithSecurity(input: {
  identifier: string;
  securityAnswer: string;
  newPassword: string;
}): Promise<void> {
  const id = input.identifier.trim().toLowerCase();
  const users = readUsers();
  const idx = users.findIndex(
    (u) =>
      u.username.toLowerCase() === id || u.email.toLowerCase() === id,
  );
  if (idx === -1) throw new Error("Akun tidak ditemukan");
  const user = users[idx];

  const candidate = await pbkdf2(
    input.securityAnswer.trim().toLowerCase(),
    user.securityAnswerSalt,
  );
  if (!timingSafeEqual(candidate, user.securityAnswerHash)) {
    recordFailure(id);
    throw new Error("Jawaban keamanan salah");
  }

  validatePasswordForRegister(input.newPassword);
  const newSalt = makeSalt();
  const newHash = await pbkdf2(input.newPassword, newSalt);
  user.passwordSalt = newSalt;
  user.passwordHash = newHash;
  users[idx] = user;
  writeUsers(users);
  clearAttempts(id);
}

export type ProfileUpdate = {
  username?: string;
  email?: string;
  avatarColor?: string;
};

export function updateProfile(userId: string, patch: ProfileUpdate): Session {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("Akun tidak ditemukan");
  const user = users[idx];

  if (patch.username !== undefined) {
    const next = patch.username.trim();
    if (next.toLowerCase() !== user.username.toLowerCase()) {
      validateUsername(next);
      if (
        users.some(
          (u) =>
            u.id !== userId &&
            u.username.toLowerCase() === next.toLowerCase(),
        )
      ) {
        throw new Error("Username sudah dipakai");
      }
    }
    user.username = next;
  }

  if (patch.email !== undefined) {
    const next = patch.email.trim().toLowerCase();
    if (next !== user.email.toLowerCase()) {
      if (!isValidEmail(next)) throw new Error("Format email tidak valid");
      if (
        users.some(
          (u) => u.id !== userId && u.email.toLowerCase() === next,
        )
      ) {
        throw new Error("Email sudah terdaftar");
      }
    }
    user.email = next;
  }

  if (patch.avatarColor !== undefined) {
    if (!AVATAR_GRADIENTS.includes(patch.avatarColor)) {
      throw new Error("Warna avatar tidak valid");
    }
    user.avatarColor = patch.avatarColor;
  }

  users[idx] = user;
  writeUsers(users);

  const session = getSession();
  if (!session || session.userId !== userId) {
    throw new Error("Sesi tidak aktif");
  }
  const next: Session = {
    ...session,
    username: user.username,
    email: user.email,
    avatarColor: user.avatarColor,
  };
  persistSession(next);
  return next;
}

export async function changePassword(
  userId: string,
  input: { current: string; next: string },
): Promise<void> {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("Akun tidak ditemukan");
  const user = users[idx];

  const candidate = await pbkdf2(input.current, user.passwordSalt);
  if (!timingSafeEqual(candidate, user.passwordHash)) {
    throw new Error("Password sekarang salah");
  }
  if (input.next === input.current) {
    throw new Error("Password baru harus berbeda dengan yang lama");
  }
  validatePasswordForRegister(input.next);
  const newSalt = makeSalt();
  const newHash = await pbkdf2(input.next, newSalt);
  user.passwordSalt = newSalt;
  user.passwordHash = newHash;
  users[idx] = user;
  writeUsers(users);
}

export async function deleteAccount(
  userId: string,
  password: string,
): Promise<void> {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("Akun tidak ditemukan");
  const user = users[idx];

  const candidate = await pbkdf2(password, user.passwordSalt);
  if (!timingSafeEqual(candidate, user.passwordHash)) {
    throw new Error("Password salah");
  }
  users.splice(idx, 1);
  writeUsers(users);
  logout();
}

export function getUserById(userId: string): StoredUser | null {
  return readUsers().find((u) => u.id === userId) ?? null;
}

export function getUserInitials(username: string): string {
  if (!username) return "?";
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return username.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function userCount(): number {
  return readUsers().length;
}

// Format seconds as "MM:SS" or "Ns".
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 detik";
  if (totalSeconds < 60) return `${totalSeconds} detik`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}d`;
}
