// Server-side Firebase ID-token verifier.
//
// Works in both the Node and Edge runtimes — uses only Web Crypto and
// fetch, no SDK. Verifies:
//   * RS256 signature against Google's JWKS (key cache, 1-hour TTL)
//   * iss == https://securetoken.google.com/<projectId>
//   * aud == <projectId>
//   * exp is in the future, iat is in the past (with 60s clock skew)
//   * sub is a non-empty string (becomes the caller uid)
//
// Required env: FIREBASE_PROJECT_ID
//
// Usage:
//   import { requireAuth } from './_lib/auth.js';
//   const auth = await requireAuth(req); // throws AuthError on failure
//   auth.uid // string

const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const CLOCK_SKEW_SECONDS = 60;

// Cached imported CryptoKey objects, keyed by JWKS `kid`. Refreshed when a
// requested kid is missing or after the cache TTL expires.
let jwksCache = { keys: new Map(), fetchedAt: 0 };
const JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour

export class AuthError extends Error {
  constructor(message, { status = 401 } = {}) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + ((4 - (str.length % 4)) % 4),
    '=',
  );
  if (typeof atob === 'function') {
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  return Uint8Array.from(Buffer.from(padded, 'base64'));
}

function decodeJson(part) {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(part)));
}

async function loadJwks(force = false) {
  const now = Date.now();
  if (!force && jwksCache.keys.size > 0 && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(JWKS_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new AuthError('Failed to load token verification keys', { status: 503 });
  }
  const body = await res.json();
  const next = new Map();
  for (const jwk of body.keys || []) {
    const key = await crypto.subtle.importKey(
      'jwk',
      { ...jwk, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    next.set(jwk.kid, key);
  }
  jwksCache = { keys: next, fetchedAt: now };
  return next;
}

async function resolveKey(kid) {
  let keys = await loadJwks(false);
  if (!keys.has(kid)) keys = await loadJwks(true);
  const key = keys.get(kid);
  if (!key) throw new AuthError('Unknown signing key', { status: 401 });
  return key;
}

export async function verifyIdToken(token, projectId) {
  if (!token || typeof token !== 'string') {
    throw new AuthError('Missing bearer token');
  }
  if (!projectId) {
    throw new AuthError('Server misconfigured (FIREBASE_PROJECT_ID)', { status: 500 });
  }

  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError('Malformed token');

  const [rawHeader, rawPayload, rawSignature] = parts;
  let header;
  let payload;
  try {
    header = decodeJson(rawHeader);
    payload = decodeJson(rawPayload);
  } catch {
    throw new AuthError('Malformed token');
  }

  if (header.alg !== 'RS256') throw new AuthError('Unsupported token algorithm');
  if (!header.kid) throw new AuthError('Token missing key id');

  const key = await resolveKey(header.kid);
  const signature = base64UrlDecode(rawSignature);
  const signedData = new TextEncoder().encode(`${rawHeader}.${rawPayload}`);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature,
    signedData,
  );
  if (!valid) throw new AuthError('Invalid token signature');

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIss = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIss) throw new AuthError('Invalid token issuer');
  if (payload.aud !== projectId) throw new AuthError('Invalid token audience');
  if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_SECONDS < nowSec) {
    throw new AuthError('Token expired');
  }
  if (typeof payload.iat !== 'number' || payload.iat - CLOCK_SKEW_SECONDS > nowSec) {
    throw new AuthError('Token issued in the future');
  }
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new AuthError('Token missing subject');
  }

  return { uid: payload.sub, claims: payload };
}

function getHeader(req, name) {
  if (typeof req.headers?.get === 'function') return req.headers.get(name);
  const lower = name.toLowerCase();
  return req.headers?.[lower] || req.headers?.[name] || null;
}

// Reads an Authorization: Bearer <token> header from either a Node-style
// req (object with .headers map) or a Fetch-style Request (Headers).
export async function requireAuth(req) {
  const header = getHeader(req, 'authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) throw new AuthError('Missing Authorization bearer token');
  return verifyIdToken(match[1].trim(), process.env.FIREBASE_PROJECT_ID);
}
