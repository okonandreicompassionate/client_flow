import React, { useState, useEffect } from 'react';
import { WebsiteAudit, Business } from '../types';
import { Gauge, Play, AlertTriangle, CheckCircle2, Globe, Sparkles, ShieldAlert, ArrowRight } from 'lucide-react';

interface WebsiteAuditsProps {
  businesses: Business[];
  onRefreshStats: () => void;
}

export const WebsiteAudits: React.FC<WebsiteAuditsProps> = ({ businesses, onRefreshStats }) => {
  const [audits, setAudits] = useState<WebsiteAudit[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [selectedUrl, setSelectedUrl] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api/audits');
      const data = await res.json();
      setAudits(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessId) return;

    const biz = businesses.find(b => b.id === selectedBusinessId);
    if (!biz || !biz.website) return;

    setIsAuditing(true);
    try {
      const res = await fetch('/api/audits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: selectedBusinessId, url: biz.website })
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Successfully completed website audit for ${biz.name}!`);
        fetchAudits();
        onRefreshStats();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Website Audits & PageSpeed Insights</h1>
          <p className="text-neutral-400 text-sm mt-1">Analyse performance, accessibility, SEO, and technical bottlenecks.</p>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Run Audit Form */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-amber-500" /> Run New Website Audit
        </h2>
        <form onSubmit={handleRunAudit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">Select Business Prospect</label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Choose Business --</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.website})</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!selectedBusinessId || isAuditing}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-colors disabled:opacity-50 shrink-0"
          >
            {isAuditing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analysing Lighthouse & PageSpeed...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Website Audit
              </>
            )}
          </button>
        </form>
      </div>

      {/* Audits History Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Recent Audit Reports ({audits.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {audits.map((audit) => (
            <div key={audit.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base">{audit.business_name}</h3>
                  <a href={audit.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1">
                    <Globe className="w-3 h-3" /> {audit.url}
                  </a>
                </div>
                <span className="text-xs text-neutral-400">{new Date(audit.created_at).toLocaleDateString()}</span>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-neutral-800/60 rounded-lg p-3 border border-neutral-700/50">
                  <div className="text-[11px] text-neutral-400 font-medium">Performance</div>
                  <div className={`text-xl font-bold mt-1 ${audit.performance_score < 50 ? 'text-red-400' : 'text-amber-400'}`}>
                    {audit.performance_score}
                  </div>
                </div>
                <div className="bg-neutral-800/60 rounded-lg p-3 border border-neutral-700/50">
                  <div className="text-[11px] text-neutral-400 font-medium">Accessibility</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{audit.accessibility_score}</div>
                </div>
                <div className="bg-neutral-800/60 rounded-lg p-3 border border-neutral-700/50">
                  <div className="text-[11px] text-neutral-400 font-medium">SEO</div>
                  <div className="text-xl font-bold text-blue-400 mt-1">{audit.seo_score}</div>
                </div>
                <div className="bg-neutral-800/60 rounded-lg p-3 border border-neutral-700/50">
                  <div className="text-[11px] text-neutral-400 font-medium">Load Time</div>
                  <div className="text-xl font-bold text-purple-400 mt-1">{audit.load_time_seconds}s</div>
                </div>
              </div>

              {/* Key Findings Summary */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Key Optimization Opportunities
                </div>
                <div className="bg-neutral-800/40 rounded-lg p-3 text-xs text-neutral-300 space-y-1">
                  <div className="font-medium text-amber-300">• Slow Mobile Page Load Speed ({audit.load_time_seconds}s LCP)</div>
                  <div className="text-neutral-400">Recommendation: Compress assets and enable browser caching.</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
