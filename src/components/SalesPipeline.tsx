import React, { useState, useEffect } from 'react';
import { Business } from '../types';
import { Kanban, Building2, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';

export const SalesPipeline: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const stages = [
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

  const fetchPipeline = async () => {
    try {
      const res = await fetch('/api/pipeline');
      const data = await res.json();
      setBusinesses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const moveStage = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/businesses/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchPipeline();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-neutral-400">Loading CRM pipeline...</div>;

  return (
    <div className="p-8 space-y-8 max-w-full overflow-x-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Pipeline & Kanban CRM</h1>
          <p className="text-neutral-400 text-sm mt-1">Track prospective client conversations from initial discovery to closed contracts.</p>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 pb-6 overflow-x-auto min-w-[1400px]">
        {stages.map((stage) => {
          const stageBusinesses = businesses.filter(b => b.status === stage);
          return (
            <div key={stage} className="w-72 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col shrink-0 shadow-sm max-h-[700px]">
              {/* Stage Header */}
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <span className="font-semibold text-white text-xs uppercase tracking-wider">{stage}</span>
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-xs font-bold">
                  {stageBusinesses.length}
                </span>
              </div>

              {/* Stage Cards List */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {stageBusinesses.map((b) => (
                  <div key={b.id} className="bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-4 space-y-3 hover:border-neutral-600 transition-all shadow-sm">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{b.name}</h4>
                      <div className="text-xs text-neutral-400 truncate mt-0.5">{b.industry}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-700/50">
                      <span className="text-blue-400 font-medium">{b.location}</span>
                      <span className="text-neutral-400">{b.score || 70}/100</span>
                    </div>

                    {/* Quick Move Status */}
                    <div className="pt-2 flex justify-between items-center text-[11px]">
                      <span className="text-neutral-500">Move:</span>
                      <select
                        value={b.status}
                        onChange={(e) => moveStage(b.id, e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none"
                      >
                        {stages.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {stageBusinesses.length === 0 && (
                  <div className="p-6 text-center text-xs text-neutral-600 italic">No prospects in this stage</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
