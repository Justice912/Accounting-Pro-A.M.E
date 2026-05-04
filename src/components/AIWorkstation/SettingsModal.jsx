import { useState } from 'react';
import { X, Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useApiKeys } from '../../hooks/useApiKeys';
import { PROVIDERS } from '../../lib/aiProviders';

export function SettingsModal({ onClose }) {
  const { keys, saveKey, validateKey } = useApiKeys();
  const [drafts, setDrafts] = useState({
    anthropic: keys.anthropic || '',
    openai: keys.openai || '',
  });
  const [show, setShow] = useState({ anthropic: false, openai: false });
  const [status, setStatus] = useState({ anthropic: null, openai: null });
  const [busy, setBusy] = useState({ anthropic: false, openai: false });

  async function handleSave(providerId) {
    // providerId is 'claude' or 'openai' (from PROVIDERS)
    const keyField = PROVIDERS[providerId].keyField; // 'anthropic' or 'openai'
    const value = drafts[keyField].trim();
    if (!value) return;

    setBusy((b) => ({ ...b, [keyField]: true }));
    setStatus((s) => ({ ...s, [keyField]: null }));

    const valid = await validateKey(keyField, value);
    if (valid) {
      await saveKey(keyField, value);
      setStatus((s) => ({ ...s, [keyField]: 'valid' }));
    } else {
      setStatus((s) => ({ ...s, [keyField]: 'invalid' }));
    }
    setBusy((b) => ({ ...b, [keyField]: false }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold">AI Settings — BYOK</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-gray-600">
            Add your own API keys. Keys are stored securely in your account and never shared.{' '}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Get Claude key
            </a>{' '}
            ·{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Get OpenAI key
            </a>
          </p>

          {Object.values(PROVIDERS).map((p) => {
            const k = p.keyField;
            return (
              <div key={p.id} className="space-y-2">
                <label className="text-sm font-medium">{p.name} API Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={show[k] ? 'text' : 'password'}
                      value={drafts[k]}
                      onChange={(e) => setDrafts((d) => ({ ...d, [k]: e.target.value }))}
                      placeholder={p.keyHint}
                      className="w-full border rounded px-3 py-2 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {show[k] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={busy[k] || !drafts[k]}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 flex items-center"
                  >
                    {busy[k] ? <Loader size={14} className="animate-spin" /> : 'Save'}
                  </button>
                </div>
                {status[k] === 'valid' && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle size={12} /> Validated and saved
                  </div>
                )}
                {status[k] === 'invalid' && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <XCircle size={12} /> Invalid key — check and try again
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t px-5 py-3 bg-gray-50 text-xs text-gray-500">
          Keys are stored in Firestore under your user account, protected by Firebase security rules. Only you can read or modify them.
        </div>
      </div>
    </div>
  );
}
