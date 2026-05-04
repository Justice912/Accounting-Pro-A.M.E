import { ProviderToggle } from './ProviderToggle';
import { PROVIDERS } from '../../lib/aiProviders';

export function ChatHeader({ provider, setProvider, model, setModel, hasKey, onOpenSettings }) {
  const config = PROVIDERS[provider];
  const keyMissing = !hasKey(config.keyField);

  return (
    <div className="px-4 py-2 border-b bg-gray-50 space-y-2">
      <ProviderToggle provider={provider} setProvider={setProvider} />
      <div className="flex items-center gap-2">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="text-xs border rounded px-2 py-1 flex-1 bg-white"
        >
          {config.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        {keyMissing && (
          <button onClick={onOpenSettings} className="text-xs text-red-600 underline whitespace-nowrap">
            Add API key
          </button>
        )}
      </div>
    </div>
  );
}
