INSERT INTO app_settings (key, value)
VALUES ('backgroundMode', 'true')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
