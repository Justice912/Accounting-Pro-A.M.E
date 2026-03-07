import { safeStorage, app } from 'electron';
import fs from 'fs';
import path from 'path';

const KEYS_FILE = path.join(app.getPath('userData'), 'api-keys.enc');

function loadKeys() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const data = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
      return data;
    }
  } catch (e) {
    console.error('[Keychain] Error loading keys:', e);
  }
  return {};
}

function saveKeysToFile(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys), 'utf8');
}

export default {
  saveApiKey(provider, key) {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available on this system');
    }
    const encrypted = safeStorage.encryptString(key).toString('base64');
    const keys = loadKeys();
    keys[provider] = encrypted;
    saveKeysToFile(keys);
    console.log(`[Keychain] API key saved for provider: ${provider}`);
  },

  getApiKey(provider) {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('[Keychain] Encryption not available');
      return null;
    }
    const keys = loadKeys();
    if (!keys[provider]) return null;
    try {
      const buffer = Buffer.from(keys[provider], 'base64');
      return safeStorage.decryptString(buffer);
    } catch (e) {
      console.error(`[Keychain] Error decrypting key for ${provider}:`, e);
      return null;
    }
  },

  deleteApiKey(provider) {
    const keys = loadKeys();
    delete keys[provider];
    saveKeysToFile(keys);
    console.log(`[Keychain] API key deleted for provider: ${provider}`);
  },

  hasApiKey(provider) {
    const keys = loadKeys();
    return !!keys[provider];
  },
};
