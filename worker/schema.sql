-- ----------------------------------------------------
-- Schema for gzh-typesetter-db
-- Supports User Accounts, Sessions, and VIP Extensibility
-- ----------------------------------------------------

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'free',      -- Extensibility: 'free', 'vip', 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table for Authentication Tokens
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Login rate limiting: failed attempts per email within a 10-minute window
CREATE TABLE IF NOT EXISTS login_attempts (
  email TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_start TEXT
);

-- Presets Table for Saving User Combinations
CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  theme TEXT,
  layout_style TEXT,
  image_style TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Illustration jobs for async generation pipeline
CREATE TABLE IF NOT EXISTS illustration_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  source_markdown_key TEXT,
  result_markdown_key TEXT,
  settings_json TEXT,
  plan_summary_json TEXT,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Illustration items within a job
CREATE TABLE IF NOT EXISTS illustration_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  anchor_json TEXT,
  purpose TEXT,
  type TEXT,
  style TEXT,
  alt TEXT,
  prompt_key TEXT,
  image_key TEXT,
  image_url TEXT,
  engine TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  provider_meta_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES illustration_jobs(id) ON DELETE CASCADE
);

-- Artifacts generated while planning and rendering illustrations
CREATE TABLE IF NOT EXISTS illustration_artifacts (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  meta_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES illustration_jobs(id) ON DELETE CASCADE
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_user_id ON presets(user_id);
CREATE INDEX IF NOT EXISTS idx_illustration_jobs_user_id ON illustration_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_illustration_jobs_status ON illustration_jobs(status);
CREATE INDEX IF NOT EXISTS idx_illustration_items_job_id ON illustration_items(job_id);
CREATE INDEX IF NOT EXISTS idx_illustration_items_status ON illustration_items(status);
CREATE INDEX IF NOT EXISTS idx_illustration_artifacts_job_id ON illustration_artifacts(job_id);
