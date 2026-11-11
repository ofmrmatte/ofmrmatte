PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS establishments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  uf TEXT NOT NULL,
  category TEXT NOT NULL,
  website TEXT,
  source_url TEXT NOT NULL,
  statement_date TEXT,
  statement_title TEXT NOT NULL,
  statement_summary TEXT NOT NULL,
  progressive_tag INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('published', 'archived')),
  verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS establishments_filter ON establishments (status, uf, city, category);
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  protocol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  uf TEXT NOT NULL,
  category TEXT NOT NULL,
  website TEXT,
  source_url TEXT NOT NULL,
  statement_date TEXT,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_notes TEXT,
  establishment_id TEXT REFERENCES establishments(id),
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS submissions_pending ON submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_rate ON submissions (ip_hash, created_at);
CREATE TABLE IF NOT EXISTS appeals (
  id TEXT PRIMARY KEY,
  protocol TEXT NOT NULL UNIQUE,
  establishment_id TEXT REFERENCES establishments(id),
  request_type TEXT NOT NULL,
  relation TEXT NOT NULL,
  justification TEXT NOT NULL,
  evidence_url TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  notes TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS moderation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS login_attempts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 ip_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS login_attempts_rate ON login_attempts (ip_hash, created_at);
