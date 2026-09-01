-- Esquema D1 do KortexSolucion. Aplique com:
--   wrangler d1 execute kortex-leads-db --remote --file=schema.sql
-- Mantenha toda alteração futura aditiva (não vai dar DROP em produção).

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_type TEXT NOT NULL DEFAULT 'admin' CHECK (user_type IN ('admin')),
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  area TEXT NOT NULL CHECK (area IN ('atendimento', 'integracao', 'paineis', 'outro')),
  situation_key TEXT,
  situation_label TEXT,
  urgency TEXT CHECK (urgency IN ('urgente', 'breve', 'sem_pressa')),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'novo'
    CHECK (status IN ('novo', 'contatado', 'diagnostico_agendado', 'fechado', 'descartado')),
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_type, user_id);
