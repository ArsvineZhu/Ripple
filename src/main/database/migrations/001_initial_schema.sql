CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

CREATE TABLE tasks (
  position INTEGER PRIMARY KEY,
  content TEXT NOT NULL
) STRICT;

CREATE TABLE workflows (
  position INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  urls_json TEXT NOT NULL
) STRICT;

CREATE TABLE quick_apps (
  position INTEGER PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  target_json TEXT NOT NULL
) STRICT;

CREATE TABLE secrets (
  key TEXT PRIMARY KEY,
  ciphertext BLOB NOT NULL
) STRICT;

PRAGMA user_version = 1;
