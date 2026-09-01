// Validação manual leve (sem dependências) para os payloads das Pages Functions.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isString(value) {
  return typeof value === "string";
}

export function trimmed(value) {
  return isString(value) ? value.trim() : "";
}

export function inRange(value, min, max) {
  return isString(value) && value.trim().length >= min && value.trim().length <= max;
}

export function isOneOf(value, options) {
  return options.includes(value);
}

export function isValidEmail(value) {
  return isString(value) && value.length <= 150 && EMAIL_RE.test(value);
}

const LEAD_AREAS = ["atendimento", "integracao", "paineis", "outro"];
const LEAD_URGENCIES = ["urgente", "breve", "sem_pressa"];

export function parseLeadPayload(body) {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };

  if (!isOneOf(body.area, LEAD_AREAS)) return { ok: false, error: "invalid_area" };
  if (!inRange(body.name, 2, 150)) return { ok: false, error: "invalid_name" };
  if (!inRange(body.company, 1, 150)) return { ok: false, error: "invalid_company" };
  if (!inRange(body.phone, 8, 30)) return { ok: false, error: "invalid_phone" };

  if (body.urgency !== undefined && body.urgency !== null && body.urgency !== "" && !isOneOf(body.urgency, LEAD_URGENCIES)) {
    return { ok: false, error: "invalid_urgency" };
  }
  if (body.email && body.email !== "" && !isValidEmail(body.email)) {
    return { ok: false, error: "invalid_email" };
  }
  if (body.situationKey !== undefined && body.situationKey !== null && !isString(body.situationKey)) {
    return { ok: false, error: "invalid_situation" };
  }
  if (body.notes !== undefined && body.notes !== null && (!isString(body.notes) || body.notes.length > 2000)) {
    return { ok: false, error: "invalid_notes" };
  }

  return {
    ok: true,
    data: {
      area: body.area,
      situationKey: trimmed(body.situationKey).slice(0, 120) || null,
      situationLabel: trimmed(body.situationLabel).slice(0, 300) || null,
      urgency: body.urgency || null,
      name: trimmed(body.name),
      company: trimmed(body.company),
      phone: trimmed(body.phone),
      email: body.email ? trimmed(body.email) : null,
      notes: body.notes ? trimmed(body.notes).slice(0, 2000) : null,
    },
  };
}
