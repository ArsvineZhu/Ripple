CREATE TABLE IF NOT EXISTS quick_apps (
  position INTEGER PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  target_json TEXT NOT NULL
) STRICT;

CREATE TRIGGER reject_quick_app
BEFORE INSERT ON quick_apps
WHEN NEW.id = 'reject'
BEGIN
  SELECT RAISE(ABORT, 'injected write failure');
END;
