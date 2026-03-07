/**
 * Register IPC handlers for settings operations
 * @param {Electron.IpcMain} ipcMain
 * @param {Object} services - { database, keychain }
 */
export default function registerSettingsHandlers(ipcMain, services) {
  const { database, keychain } = services;

  /**
   * settings:get - Read all settings from database
   */
  ipcMain.handle('settings:get', async () => {
    try {
      const rows = database.getAll('SELECT key, value FROM settings');
      const settings = {};
      for (const row of rows) {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch {
          settings[row.key] = row.value;
        }
      }

      // Add provider configuration status (never return actual keys)
      settings.providers = {
        claude: keychain.hasApiKey('claude'),
        openai: keychain.hasApiKey('openai'),
        deepseek: keychain.hasApiKey('deepseek'),
        kimi: keychain.hasApiKey('kimi'),
      };

      return settings;
    } catch (error) {
      console.error('[Settings Handler] Error getting settings:', error);
      throw error;
    }
  });

  /**
   * settings:save - Save settings to database
   */
  ipcMain.handle('settings:save', async (event, settings) => {
    try {
      for (const [key, value] of Object.entries(settings)) {
        // Skip provider keys - those are handled separately
        if (key === 'providers') continue;

        const valueStr =
          typeof value === 'object' ? JSON.stringify(value) : String(value);

        database.run(
          `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
          [key, valueStr]
        );
      }
      return { success: true };
    } catch (error) {
      console.error('[Settings Handler] Error saving settings:', error);
      throw error;
    }
  });

  /**
   * settings:apikey:save - Save API key via keychain (encrypted)
   * API keys are NEVER returned to the renderer process
   */
  ipcMain.handle('settings:apikey:save', async (event, provider, key) => {
    try {
      if (!key || key.trim() === '') {
        keychain.deleteApiKey(provider);
        return { success: true, action: 'deleted' };
      }
      keychain.saveApiKey(provider, key.trim());
      return { success: true, action: 'saved' };
    } catch (error) {
      console.error('[Settings Handler] Error saving API key:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * settings:apikey:get - Check if an API key exists (returns boolean, NOT the key)
   * API keys are NEVER sent to the renderer
   */
  ipcMain.handle('settings:apikey:get', async (event, provider) => {
    try {
      return { configured: keychain.hasApiKey(provider) };
    } catch (error) {
      console.error('[Settings Handler] Error checking API key:', error);
      return { configured: false };
    }
  });
};
