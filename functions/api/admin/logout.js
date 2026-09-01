import { clearSessionCookieHeader, destroySession, getRawSessionId, json } from "../../_lib/auth.js";

// POST /api/admin/logout
export async function onRequestPost({ request, env }) {
  const db = env.DB;
  const sessionId = getRawSessionId(request);
  if (db && sessionId) await destroySession(db, sessionId);
  return json({ ok: true }, { headers: { "set-cookie": clearSessionCookieHeader() } });
}
