import { createSession, json, sessionCookieHeader, verifyPassword } from "../../_lib/auth.js";
import { isValidEmail } from "../../_lib/validate.js";

// POST /api/admin/login
export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ ok: false, error: "unavailable" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || !isValidEmail(body.email) || typeof body.password !== "string" || body.password.length === 0) {
    return json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const row = await db
    .prepare("SELECT id, password_hash, password_salt FROM admin_users WHERE email = ?")
    .bind(body.email.trim().toLowerCase())
    .first();

  if (!row || !(await verifyPassword(body.password, row.password_hash, row.password_salt))) {
    return json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const sessionId = await createSession(db, row.id);
  return json({ ok: true }, { headers: { "set-cookie": sessionCookieHeader(sessionId) } });
}
