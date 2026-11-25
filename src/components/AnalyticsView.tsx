import React from 'react';
import { Stats } from '../types';
import { BarChart3, TrendingUp, Users, Send, DollarSign } from 'lucide-react';

interface AnalyticsViewProps {
  stats: Stats | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats }) => {
  if (!stats) return <div className="p-8 text-neutral-400">Loading analytics...</div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Campaign & Conversion Analytics</h1>
        <p className="text-neutral-400 text-sm mt-1">Comprehensive performance metrics across lead discovery, outreach, and sales conversion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-neutral-400 uppercase">Qualified Lead Rate</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">
            {stats.totalBusinesses > 0 ? Math.round((stats.qualifiedLeads / stats.totalBusinesses) * 100) : 0}%
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-neutral-400 uppercase">Email Reply Rate</div>
          <div className="text-3xl font-bold text-pink-400 mt-2">
            {stats.sentCount > 0 ? Math.round((stats.repliesCount / stats.sentCount) * 100) : 0}%
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-neutral-400 uppercase">Proposal Conversion</div>
          <div className="text-3xl font-bold text-emerald-400 mt-2">
            {stats.proposalsCount > 0 ? Math.round((stats.wonCount / stats.proposalsCount) * 100) : 0}%
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-neutral-400 uppercase">Average Deal Size</div>
          <div className="text-3xl font-bold text-amber-400 mt-2">
            ${stats.wonCount > 0 ? Math.round(stats.totalRevenue / stats.wonCount).toLocaleString() : 0}
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" /> Pipeline Conversion Velocity
        </h2>
        <div className="space-y-4">
          {[
            { stage: 'Discovered Prospects', count: stats.totalBusinesses, color: 'bg-blue-600' },
            { stage: 'Websites Audited', count: stats.auditedWebsites, color: 'bg-amber-500' },
            { stage: 'Pitches Generated', count: stats.draftsCount, color: 'bg-purple-500' },
            { stage: 'Outreach Sent', count: stats.sentCount, color: 'bg-cyan-500' },
            { stage: 'Replies Received', count: stats.repliesCount, color: 'bg-pink-500' },
            { stage: 'Contracts Won', count: stats.wonCount, color: 'bg-emerald-500' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-300">{item.stage}</span>
                <span className="text-neutral-400">{item.count} prospects</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
                <div className={`${item.color} h-3 rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(5, (item.count / (stats.totalBusinesses || 1)) * 100))}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
