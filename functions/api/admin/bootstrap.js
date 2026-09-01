import { hashPassword, json, timingSafeEqualBytes } from "../../_lib/auth.js";
import { inRange, isValidEmail } from "../../_lib/validate.js";

// POST /api/admin/bootstrap — cria o PRIMEIRO admin. Só funciona enquanto
// admin_users está vazia E quem chama conhece ADMIN_SETUP_SECRET (variável de
// ambiente configurada no Cloudflare Pages). Depois do primeiro admin criado,
// este endpoint sempre responde 403 — não existe forma pública de criar um
// segundo admin.
export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ ok: false, error: "unavailable" }, { status: 503 });

  const configuredSecret = env.ADMIN_SETUP_SECRET;
  if (!configuredSecret) {
    return json({ ok: false, error: "setup_not_configured" }, { status: 403 });
  }

  const existing = await db.prepare("SELECT COUNT(*) AS n FROM admin_users").first();
  if ((existing?.n ?? 0) > 0) {
    return json({ ok: false, error: "already_initialized" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body.setupSecret !== "string" || body.setupSecret.length === 0) {
    return json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (!inRange(body.name, 2, 150)) return json({ ok: false, error: "invalid_name" }, { status: 400 });
  if (!isValidEmail(body.email)) return json({ ok: false, error: "invalid_email" }, { status: 400 });
  if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 200) {
    return json({ ok: false, error: "invalid_password" }, { status: 400 });
  }

  const providedSecret = new TextEncoder().encode(body.setupSecret);
  const expectedSecret = new TextEncoder().encode(configuredSecret);
  if (!timingSafeEqualBytes(providedSecret, expectedSecret)) {
    return json({ ok: false, error: "invalid_secret" }, { status: 403 });
  }

  const { hash, salt } = await hashPassword(body.password);
  const id = crypto.randomUUID();
  await db
    .prepare("INSERT INTO admin_users (id, name, email, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)")
    .bind(id, body.name.trim(), body.email.trim().toLowerCase(), hash, salt)
    .run();

  return json({ ok: true });
}
