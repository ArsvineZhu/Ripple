INSERT INTO secrets (key, ciphertext)
VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET ciphertext = excluded.ciphertext;
