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

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getKey() {
  if (!isBrowser()) return '';
  try {
    return window.localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
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
