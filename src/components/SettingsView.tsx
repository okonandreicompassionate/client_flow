import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, CheckCircle2, Save, Key, Shield } from 'lucide-react';

interface SettingsViewProps {
  onResetDemo: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onResetDemo }) => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setNotification('Settings saved successfully!');
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings & Integrations</h1>
          <p className="text-neutral-400 text-sm mt-1">Configure API keys, Supabase persistence, Gmail OAuth, and agency profile settings.</p>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Agency Profile */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" /> Agency Profile & Defaults
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Agency Name</label>
              <input
                type="text"
                value={settings['agency_name'] || ''}
                onChange={(e) => handleChange('agency_name', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Default Pricing Range</label>
              <input
                type="text"
                value={settings['default_pricing'] || ''}
                onChange={(e) => handleChange('default_pricing', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Services Offered</label>
            <input
              type="text"
              value={settings['services_offered'] || ''}
              onChange={(e) => handleChange('services_offered', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* API Credentials */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-500" /> API Providers & Integrations
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Gemini API Key (AI Pitch Generation)</label>
              <input
                type="password"
                value={settings['gemini_api_key'] || ''}
                onChange={(e) => handleChange('gemini_api_key', e.target.value)}
                placeholder="AI Studio automatically injects GEMINI_API_KEY at runtime"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Groq API Key (Optional Fallback)</label>
              <input
                type="password"
                value={settings['groq_api_key'] || ''}
                onChange={(e) => handleChange('groq_api_key', e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Supabase PostgreSQL URL & Key</label>
              <input
                type="text"
                value={settings['supabase_url'] || ''}
                onChange={(e) => handleChange('supabase_url', e.target.value)}
                placeholder="https://xyz.supabase.co"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save & Reset */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onResetDemo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-red-400 text-sm font-medium border border-neutral-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reset Demo Data & Re-seed
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/25 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
