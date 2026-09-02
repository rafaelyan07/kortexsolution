(function () {
  const WHATSAPP_NUMBER = "5511973001003";
  // API sempre no Cloudflare Pages — funciona tanto quando o site é servido
  // por lá quanto quando é servido por outro domínio (ex.: KingHost), graças
  // ao CORS liberado em functions/_lib/cors.js.
  const API_BASE = "https://kortexsolucion.pages.dev";

  const AREA_LABELS = {
    atendimento: "Atendimento / WhatsApp",
    integracao: "Integração de Sistemas",
    paineis: "Painéis & Dashboards",
    outro: "Outro / ainda não sei",
  };

  const SITUATIONS = {
    atendimento: [
      "Minha equipe não dá conta de responder o WhatsApp a tempo",
      "Clientes esperam demais para agendar ou tirar dúvidas",
      "Quero automatizar orçamentos e respostas repetitivas",
    ],
    integracao: [
      "Minha equipe copia e cola dados entre sistemas manualmente",
      "WhatsApp, planilhas e ERP não conversam entre si",
      "Erros humanos em processos repetitivos estão custando caro",
    ],
    paineis: [
      "Não tenho visibilidade em tempo real da operação",
      "Preciso de um portal para clientes ou equipe rastrearem pedidos/ativos",
      "Meus dados estão espalhados, sem um dashboard consolidado",
    ],
    outro: [
      "Ainda não sei exatamente qual solução preciso",
      "Quero entender o que dá pra automatizar no meu negócio",
    ],
  };

  const URGENCY_LABELS = {
    urgente: "É urgente",
    breve: "Preciso resolver em breve",
    sem_pressa: "Ainda estou avaliando",
  };

  const state = {
    step: 1,
    area: null,
    situationKey: null,
    urgency: null,
  };

  const stage = document.getElementById("step-stage");
  const progressFill = document.getElementById("progress-fill");
  const situationOptions = document.getElementById("situation-options");
  const form = document.getElementById("lead-form");
  const submitBtn = document.getElementById("submit-btn");
  const formError = document.getElementById("form-error");
  const confirmTitle = document.getElementById("confirm-title");
  const confirmWhatsapp = document.getElementById("confirm-whatsapp");

  function goToStep(step, options) {
    const scroll = !options || options.scroll !== false;
    state.step = step;
    stage.querySelectorAll(".step-card").forEach((card) => {
      card.classList.toggle("active", Number(card.dataset.step) === step);
    });
    const pct = Math.min(step, 4) / 4;
    progressFill.style.width = `${pct * 100}%`;
    if (scroll) {
      window.scrollTo({ top: stage.offsetTop - 100, behavior: "smooth" });
    }
  }

  function renderSituations(area) {
    situationOptions.innerHTML = "";
    (SITUATIONS[area] || []).forEach((label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-row";
      btn.dataset.situation = label;
      btn.innerHTML = `<span class="option-row-title">${label}</span>`;
      situationOptions.appendChild(btn);
    });
    const other = document.createElement("button");
    other.type = "button";
    other.className = "option-row option-row-dashed";
    other.dataset.situation = "Outra situação";
    other.innerHTML = `<span class="option-row-title">Minha situação é outra</span>`;
    situationOptions.appendChild(other);
  }

  document.getElementById("area-options").addEventListener("click", (e) => {
    const card = e.target.closest(".option-card");
    if (!card) return;
    document.querySelectorAll("#area-options .option-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    state.area = card.dataset.area;
    renderSituations(state.area);
    goToStep(2);
  });

  situationOptions.addEventListener("click", (e) => {
    const row = e.target.closest(".option-row");
    if (!row) return;
    situationOptions.querySelectorAll(".option-row").forEach((r) => r.classList.remove("selected"));
    row.classList.add("selected");
    state.situationKey = row.dataset.situation;
    goToStep(3);
  });

  document.getElementById("urgency-options").addEventListener("click", (e) => {
    const row = e.target.closest(".option-row");
    if (!row) return;
    document.querySelectorAll("#urgency-options .option-row").forEach((r) => r.classList.remove("selected"));
    row.classList.add("selected");
    state.urgency = row.dataset.urgency;
    goToStep(4);
  });

  stage.querySelectorAll(".step-back").forEach((btn) => {
    btn.addEventListener("click", () => goToStep(Number(btn.dataset.back)));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.classList.remove("visible");

    const data = new FormData(form);
    const consent = document.getElementById("f-consent").checked;
    if (!consent) return;

    const payload = {
      area: state.area,
      situationKey: state.situationKey,
      situationLabel: state.situationKey,
      urgency: state.urgency,
      name: data.get("name"),
      company: data.get("company"),
      phone: data.get("phone"),
      email: data.get("email") || undefined,
      notes: data.get("notes") || undefined,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";

    try {
      const res = await fetch(API_BASE + "/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");

      const firstName = String(payload.name).trim().split(" ")[0];
      confirmTitle.textContent = `Recebemos suas informações, ${firstName}`;

      const summary = [
        "Olá! Vim pelo diagnóstico guiado do site.",
        "",
        `Área: ${AREA_LABELS[state.area] || "-"}`,
        `Situação: ${state.situationKey || "-"}`,
        `Urgência: ${URGENCY_LABELS[state.urgency] || "-"}`,
        `Empresa: ${payload.company}`,
        `Nome: ${payload.name}`,
      ].join("\n");
      confirmWhatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(summary)}`;

      goToStep(5);
    } catch {
      formError.classList.add("visible");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Ver próximo passo";
    }
  });

  goToStep(1, { scroll: false });
})();
