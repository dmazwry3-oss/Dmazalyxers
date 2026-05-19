// Local-only "demo" auth backed by localStorage.
// Passwords are hashed with SHA-256 + a simple app-level salt before storage.
// This is NOT a substitute for real server-side authentication, but it gives
// the UI a sensible login/register flow without needing a backend.

export type StoredUser = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarColor: string;
  createdAt: number;
};

export type Session = {
  userId: string;
  username: string;
  email: string;
  avatarColor: string;
  loggedInAt: number;
};

const USERS_KEY = "dmaz_users_v1";
const SESSION_KEY = "dmaz_session_v1";
const SALT = "dmaz-static-salt-2026";

const AVATAR_GRADIENTS = [
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-cyan-400 via-blue-500 to-indigo-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-rose-500 via-pink-500 to-fuchsia-500",
  "from-amber-400 via-orange-500 to-red-500",
  "from-violet-500 via-purple-600 to-indigo-600",
  "from-lime-400 via-green-500 to-emerald-600",
  "from-sky-400 via-blue-500 to-violet-600",
];

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}:${password}`);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

function makeSession(user: StoredUser): Session {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    avatarColor: user.avatarColor,
    loggedInAt: Date.now(),
  };
}

function persistSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

function pickAvatarColor(seed: number): string {
  const idx = ((seed % AVATAR_GRADIENTS.length) + AVATAR_GRADIENTS.length) %
    AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function register(input: {
  username: string;
  email: string;
  password: string;
}): Promise<Session> {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (username.length < 3) {
    throw new Error("Username minimal 3 karakter");
  }
  if (username.length > 24) {
    throw new Error("Username maksimal 24 karakter");
  }
  if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    throw new Error("Username hanya boleh huruf, angka, titik, atau underscore");
  }
  if (!isValidEmail(email)) {
    throw new Error("Format email tidak valid");
  }
  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter");
  }

  const users = readUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username sudah dipakai");
  }
  if (users.some((u) => u.email.toLowerCase() === email)) {
    throw new Error("Email sudah terdaftar");
  }

  const passwordHash = await hashPassword(password);
  const newUser: StoredUser = {
    id: genId(),
    username,
    email,
    passwordHash,
    avatarColor: pickAvatarColor(users.length),
    createdAt: Date.now(),
  };

  users.push(newUser);
  writeUsers(users);

  const session = makeSession(newUser);
  persistSession(session);
  return session;
}

export async function login(input: {
  identifier: string;
  password: string;
}): Promise<Session> {
  const identifier = input.identifier.trim().toLowerCase();
  const password = input.password;

  if (!identifier) throw new Error("Masukkan username atau email");
  if (!password) throw new Error("Masukkan password");

  const users = readUsers();
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === identifier ||
      u.email.toLowerCase() === identifier,
  );
  if (!user) {
    throw new Error("Akun tidak ditemukan");
  }

  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    throw new Error("Password salah");
  }

  const session = makeSession(user);
  persistSession(session);
  return session;
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
