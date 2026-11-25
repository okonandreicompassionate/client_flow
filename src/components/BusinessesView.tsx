import React, { useState, useEffect } from 'react';
import { Business } from '../types';
import { Search, Building2, Globe, MapPin, Phone, Mail, Gauge, Sparkles, Filter } from 'lucide-react';

interface BusinessesViewProps {
  onRunAudit: (businessId: string, url: string) => void;
  onGeneratePitch: (businessId: string) => void;
}

export const BusinessesView: React.FC<BusinessesViewProps> = ({ onRunAudit, onGeneratePitch }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses?search=${encodeURIComponent(search)}&industry=${encodeURIComponent(industry)}&status=${encodeURIComponent(status)}`);
      const data = await res.json();
      setBusinesses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [search, industry, status]);

  const statuses = [
    'New Lead',
    'Audited',
    'Qualified',
    'Pitch Generated',
    'Contacted',
    'Replied',
    'Interested',
    'Meeting Booked',
    'Proposal Sent',
    'Negotiating',
    'Won',
    'Lost'
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Business Prospects</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage discovered leads, lead scores, websites, and pipeline status.</p>
        </div>
        <div className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
          Total Records: <span className="font-bold text-white">{businesses.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, website, location..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Industry</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
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
          <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase">Pipeline Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            {statuses.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-neutral-400">Loading businesses...</div>
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">No businesses found matching your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Business Name</th>
                  <th className="py-4 px-6">Industry</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Contact / Website</th>
                  <th className="py-4 px-6">Score</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-sm">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{b.name}</div>
                      <div className="text-xs text-neutral-400 truncate max-w-xs">{b.notes}</div>
                    </td>
                    <td className="py-4 px-6 text-neutral-300">{b.industry}</td>
                    <td className="py-4 px-6 text-neutral-400">{b.location}</td>
                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <a href={b.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate max-w-[200px]">{b.website}</a>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        {b.email && <span className="truncate">{b.email}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        (b.score || 70) >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        (b.score || 70) >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {b.score || 70} / 100
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => onRunAudit(b.id, b.website)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors inline-flex items-center gap-1"
                        title="Run Website Audit"
                      >
                        <Gauge className="w-3.5 h-3.5 text-amber-400" /> Audit
                      </button>
                      <button
                        onClick={() => onGeneratePitch(b.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-colors inline-flex items-center gap-1"
                        title="Generate AI Pitch"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Pitch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
