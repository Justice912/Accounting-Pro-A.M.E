// Browser-side store for the user's bring-your-own-key (BYOK) Anthropic API
// key.
//
// Security: the key is held in sessionStorage with a short TTL (default 30
// minutes). It is cleared when the tab closes, when the TTL elapses, and
// when the user clicks Clear. Persisting BYOK in localStorage was changed
// here because localStorage is readable by any JS that runs in the same
// origin — a successful XSS could exfiltrate the key — and there is no
// device-level lock to clear it on inactivity.
//
// The key never sits in any state container — we read it once when the
// request is being assembled in claudeClient.js, attach it to a short-lived
// header on the fetch, and forget it. The server proxy strips the header
// and forwards only the bearer value to Anthropic.

const STORAGE_KEY = 'claude-sidebar-byok-key-v1';
const STORAGE_EXPIRES_KEY = 'claude-sidebar-byok-key-v1-expires';

// Existing app header dropdown (src/App_remote.jsx) saves the user's
// Anthropic key under this storage key. Kept for backwards compat — the
// sidebar transparently reuses it when the user has not set a sidebar
// key.
const LEGACY_APP_KEY = 'anthropic-api-key';

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function readSession(name) {
  try {
    return window.sessionStorage.getItem(name) || '';
  } catch {
    return '';
  }
}

function readSidebarKey() {
  if (!isBrowser()) return '';
  const expiresAt = Number(readSession(STORAGE_EXPIRES_KEY)) || 0;
  if (!expiresAt || Date.now() > expiresAt) {
    // expired — wipe so callers see a clean "no key" state
    clearKey();
    return '';
  }
  return readSession(STORAGE_KEY);
}

function readLegacyKey() {
  if (!isBrowser()) return '';
  // The legacy header-dropdown key may still live in sessionStorage if the
  // user-facing UI was migrated to session-only storage too. Fall back to
  // localStorage for migration but actively migrate it across so it stops
  // being persisted across browser restarts.
  try {
    const sessionLegacy = window.sessionStorage.getItem(LEGACY_APP_KEY) || '';
    if (sessionLegacy) return sessionLegacy;
    const localLegacy = window.localStorage.getItem(LEGACY_APP_KEY) || '';
    if (localLegacy) {
      // Migrate to sessionStorage, drop the persistent copy.
      window.sessionStorage.setItem(LEGACY_APP_KEY, localLegacy);
      window.localStorage.removeItem(LEGACY_APP_KEY);
      return localLegacy;
    }
  } catch { /* ignore */ }
  return '';
}

export function getKey() {
  if (!isBrowser()) return '';
  return readSidebarKey() || readLegacyKey();
}

// Returns where the active key came from, for UI display.
//   'sidebar'  - saved in the sidebar Settings panel (this tab)
//   'app'      - inherited from the existing app header dropdown
//   'none'     - no key saved in this tab (server env var still works)
export function getKeySource() {
  if (!isBrowser()) return 'none';
  if (readSidebarKey()) return 'sidebar';
  if (readLegacyKey()) return 'app';
  return 'none';
}

export function getLegacyAppKey() {
  if (!isBrowser()) return '';
  return readLegacyKey();
}

export function setKey(value, { ttlMs = DEFAULT_TTL_MS } = {}) {
  if (!isBrowser()) return;
  try {
    if (value && value.trim()) {
      window.sessionStorage.setItem(STORAGE_KEY, value.trim());
      window.sessionStorage.setItem(STORAGE_EXPIRES_KEY, String(Date.now() + ttlMs));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_EXPIRES_KEY);
    }
  } catch {
    // ignore quota / security errors
  }
}

export function clearKey() {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_EXPIRES_KEY);
  } catch { /* ignore */ }
}

export function getKeyExpiry() {
  if (!isBrowser()) return 0;
  return Number(readSession(STORAGE_EXPIRES_KEY)) || 0;
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
