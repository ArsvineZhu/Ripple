export interface SafeStorageAdapter {
  isAsyncEncryptionAvailable(): Promise<boolean>;
  getSelectedStorageBackend?(): string;
  encryptStringAsync(value: string): Promise<Buffer>;
  decryptStringAsync(value: Buffer): Promise<{ result: string; shouldReEncrypt: boolean }>;
}

export interface SecretDatabase {
  getSecretCiphertext(key: string): Buffer | null;
  setSecretCiphertext(key: string, ciphertext: Buffer): void;
  deleteSecret(key: string): void;
  hasSecret(key: string): boolean;
}

const API_KEY_NAME = 'api-key';

export function createSecretStore(database: SecretDatabase, safeStorage: SafeStorageAdapter) {
  const ensureSecureStorage = async () => {
    if (!(await safeStorage.isAsyncEncryptionAvailable())) {
      throw new Error('OS-backed secure storage is unavailable');
    }
    if (
      process.platform === 'linux' &&
      safeStorage.getSelectedStorageBackend?.() === 'basic_text'
    ) {
      throw new Error('OS-backed secure storage is unavailable');
    }
  };

  const setApiKey = async (value: string) => {
    const key = value.trim();
    if (!key) {
      database.deleteSecret(API_KEY_NAME);
      return;
    }
    await ensureSecureStorage();
    database.setSecretCiphertext(API_KEY_NAME, await safeStorage.encryptStringAsync(key));
  };

  return {
    setApiKey,
    async getApiKey(): Promise<string | null> {
      const encrypted = database.getSecretCiphertext(API_KEY_NAME);
      if (!encrypted) return null;
      await ensureSecureStorage();
      const decrypted = await safeStorage.decryptStringAsync(encrypted);
      if (decrypted.shouldReEncrypt) await setApiKey(decrypted.result);
      return decrypted.result;
    },
    async hasApiKey(): Promise<boolean> {
      return database.hasSecret(API_KEY_NAME);
    },
  };
}
