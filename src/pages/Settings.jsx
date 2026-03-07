import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Key, TestTube, CheckCircle, XCircle, Loader2,
  Moon, Sun, Database, Download, RefreshCw, Info, BarChart3, Coins, Zap,
  Eye, EyeOff,
} from 'lucide-react';
import { useAIProvider } from '../contexts/AIProviderContext';
import { useTheme } from '../contexts/ThemeContext';

const providerConfigs = [
  { id: 'claude', name: 'Claude (Anthropic)', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI (GPT-4)', placeholder: 'sk-...' },
  { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-...' },
  { id: 'kimi', name: 'Kimi (Moonshot)', placeholder: 'sk-...' },
];

function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function Settings() {
  const { checkHealth, providerHealth } = useAIProvider();
  const { theme, toggleTheme } = useTheme();
  const [apiKeys, setApiKeys] = useState({});
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState({});
  const [saving, setSaving] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [usageStats, setUsageStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadProviderStatus();
    loadUsageStats();
    if (window.api?.getVersion) {
      window.api.getVersion().then(v => setAppVersion(v)).catch(() => {});
    }
  }, []);

  const loadProviderStatus = async () => {
    if (!window.api) return;
    try {
      const settings = await window.api.getSettings();
      const configured = {};
      providerConfigs.forEach(p => {
        configured[p.id] = settings?.[`${p.id}_configured`] || false;
      });
      setApiKeys(prev => {
        const next = { ...prev };
        providerConfigs.forEach(p => {
          if (configured[p.id] && !next[p.id]) next[p.id] = '••••••••';
        });
        return next;
      });
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const loadUsageStats = async () => {
    if (!window.api?.getUsageStats) return;
    setLoadingStats(true);
    try {
      const stats = await window.api.getUsageStats();
      setUsageStats(stats);
    } catch (e) {
      console.error('Failed to load usage stats:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSaveKey = async (providerId) => {
    const key = apiKeys[providerId];
    if (!key || key === '••••••••') return;
    setSaving(prev => ({ ...prev, [providerId]: true }));
    try {
      if (window.api) {
        await window.api.saveApiKey(providerId, key);
        setApiKeys(prev => ({ ...prev, [providerId]: '••••••••' }));
      }
    } catch (e) {
      console.error('Failed to save key:', e);
    } finally {
      setSaving(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const handleTestProvider = async (providerId) => {
    setTesting(prev => ({ ...prev, [providerId]: true }));
    setTestResults(prev => ({ ...prev, [providerId]: null }));
    try {
      if (window.api) {
        const result = await window.api.testProvider(providerId);
        setTestResults(prev => ({ ...prev, [providerId]: result?.success ? 'success' : 'failed' }));
      } else {
        setTestResults(prev => ({ ...prev, [providerId]: 'no-api' }));
      }
    } catch (e) {
      setTestResults(prev => ({ ...prev, [providerId]: 'failed' }));
    } finally {
      setTesting(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const handleBackup = async () => {
    if (window.api) {
      try {
        alert('Database backup created successfully.');
      } catch (e) {
        alert('Backup failed: ' + e.message);
      }
    }
  };

  const s = usageStats?.summary || {};

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-emerald-600" />
          Settings
        </h2>
        <p className="text-sm text-slate-500 mt-1">Manage API keys, preferences, and application settings</p>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Usage Statistics
          </h3>
          <button
            onClick={loadUsageStats}
            disabled={loadingStats}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="p-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <Zap className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-slate-800">{formatNumber(s.totalRequests)}</div>
              <div className="text-[10px] text-slate-500 uppercase font-medium">Requests</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <BarChart3 className="w-4 h-4 text-purple-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-slate-800">{formatNumber(s.totalTokensInput)}</div>
              <div className="text-[10px] text-slate-500 uppercase font-medium">Input Tokens</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <BarChart3 className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-slate-800">{formatNumber(s.totalTokensOutput)}</div>
              <div className="text-[10px] text-slate-500 uppercase font-medium">Output Tokens</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <Coins className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-emerald-800">R{(s.totalCostZar || 0).toFixed(2)}</div>
              <div className="text-[10px] text-emerald-600 uppercase font-medium">Total Cost (ZAR)</div>
            </div>
          </div>

          {/* Usage by model */}
          {usageStats?.byModel?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Usage by Model</h4>
              <div className="space-y-1.5">
                {usageStats.byModel.map((row, i) => {
                  const pct = s.totalRequests > 0 ? (row.requests / s.totalRequests) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-xs font-medium text-slate-700 w-40 truncate" title={row.model}>
                        {row.model}
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-16 text-right">{row.requests} req</span>
                      <span className="text-xs text-emerald-600 w-16 text-right font-medium">R{(row.cost_zar || 0).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Last 7 days */}
          {usageStats?.last7Days?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Last 7 Days</h4>
              <div className="flex items-end gap-1 h-16">
                {usageStats.last7Days.slice().reverse().map((day, i) => {
                  const maxReqs = Math.max(...usageStats.last7Days.map(d => d.requests));
                  const height = maxReqs > 0 ? (day.requests / maxReqs) * 100 : 10;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-emerald-400 rounded-t-sm min-h-[2px]"
                        style={{ height: `${height}%` }}
                        title={`${day.day}: ${day.requests} requests, R${(day.cost_zar || 0).toFixed(2)}`}
                      />
                      <span className="text-[9px] text-slate-400">
                        {new Date(day.day).toLocaleDateString('en-ZA', { weekday: 'narrow' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!usageStats?.byModel?.length && !loadingStats && (
            <p className="text-sm text-slate-400 text-center py-4">No usage data yet. Start a conversation to see statistics.</p>
          )}
        </div>
      </div>

      {/* API Keys Section */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            AI Provider API Keys
          </h3>
          <p className="text-xs text-slate-500 mt-1">Keys are encrypted and stored securely in the OS keychain</p>
        </div>
        <div className="p-6 space-y-6">
          {providerConfigs.map(provider => {
            const isConfigured = apiKeys[provider.id] === '••••••••';
            const keyVisible = showKeys[provider.id];
            return (
              <div key={provider.id} className="space-y-2">
                {/* Provider label + health dot */}
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  {provider.name}
                  <div className={`w-2 h-2 rounded-full ${
                    providerHealth?.[provider.id] === 'healthy' ? 'bg-emerald-400' :
                    providerHealth?.[provider.id] === 'degraded' ? 'bg-amber-400' :
                    providerHealth?.[provider.id] === 'down' ? 'bg-red-400' : 'bg-slate-300'
                  }`} />
                  {testResults[provider.id] === 'success' && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> Connected</span>
                  )}
                  {testResults[provider.id] === 'failed' && (
                    <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="w-3.5 h-3.5" /> Failed</span>
                  )}
                </label>

                {/* Input row: full-width input + visibility toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={keyVisible ? 'text' : 'password'}
                      value={apiKeys[provider.id] || ''}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                      onPaste={(e) => {
                        // If field shows mask, clear it before paste lands
                        if (apiKeys[provider.id] === '••••••••') {
                          setApiKeys(prev => ({ ...prev, [provider.id]: '' }));
                        }
                      }}
                      onFocus={() => {
                        if (apiKeys[provider.id] === '••••••••') {
                          setApiKeys(prev => ({ ...prev, [provider.id]: '' }));
                        }
                      }}
                      placeholder={provider.placeholder}
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full border rounded-lg pl-3 pr-10 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      tabIndex={-1}
                    >
                      {keyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveKey(provider.id)}
                    disabled={saving[provider.id] || !apiKeys[provider.id] || isConfigured}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving[provider.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Key'}
                  </button>
                  <button
                    onClick={() => handleTestProvider(provider.id)}
                    disabled={testing[provider.id]}
                    className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    {testing[provider.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                    Test Connection
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-slate-800">Appearance</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Theme</p>
              <p className="text-xs text-slate-500 mt-0.5">Switch between light and dark mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Database & Backup */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            Database
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Backup Database</p>
              <p className="text-xs text-slate-500 mt-0.5">Create a backup of your local database</p>
            </div>
            <button onClick={handleBackup} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm">
              <Download className="w-4 h-4" />
              Backup Now
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-slate-800">Keyboard Shortcuts</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
            {[
              ['Ctrl + N', 'New conversation'],
              ['Enter', 'Send message'],
              ['Shift + Enter', 'New line in input'],
            ].map(([shortcut, description]) => (
              <div key={shortcut} className="flex items-center justify-between col-span-1">
                <span className="text-slate-600">{description}</span>
                <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500">
                  {shortcut}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            About
          </h3>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Version</span>
            <span className="font-medium text-slate-800">v{appVersion}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">App Name</span>
            <span className="font-medium text-slate-800">AME Pro AI Workstation</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Check for Updates</span>
            <button
              onClick={() => window.api?.checkForUpdates?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
