// Browser-side store for the user's bring-your-own-key (BYOK) Anthropic API
// key. The key is kept in localStorage so it survives reloads and tabs;
// session-only storage would force the user to re-paste the key after every
// browser restart.
//
// The actual key never sits in any state container — we read it once when
// the request is being assembled in claudeClient.js, attach it to a
// short-lived header on the fetch, and forget it. The server proxy strips
// the header and forwards only the bearer value to Anthropic.

const STORAGE_KEY = 'claude-sidebar-byok-key-v1';
// The existing app header dropdown (src/App_remote.jsx) saves the user's
// Anthropic key under this storage key. The sidebar transparently reuses
// it when the user has not set a sidebar-specific key, so users who have
// already configured the app's AI features do not have to paste the key
// twice.
const LEGACY_APP_KEY = 'anthropic-api-key';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readRaw(name) {
  try {
    return window.localStorage.getItem(name) || '';
  } catch {
    return '';
  }
}

export function getKey() {
  if (!isBrowser()) return '';
  return readRaw(STORAGE_KEY) || readRaw(LEGACY_APP_KEY) || '';
}

// Returns where the active key came from, for UI display.
//   'sidebar'  - saved in the sidebar Settings panel
//   'app'      - inherited from the existing app header dropdown
//   'none'     - no key saved on this device (server env var still works)
export function getKeySource() {
  if (!isBrowser()) return 'none';
  if (readRaw(STORAGE_KEY)) return 'sidebar';
  if (readRaw(LEGACY_APP_KEY)) return 'app';
  return 'none';
}

export function getLegacyAppKey() {
  if (!isBrowser()) return '';
  return readRaw(LEGACY_APP_KEY);
}

export function setKey(value) {
  if (!isBrowser()) return;
  try {
    if (value && value.trim()) {
      window.localStorage.setItem(STORAGE_KEY, value.trim());
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore quota / security errors
  }
}

export function clearKey() {
  setKey('');
}

// Lightweight format check that mirrors what the server enforces.
export function looksLikeAnthropicKey(value) {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(String(value || '').trim());
}

// Mask all but the first 8 + last 4 chars for display.
export function maskKey(value) {
  const k = String(value || '').trim();
  if (!k) return '';
  if (k.length <= 12) return '•'.repeat(k.length);
  return `${k.slice(0, 8)}${'•'.repeat(Math.max(0, k.length - 12))}${k.slice(-4)}`;
}
