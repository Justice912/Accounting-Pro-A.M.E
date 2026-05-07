import React, { useState } from 'react';
import { X, Eye, EyeOff, ExternalLink, Check, AlertCircle, Link2 } from 'lucide-react';
import {
  getKey,
  setKey,
  clearKey,
  looksLikeAnthropicKey,
  maskKey,
  getKeySource,
  getLegacyAppKey,
} from './keyStore.js';

// In-sidebar settings overlay. Opens above the message list when the user
// clicks the cog icon. Lets the user paste a personal Anthropic API key
// (BYOK) that will be sent to /api/claude in a header. If no key is saved,
// the server falls back to its ANTHROPIC_API_KEY env var.
export default function SettingsPanel({ onClose }) {
  const [draft, setDraft] = useState(() => getKey());
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState(null); // { kind: 'ok'|'err', message }
  const [source, setSource] = useState(() => getKeySource());

  const stored = getKey();
  const hasStored = !!stored;
  const draftValid = looksLikeAnthropicKey(draft);
  const legacyAppKey = getLegacyAppKey();
  const canImportLegacy = source !== 'sidebar' && !!legacyAppKey;

  const handleSave = () => {
    if (!draft.trim()) {
      setStatus({ kind: 'err', message: 'Paste a key first.' });
      return;
    }
    if (!draftValid) {
      setStatus({ kind: 'err', message: 'Key looks malformed. It should start with "sk-ant-".' });
      return;
    }
    setKey(draft.trim());
    setSource('sidebar');
    setStatus({ kind: 'ok', message: 'Key saved to this browser.' });
  };

  const handleClear = () => {
    clearKey();
    setDraft('');
    setSource(getKeySource());
    setStatus({
      kind: 'ok',
      message:
        getKeySource() === 'app'
          ? 'Sidebar key removed. Falling back to the existing app key.'
          : 'Key removed. The server env var (if set) will be used.',
    });
  };

  const handleImportLegacy = () => {
    if (!legacyAppKey) return;
    if (!looksLikeAnthropicKey(legacyAppKey)) {
      setStatus({
        kind: 'err',
        message: 'The existing app key looks malformed. Please paste a fresh one.',
      });
      return;
    }
    setKey(legacyAppKey);
    setDraft(legacyAppKey);
    setSource('sidebar');
    setStatus({ kind: 'ok', message: 'Linked the existing app key to the sidebar.' });
  };

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <p className="text-sm font-semibold text-slate-800">Sidebar settings</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 hover:bg-slate-200 text-slate-600"
          aria-label="Close settings"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
        {/* Active-key banner */}
        <div
          className={`rounded-lg border px-3 py-2 text-xs flex items-start gap-2 ${
            source === 'sidebar'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : source === 'app'
                ? 'bg-sky-50 border-sky-200 text-sky-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {source === 'sidebar' && (
            <>
              <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Using a sidebar-saved key (<span className="font-mono">{maskKey(stored)}</span>).
              </span>
            </>
          )}
          {source === 'app' && (
            <>
              <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Using the existing app key from the header dropdown
                (<span className="font-mono">{maskKey(stored)}</span>). Save your own below to
                override.
              </span>
            </>
          )}
          {source === 'none' && (
            <>
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                No key on this device. Paste one below or set
                <span className="font-mono"> ANTHROPIC_API_KEY</span> on the server.
              </span>
            </>
          )}
        </div>

        {canImportLegacy && (
          <button
            type="button"
            onClick={handleImportLegacy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold px-3 py-2"
          >
            <Link2 className="w-3.5 h-3.5" />
            Use existing app key (<span className="font-mono">{maskKey(legacyAppKey)}</span>)
          </button>
        )}

        <section className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Anthropic API Key
          </label>
          <p className="text-xs text-slate-500 leading-relaxed">
            Paste your own key to put usage on your Anthropic billing. Stored only in this
            browser&apos;s localStorage and sent in a header to the server proxy. Leave blank to
            use the server&apos;s default key.
          </p>

          <div className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <input
                type={reveal ? 'text' : 'password'}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setStatus(null);
                }}
                placeholder="sk-ant-api03-..."
                spellCheck={false}
                autoComplete="off"
                className="w-full border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                className="absolute inset-y-0 right-0 px-2 text-slate-500 hover:text-slate-700"
                title={reveal ? 'Hide' : 'Show'}
              >
                {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {hasStored && (
            <p className="text-xs text-slate-500">
              Currently saved: <span className="font-mono">{maskKey(stored)}</span>
            </p>
          )}

          {status && (
            <div
              className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                status.kind === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {status.kind === 'ok' ? (
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.trim() || !draftValid}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold"
            >
              Save key
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasStored && !draft}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold"
            >
              Clear
            </button>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800"
            >
              Get a key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-3 space-y-2 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 uppercase tracking-wide text-[10px]">
            Where is my key stored?
          </p>
          <p>
            Your key is kept in this browser&apos;s localStorage under
            <span className="font-mono"> claude-sidebar-byok-key-v1</span>. If no sidebar key is
            saved, the sidebar transparently reuses the existing app key at
            <span className="font-mono"> anthropic-api-key</span> (set via the AI dropdown in
            the app header). Either way, the key never leaves your device except as the bearer of
            a single request to the server proxy at
            <span className="font-mono"> /api/claude</span>, which forwards it to Anthropic.
            Clearing your browser data or clicking <strong>Clear</strong> removes the
            sidebar-saved key.
          </p>
        </section>
      </div>
    </div>
  );
}
