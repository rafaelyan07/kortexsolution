import { json } from "../_lib/auth.js";
import { parseLeadPayload } from "../_lib/validate.js";

// POST /api/leads — endpoint público, chamado pelo questionário guiado
// (atendimento.html) e por qualquer outro formulário do site.
export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ ok: false, error: "unavailable" }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseLeadPayload(body);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, { status: 400 });
  const data = parsed.data;

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO leads (id, area, situation_key, situation_label, urgency, name, company, phone, email, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      data.area,
      data.situationKey,
      data.situationLabel,
      data.urgency,
      data.name,
      data.company,
      data.phone,
      data.email,
      data.notes,
    )
    .run();

  return json({ ok: true, id });
}
