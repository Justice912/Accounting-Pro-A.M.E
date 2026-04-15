# API Keys

AME Pro stores AI provider API keys encrypted on disk using Electron's `safeStorage`. Keys are **never** read from environment variables or `.env` files — they are entered through the Settings UI and saved to `%APPDATA%/ame-pro-workstation/api-keys.enc` (Windows) or the equivalent `userData` path on macOS/Linux.

## Adding a key

1. Launch the app (`npm run dev` or the packaged build).
2. Open **Settings** from the sidebar.
3. Scroll to **AI Provider API Keys**.
4. Paste the key for the provider you want to enable and click **Save**. The field masks to `••••••••` once saved.

Keys are scoped per provider. You can have any combination configured simultaneously.

## Supported providers

| Provider | Key ID | Get a key |
|----------|--------|-----------|
| Anthropic (Claude) | `claude` | https://console.anthropic.com/settings/keys |
| OpenAI | `openai` | https://platform.openai.com/api-keys |
| DeepSeek | `deepseek` | https://platform.deepseek.com/api_keys |
| Moonshot (Kimi) | `kimi` | https://platform.moonshot.cn/console/api-keys |

## VAT Capture requirement

The VAT Capture module uses **Claude Vision** for receipt OCR and requires a `claude` key specifically. Model is hardcoded to `claude-sonnet-4-6` (see `electron/ipc/vat-handlers.js`). Without it, the **Capture (AI)** tab will show:

> Claude API key not configured. Go to Settings to add it.

Other tabs (Receipts, VAT Schedule, Bank Reconciliation) work without any key — only the OCR extraction step needs one.

## Key storage details

- File: `<userData>/api-keys.enc`
- Format: JSON object `{ provider: base64(safeStorage.encryptString(key)) }`
- Encryption: OS keychain via Electron `safeStorage` (DPAPI on Windows, Keychain on macOS, libsecret on Linux)
- Service module: `electron/services/keychain.js`
- Retrieval: `keychain.getApiKey(provider)` from main-process code only — never exposed to the renderer as plaintext

## Rotating or removing a key

Re-save from Settings to rotate. To remove, clear the field and save (the renderer calls `deleteApiKey` when the input is empty). To wipe all keys, delete the `api-keys.enc` file while the app is closed.

## If `safeStorage` is unavailable

On a system where the OS keychain isn't available (headless Linux without libsecret, for example), `keychain.saveApiKey` throws `Encryption not available on this system`. Install the appropriate keychain backend or run the app on a desktop session.
