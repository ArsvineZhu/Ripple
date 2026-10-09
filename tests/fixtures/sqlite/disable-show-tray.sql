INSERT INTO app_settings (key, value)
VALUES ('showTray', 'false')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
