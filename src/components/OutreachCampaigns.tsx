import React, { useState, useEffect } from 'react';
import { Campaign } from '../types';
import { Send, Plus, CheckCircle2, Play, Mail, ShieldAlert } from 'lucide-react';

interface OutreachCampaignsProps {
  onRefreshStats: () => void;
}

export const OutreachCampaigns: React.FC<OutreachCampaignsProps> = ({ onRefreshStats }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [template, setTemplate] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('All');
  const [notification, setNotification] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subject, template, target_industry: targetIndustry })
      });
      const data = await res.json();
      if (data.success) {
        setNotification('Campaign created successfully!');
        setShowModal(false);
        setName(''); setSubject(''); setTemplate('');
        fetchCampaigns();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotification(`Successfully sent campaign to ${data.sentCount} prospective businesses!`);
        fetchCampaigns();
        onRefreshStats();
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Outreach Campaigns & Safeguards</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage email outreach campaigns with built-in sending limits and compliance controls.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/25 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Safeguards Notice */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center gap-4 text-xs text-neutral-300 shadow-sm">
        <ShieldAlert className="w-6 h-6 text-blue-500 shrink-0" />
        <div>
          <span className="font-semibold text-white">Sending Safeguards Active:</span> Strict suppression filtering prevents duplicate emails and opted-out contacts. Daily limits and delays ensure compliant Gmail API usage.
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{c.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Target: {c.target_industry}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  c.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {c.status}
                </span>
              </div>
              <div className="bg-neutral-800/40 rounded-lg p-3 border border-neutral-700/50 space-y-1 text-xs">
                <div className="text-neutral-400 font-medium">Subject:</div>
                <div className="text-white font-medium">{c.subject}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="bg-neutral-800/60 rounded-lg p-2.5 border border-neutral-700/50">
                  <div className="text-[11px] text-neutral-400">Sent</div>
                  <div className="text-lg font-bold text-white mt-0.5">{c.sent_count}</div>
                </div>
                <div className="bg-neutral-800/60 rounded-lg p-2.5 border border-neutral-700/50">
                  <div className="text-[11px] text-neutral-400">Opened</div>
                  <div className="text-lg font-bold text-cyan-400 mt-0.5">{c.open_count}</div>
                </div>
                <div className="bg-neutral-800/60 rounded-lg p-2.5 border border-neutral-700/50">
                  <div className="text-[11px] text-neutral-400">Replies</div>
                  <div className="text-lg font-bold text-pink-400 mt-0.5">{c.reply_count}</div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => handleSendCampaign(c.id)}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Execute Campaign Send
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-55">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-bold text-white">Create Outreach Campaign</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lagos Real Estate Speed Optimization"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Target Industry</label>
                <select
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">All Industries</option>
                  <option value="Real estate agencies">Real estate agencies</option>
                  <option value="Hotels and hospitality">Hotels and hospitality</option>
                  <option value="Private schools">Private schools</option>
                  <option value="Logistics businesses">Logistics businesses</option>
                  <option value="Professional services">Professional services</option>
                  <option value="Clinics">Clinics</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Email Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Quick idea regarding {{name}}'s website speed"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Email Template Body *</label>
                <textarea
                  required
                  rows={6}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="Hi {{name}} team, I noticed a few speed bottlenecks..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-md"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
