// Edge-runtime safe auth helpers. Uses Web Crypto API only — no Node imports.
// Used by middleware (Edge runtime) and shared by Node-side code.

const SESSION_DAYS = 14;
export const SESSION_COOKIE = "li_session";
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

export type Role = "admin" | "rep";

export type Session = {
  role: Role;
  /** "_" for admin, repId UUID for rep */
  subject: string;
};

function getSecret(): string {
  return (
    process.env.DASHBOARD_SESSION_SECRET ||
    process.env.DASHBOARD_PASSWORD ||
    "dev-insecure-secret-change-me"
  );
}

const encoder = new TextEncoder();

async function hmacSha256(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bufToHex(new Uint8Array(sig));
}

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufToB64Url(buf: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlToBuf(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// ---------- Session tokens ----------
//
// v2 format:
//   v2.{role}.{subject}.{expires}.{sig}
//   role     = "admin" | "rep"
//   subject  = "_" for admin, UUID for rep (UUIDs contain hyphens, never dots)
//   expires  = milliseconds-since-epoch as decimal string
//   sig      = hex HMAC-SHA256 over `v2.{role}.{subject}.{expires}` using the secret
//
// Legacy v1 (admin only) is still accepted for graceful upgrade.

export async function createSession(role: Role, subject: string): Promise<string> {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `v2.${role}.${subject}.${expires}`;
  const sig = await hmacSha256(getSecret(), payload);
  return `${payload}.${sig}`;
}

export async function createAdminSession(): Promise<string> {
  return createSession("admin", "_");
}

export async function createRepSession(repId: string): Promise<string> {
  return createSession("rep", repId);
}

/** Legacy alias retained so existing imports don't break. */
export const createSessionToken = createAdminSession;

export async function readSession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length === 5 && parts[0] === "v2") {
    const [, role, subject, expiresStr, sig] = parts;
    if (role !== "admin" && role !== "rep") return null;
    const expires = Number(expiresStr);
    if (!Number.isFinite(expires) || expires < Date.now()) return null;
    const expected = await hmacSha256(getSecret(), `v2.${role}.${subject}.${expiresStr}`);
    if (!timingSafeEqualHex(sig, expected)) return null;
    return { role: role as Role, subject };
  }
  // legacy v1 — admin only
  if (parts.length === 3 && parts[0] === "v1") {
    const [version, expiresStr, sig] = parts;
    const expires = Number(expiresStr);
    if (!Number.isFinite(expires) || expires < Date.now()) return null;
    const expected = await hmacSha256(getSecret(), `${version}.${expiresStr}`);
    if (!timingSafeEqualHex(sig, expected)) return null;
    return { role: "admin", subject: "_" };
  }
  return null;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  return (await readSession(token)) !== null;
}

// ---------- Admin password (env-based) ----------

export function checkAdminPassword(submitted: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected || submitted.length === 0) return false;
  if (submitted.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < submitted.length; i++) {
    mismatch |= submitted.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Legacy alias retained so existing imports don't break. */
export const checkPassword = checkAdminPassword;

// ---------- Rep password hashing (PBKDF2 via Web Crypto) ----------
//
// Stored format: `pbkdf2$100000$saltB64Url$hashB64Url`
// - PBKDF2-HMAC-SHA256
// - 100k iterations (good balance for sub-100ms verify)
// - 16-byte random salt, 32-byte derived key

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LEN_BITS = 256;
const PBKDF2_SALT_LEN = 16;

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    PBKDF2_KEY_LEN_BITS
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_LEN));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bufToB64Url(salt)}$${bufToB64Url(hash)}`;
}

export async function verifyPasswordHash(
  password: string,
  stored: string | null | undefined
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1000) return false;
  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = b64UrlToBuf(parts[2]);
    expected = b64UrlToBuf(parts[3]);
  } catch {
    return false;
  }
  const candidate = await pbkdf2(password, salt, iterations);
  if (candidate.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < candidate.length; i++) mismatch |= candidate[i] ^ expected[i];
  return mismatch === 0;
}
