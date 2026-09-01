// CORS allowlist — o site público pode ser servido de mais de um domínio
// (Cloudflare Pages + KingHost com domínio próprio), então os endpoints
// públicos (não-autenticados) precisam liberar esses origins explicitamente.
const ALLOWED_ORIGINS = [
  "https://kortexsolucion.com.br",
  "https://www.kortexsolucion.com.br",
  "https://kortexsolucion.pages.dev",
  "http://localhost:8788",
  "http://127.0.0.1:8788",
];

export function corsHeaders(request) {
  const origin = request.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "origin",
  };
}

export function corsPreflight(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
