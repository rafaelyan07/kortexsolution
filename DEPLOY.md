# Deploy no Cloudflare Pages

Site estático (HTML/CSS/JS puro) com captação de leads via Cloudflare Pages
Functions + banco D1. Sem build step — o que está na raiz do projeto é
exatamente o que sobe.

## 1. Criar o banco D1

Instale o Wrangler (se ainda não tiver) e faça login:

```bash
npm install -g wrangler
wrangler login
```

Crie o banco:

```bash
wrangler d1 create kortex-leads-db
```

Copie o `database_id` retornado e cole em [wrangler.toml](wrangler.toml) no
lugar de `REPLACE_WITH_D1_DATABASE_ID`.

Aplique o schema:

```bash
wrangler d1 execute kortex-leads-db --remote --file=schema.sql
```

## 2. Criar o projeto no Cloudflare Pages

**Opção A — via GitHub (recomendado):**
1. Suba este repositório no GitHub.
2. No dashboard do Cloudflare → Workers & Pages → Create → Pages → conecte o
   repositório.
3. Build command: deixe vazio. Output directory: `/` (raiz).
4. Deploy.

**Opção B — via CLI:**
```bash
wrangler pages deploy .
```

## 3. Conectar o banco D1 ao projeto Pages

No dashboard: seu projeto Pages → Settings → Functions → D1 database
bindings → Add binding:
- Variable name: `DB`
- D1 database: `kortex-leads-db`

Repita para os dois ambientes (Production e Preview).

## 4. Configurar o secret de setup do admin

Settings → Environment variables → adicione (nos dois ambientes):
- `ADMIN_SETUP_SECRET`: uma string aleatória só sua (ex.: gere com
  `openssl rand -hex 24`). Guarde-a — só serve para criar o primeiro admin.

Depois de configurar bindings/variáveis, faça um novo deploy para elas
entrarem em vigor.

## 5. Notificação por e-mail de novos leads (Resend)

Todo lead novo (formulário simples ou diagnóstico guiado) manda um e-mail
pra `contato@kortexsolucion.com.br` via [Resend](https://resend.com).

1. Crie uma conta grátis em resend.com (3.000 e-mails/mês no free tier).
2. Vá em API Keys → Create API Key → copie a chave.
3. Configure como secret do projeto Pages:
   ```bash
   wrangler pages secret put RESEND_API_KEY --project-name=kortexsolucion
   ```
4. (Opcional, recomendado) Verifique o domínio `kortexsolucion.com.br` em
   Resend → Domains, e troque o remetente em
   [functions/_lib/email.js](functions/_lib/email.js) de
   `onboarding@resend.dev` para algo como
   `Kortex <contato@kortexsolucion.com.br>`. Sem isso, os e-mails saem do
   domínio de teste do Resend (funciona, mas menos profissional).

Sem essa chave configurada, tudo continua funcionando normalmente — o envio
de e-mail só é pulado silenciosamente, o lead ainda é salvo no D1 e aparece
no painel `/admin` normalmente.

## 6. Criar o primeiro login de admin

Acesse `https://seu-dominio/admin/setup.html`, informe o
`ADMIN_SETUP_SECRET`, seu nome, e-mail e senha. Esse endpoint só funciona uma
vez (enquanto não existir nenhum admin no banco) — depois disso ele sempre
recusa, por segurança.

## 7. Usar o painel

`https://seu-dominio/admin/login.html` → lista de leads em
`https://seu-dominio/admin/index.html`, com status (novo, contatado,
diagnóstico agendado, fechado, descartado) e link direto pro WhatsApp de
cada lead.

## Fluxo de captação

Dois pontos de entrada, os dois gravando no mesmo `POST /api/leads` (D1 +
e-mail de notificação):

- `atendimento.html` — questionário guiado (área → situação → urgência →
  contato), linkado no botão principal do hero e no "Fale Conosco" do menu.
- Formulário simples na seção `#contato` do `index.html` — envia direto,
  sem Formspree.

Como o front-end pode ser hospedado fora do Cloudflare (ex.: KingHost com
domínio próprio), as chamadas pro `/api/leads` sempre usam a URL absoluta
`https://kortexsolucion.pages.dev`, com CORS liberado em
[functions/_lib/cors.js](functions/_lib/cors.js) para os domínios permitidos.

## Testar localmente

```bash
wrangler pages dev . --d1=DB=kortex-leads-db
```

Isso sobe um D1 local (SQLite) automaticamente. Rode o schema nele primeiro:

```bash
wrangler d1 execute kortex-leads-db --local --file=schema.sql
```
