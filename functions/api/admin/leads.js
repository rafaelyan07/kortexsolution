import { json, requireAdmin } from "../../_lib/auth.js";
import { isOneOf } from "../../_lib/validate.js";

const STATUSES = ["novo", "contatado", "diagnostico_agendado", "fechado", "descartado"];

// GET /api/admin/leads — lista os leads mais recentes primeiro, com os "novo" no topo.
export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return json({ ok: false, error: "unavailable" }, { status: 503 });

  const admin = await requireAdmin(request, db);
  if (!admin) return json({ ok: false }, { status: 401 });

  const { results } = await db
    .prepare("SELECT * FROM leads ORDER BY (status = 'novo') DESC, created_at DESC LIMIT 200")
    .all();
  return json({ ok: true, leads: results ?? [] });
}

// POST /api/admin/leads — atualiza status/nota de um lead existente.
export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ ok: false, error: "unavailable" }, { status: 503 });

  const admin = await requireAdmin(request, db);
  if (!admin) return json({ ok: false }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body.id !== "string" || body.id.length === 0) {
    return json({ ok: false, error: "invalid_id" }, { status: 400 });
  }
  if (body.status !== undefined && !isOneOf(body.status, STATUSES)) {
    return json({ ok: false, error: "invalid_status" }, { status: 400 });
  }
  if (body.adminNote !== undefined && body.adminNote !== null && typeof body.adminNote !== "string") {
    return json({ ok: false, error: "invalid_note" }, { status: 400 });
  }

  await db
    .prepare(
      `UPDATE leads SET
         status = COALESCE(?, status),
         admin_note = COALESCE(?, admin_note),
         updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(body.status ?? null, body.adminNote ?? null, body.id)
    .run();

  return json({ ok: true });
}
