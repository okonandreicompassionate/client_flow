import React, { useState, useEffect } from 'react';
import { Business, EmailDraft } from '../types';
import { Mail, Sparkles, Copy, CheckCircle2, Send, Edit3, RefreshCw } from 'lucide-react';

interface EmailCentreProps {
  businesses: Business[];
  onRefreshStats: () => void;
}

export const EmailCentre: React.FC<EmailCentreProps> = ({ businesses, onRefreshStats }) => {
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [selectedBizId, setSelectedBizId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDraft, setActiveDraft] = useState<EmailDraft | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/drafts');
      const data = await res.json();
      setDrafts(data);
      if (data.length > 0 && !activeDraft) {
        setActiveDraft(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleGeneratePitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBizId) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/pitches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: selectedBizId })
      });
      const data = await res.json();
      if (data.success) {
        setNotification('AI Pitch successfully generated with Gemini Flash!');
        fetchDrafts();
        onRefreshStats();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification('Copied email to clipboard!');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Pitch Generator & Email Centre</h1>
          <p className="text-neutral-400 text-sm mt-1">Generate highly personalized, human-sounding sales pitches based on website audit evidence.</p>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Generate Pitch Box */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" /> Generate Personalised Pitch
        </h2>
        <form onSubmit={handleGeneratePitch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">Select Prospect</label>
            <select
              value={selectedBizId}
              onChange={(e) => setSelectedBizId(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Choose Business Prospect --</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.industry})</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!selectedBizId || isGenerating}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-colors disabled:opacity-50 shrink-0"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating AI Pitch...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Pitch
              </>
            )}
          </button>
        </form>
      </div>

      {/* Drafts Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drafts List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm space-y-3 h-[600px] overflow-y-auto">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider px-2">Generated Drafts ({drafts.length})</h2>
          {drafts.map((d) => (
            <div
              key={d.id}
              onClick={() => setActiveDraft(d)}
              className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                activeDraft?.id === d.id
                  ? 'bg-blue-600/10 border-blue-500/50 text-white'
                  : 'bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <div className="font-semibold text-sm truncate">{d.business_name}</div>
              <div className="text-xs text-neutral-400 truncate mt-0.5">{d.subject}</div>
              <div className="mt-2 flex justify-between items-center text-[11px] text-neutral-500">
                <span>{d.recommended_service}</span>
                <span className="text-blue-400 font-medium">{d.pricing_range}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Draft Preview & Editor */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm flex flex-col justify-between h-[600px]">
          {activeDraft ? (
            <div className="space-y-5 overflow-y-auto flex-1 pr-2">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{activeDraft.business_name}</h3>
                  <p className="text-xs text-neutral-400">To: {activeDraft.business_email || 'contact@business.ng'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(`Subject: ${activeDraft.subject}\n\n${activeDraft.body}`)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Email Subject</label>
                  <input
                    type="text"
                    value={activeDraft.subject}
                    onChange={(e) => setActiveDraft({ ...activeDraft, subject: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Email Body</label>
                  <textarea
                    rows={10}
                    value={activeDraft.body}
                    onChange={(e) => setActiveDraft({ ...activeDraft, body: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                  />
                </div>
                <div className="bg-neutral-800/40 rounded-xl p-4 border border-neutral-700/50 space-y-2 text-xs text-neutral-300">
                  <div className="font-semibold text-white">AI Rationale & Audit Evidence</div>
                  <div><strong className="text-blue-400">Recommended Service:</strong> {activeDraft.recommended_service}</div>
                  <div><strong className="text-amber-400">Pricing Range:</strong> {activeDraft.pricing_range}</div>
                  <div><strong className="text-neutral-400">Evidence:</strong> {activeDraft.rationale}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
              Select or generate an email pitch to review and edit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
