(function () {
  const AREA_LABEL = {
    atendimento: "Atendimento",
    integracao: "Integração",
    paineis: "Painéis",
    outro: "Outro",
  };
  const STATUS_LABEL = {
    novo: "Novo",
    contatado: "Contatado",
    diagnostico_agendado: "Diagnóstico agendado",
    fechado: "Fechado",
    descartado: "Descartado",
  };

  function waLink(phone) {
    const digits = String(phone || "").replace(/\D/g, "").replace(/^55/, "");
    return `https://wa.me/55${digits}`;
  }

  function fmtDate(iso) {
    try {
      return new Date(iso.replace(" ", "T") + "Z").toLocaleString("pt-BR");
    } catch {
      return iso;
    }
  }

  window.KortexAdmin = { waLink, fmtDate, AREA_LABEL, STATUS_LABEL };

  // --- Login page ---
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    const errorEl = document.getElementById("login-error");
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.classList.remove("visible");
      const data = new FormData(loginForm);
      const submitBtn = loginForm.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
        });
        if (!res.ok) throw new Error("invalid");
        window.location.href = "index.html";
      } catch {
        errorEl.textContent = "E-mail ou senha inválidos.";
        errorEl.classList.add("visible");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // --- Setup / bootstrap page ---
  const setupForm = document.getElementById("setup-form");
  if (setupForm) {
    const errorEl = document.getElementById("setup-error");
    const successEl = document.getElementById("setup-success");
    setupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.classList.remove("visible");
      successEl.style.display = "none";
      const data = new FormData(setupForm);
      const submitBtn = setupForm.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      try {
        const res = await fetch("/api/admin/bootstrap", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            setupSecret: data.get("setupSecret"),
            name: data.get("name"),
            email: data.get("email"),
            password: data.get("password"),
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "failed");
        setupForm.style.display = "none";
        successEl.style.display = "block";
      } catch (err) {
        const messages = {
          already_initialized: "Já existe um admin cadastrado. Use a tela de login.",
          invalid_secret: "Secret de configuração incorreto.",
          setup_not_configured: "ADMIN_SETUP_SECRET não configurado no Cloudflare Pages.",
        };
        errorEl.textContent = messages[err.message] || "Não foi possível concluir. Verifique os dados.";
        errorEl.classList.add("visible");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // --- Dashboard page ---
  const leadsRoot = document.getElementById("leads-root");
  if (leadsRoot) {
    const logoutBtn = document.getElementById("logout-btn");
    const summaryEl = document.getElementById("leads-summary");

    async function loadLeads() {
      leadsRoot.innerHTML = '<p class="leads-loading">Carregando…</p>';
      const res = await fetch("/api/admin/leads", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "login.html";
        return;
      }
      const body = await res.json();
      renderLeads(body.leads || []);
    }

    function renderLeads(leads) {
      const newCount = leads.filter((l) => l.status === "novo").length;
      summaryEl.textContent =
        newCount > 0 ? `${newCount} novo(s) contato(s) aguardando retorno.` : "Nenhum contato novo no momento.";

      if (leads.length === 0) {
        leadsRoot.innerHTML = '<p class="leads-empty">Nenhum lead recebido ainda.</p>';
        return;
      }

      leadsRoot.innerHTML = "";
      leads.forEach((lead) => {
        const card = document.createElement("div");
        card.className = "lead-card" + (lead.status === "novo" ? " is-new" : "");

        const statusOptions = Object.entries(STATUS_LABEL)
          .map(([key, label]) => `<option value="${key}" ${key === lead.status ? "selected" : ""}>${label}</option>`)
          .join("");

        card.innerHTML = `
          <div class="lead-top">
            <div>
              <div class="lead-name">${escapeHtml(lead.name)} <span class="area-tag">· ${AREA_LABEL[lead.area] || lead.area}</span></div>
              <div class="lead-meta">${escapeHtml(lead.company || "")} · ${escapeHtml(lead.phone)} ${lead.email ? "· " + escapeHtml(lead.email) : ""} · ${fmtDate(lead.created_at)}</div>
            </div>
            <select class="lead-status-select" data-id="${lead.id}">${statusOptions}</select>
          </div>
          ${lead.situation_label ? `<div class="lead-detail"><strong>Situação:</strong> ${escapeHtml(lead.situation_label)}</div>` : ""}
          ${lead.urgency ? `<div class="lead-detail"><strong>Urgência:</strong> ${escapeHtml(lead.urgency)}</div>` : ""}
          ${lead.notes ? `<div class="lead-detail"><strong>Notas:</strong> ${escapeHtml(lead.notes)}</div>` : ""}
          <a class="lead-wa-link" href="${waLink(lead.phone)}" target="_blank" rel="noreferrer">Abrir WhatsApp →</a>
        `;

        card.querySelector(".lead-status-select").addEventListener("change", async (e) => {
          await fetch("/api/admin/leads", {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: lead.id, status: e.target.value }),
          });
          void loadLeads();
        });

        leadsRoot.appendChild(card);
      });
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = String(str);
      return div.innerHTML;
    }

    logoutBtn.addEventListener("click", async () => {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
      window.location.href = "login.html";
    });

    void loadLeads();
  }
})();
