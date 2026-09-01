(function () {
  const API_BASE = "https://kortexsolucion.pages.dev";

  const form = document.getElementById("simple-contact-form");
  if (!form) return;

  const errorEl = document.getElementById("simple-contact-error");
  const successEl = document.getElementById("simple-contact-success");
  const submitBtn = document.getElementById("simple-contact-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.remove("visible");

    const data = new FormData(form);
    const payload = {
      area: "outro",
      situationLabel: "Contato direto (formulário simples do site)",
      name: data.get("name"),
      company: data.get("company"),
      phone: data.get("phone"),
      notes: data.get("notes"),
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

      form.style.display = "none";
      successEl.hidden = false;
    } catch {
      errorEl.classList.add("visible");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Solicitar Diagnóstico Gratuito";
    }
  });
})();
