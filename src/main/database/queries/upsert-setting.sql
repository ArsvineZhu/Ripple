INSERT INTO app_settings (key, value)
VALUES (@key, @value)
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
