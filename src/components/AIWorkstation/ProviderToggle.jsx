import { PROVIDERS } from '../../lib/aiProviders';

export function ProviderToggle({ provider, setProvider }) {
  return (
    <div className="flex bg-white border rounded-lg p-0.5">
      {Object.values(PROVIDERS).map((p) => (
        <button
          key={p.id}
          onClick={() => setProvider(p.id)}
          className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${
            provider === p.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
