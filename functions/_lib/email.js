// Notificação por e-mail de novos leads via Resend (API HTTP — Cloudflare
// Pages Functions não suporta SMTP bruto). Configure a env var
// RESEND_API_KEY no Cloudflare Pages para ativar; sem ela, a função vira um
// no-op silencioso (a gravação do lead no D1 nunca deve falhar por causa
// disso).

const NOTIFY_TO = "contato@kortexsolucion.com.br";
const FROM = "KortexSolucion <onboarding@resend.dev>";

const AREA_LABELS = {
  atendimento: "Atendimento / WhatsApp",
  integracao: "Integração de Sistemas",
  paineis: "Painéis & Dashboards",
  outro: "Outro / ainda não sei",
};

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function notifyNewLead(env, lead) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return; // não configurado — segue sem notificar

  const areaLabel = AREA_LABELS[lead.area] || lead.area;
  const html = `
    <h2>Novo lead recebido no site</h2>
    <p><strong>Área:</strong> ${escapeHtml(areaLabel)}</p>
    ${lead.situationLabel ? `<p><strong>Situação:</strong> ${escapeHtml(lead.situationLabel)}</p>` : ""}
    ${lead.urgency ? `<p><strong>Urgência:</strong> ${escapeHtml(lead.urgency)}</p>` : ""}
    <p><strong>Nome:</strong> ${escapeHtml(lead.name)}</p>
    <p><strong>Empresa:</strong> ${escapeHtml(lead.company)}</p>
    <p><strong>WhatsApp:</strong> ${escapeHtml(lead.phone)}</p>
    ${lead.email ? `<p><strong>E-mail:</strong> ${escapeHtml(lead.email)}</p>` : ""}
    ${lead.notes ? `<p><strong>Notas:</strong> ${escapeHtml(lead.notes)}</p>` : ""}
    <p style="color:#888;font-size:12px;">Ver no painel: https://kortexsolucion.pages.dev/admin/index.html</p>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [NOTIFY_TO],
        subject: `Novo lead: ${lead.name} (${areaLabel})`,
        html,
      }),
    });
  } catch {
    // Notificação é best-effort — nunca deve derrubar a gravação do lead.
  }
}
