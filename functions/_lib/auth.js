// Helpers de autenticação compartilhados pelas Pages Functions.
// PBKDF2-SHA256 via Web Crypto — a mesma API existe no runtime das Cloudflare
// Pages Functions, então nada de dependência nativa (bcrypt) é necessário.

const PBKDF2_ITERATIONS = 100_000;
const COOKIE_NAME = "kx_admin_sid";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 dias

function toBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function timingSafeEqualBytes(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function derive(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derive(password, salt);
  return { hash: toBase64(derived), salt: toBase64(salt) };
}

export async function verifyPassword(password, hash, salt) {
  const derived = await derive(password, fromBase64(salt));
  const expected = fromBase64(hash);
  return timingSafeEqualBytes(derived, expected);
}

export async function createSession(db, userId) {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await db
    .prepare("INSERT INTO sessions (id, user_type, user_id, expires_at) VALUES (?, 'admin', ?, ?)")
    .bind(id, userId, expiresAt)
    .run();
  return id;
}

export async function destroySession(db, sessionId) {
  if (!sessionId) return;
  await db.prepare("DELETE FROM sessions WHERE id = ? AND user_type = 'admin'").bind(sessionId).run();
}

function readCookie(request, name) {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function sessionCookieHeader(sessionId) {
  return `${COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function getRawSessionId(request) {
  return readCookie(request, COOKIE_NAME);
}

export async function requireAdmin(request, db) {
  const sessionId = readCookie(request, COOKIE_NAME);
  if (!sessionId) return null;

  const session = await db
    .prepare("SELECT user_id, expires_at FROM sessions WHERE id = ? AND user_type = 'admin'")
    .bind(sessionId)
    .first();
  if (!session) return null;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    return null;
  }

  const admin = await db
    .prepare("SELECT id, name, email FROM admin_users WHERE id = ?")
    .bind(session.user_id)
    .first();
  return admin ?? null;
}

export function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...(init && init.headers) },
  });
}
