import { json } from "../_lib/auth.js";
import { parseLeadPayload } from "../_lib/validate.js";
import { corsHeaders, corsPreflight } from "../_lib/cors.js";
import { notifyNewLead } from "../_lib/email.js";

// OPTIONS /api/leads — preflight CORS (o navegador manda isso antes do POST
// quando a página vem de um domínio diferente, como o site no KingHost).
export async function onRequestOptions({ request }) {
  return corsPreflight(request);
}

// POST /api/leads — endpoint público, chamado pelo questionário guiado
// (atendimento.html) e por qualquer outro formulário do site.
export async function onRequestPost({ request, env, waitUntil }) {
  const cors = corsHeaders(request);
  const db = env.DB;
  if (!db) return json({ ok: false, error: "unavailable" }, { status: 503, headers: cors });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, { status: 400, headers: cors });
  }

  const parsed = parseLeadPayload(body);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, { status: 400, headers: cors });
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

  waitUntil(notifyNewLead(env, data));

  return json({ ok: true, id }, { headers: cors });
}
