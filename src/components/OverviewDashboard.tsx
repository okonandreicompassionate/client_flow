import React from 'react';
import { Stats } from '../types';
import { 
  Building2, 
  Users, 
  Gauge, 
  Mail, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  FileText, 
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface OverviewProps {
  stats: Stats | null;
  onNavigate: (tab: string) => void;
  onResetDemo: () => void;
}

export const OverviewDashboard: React.FC<OverviewProps> = ({ stats, onNavigate, onResetDemo }) => {
  if (!stats) return <div className="p-8 text-neutral-400">Loading metrics...</div>;

  const cards = [
    { label: 'Total Businesses', value: stats.totalBusinesses, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10', tab: 'businesses' },
    { label: 'Qualified Leads', value: stats.qualifiedLeads, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', tab: 'businesses' },
    { label: 'Websites Audited', value: stats.auditedWebsites, icon: Gauge, color: 'text-amber-400', bg: 'bg-amber-500/10', tab: 'audits' },
    { label: 'Emails Drafted', value: stats.draftsCount, icon: Mail, color: 'text-purple-400', bg: 'bg-purple-500/10', tab: 'emails' },
    { label: 'Emails Sent', value: stats.sentCount, icon: Send, color: 'text-cyan-400', bg: 'bg-cyan-500/10', tab: 'campaigns' },
    { label: 'Replies Received', value: stats.repliesCount, icon: MessageSquare, color: 'text-pink-400', bg: 'bg-pink-500/10', tab: 'pipeline' },
    { label: 'Proposals Sent', value: stats.proposalsCount, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10', tab: 'pipeline' },
    { label: 'Contracts Won', value: stats.wonCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', tab: 'deals' },
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10', tab: 'deals' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Client Acquisition Control Centre
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Mode
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Tracking your pipeline toward 100 qualified prospects and 5 closed web development clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onResetDemo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium border border-neutral-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reset Demo Data
          </button>
          <button
            onClick={() => onNavigate('discover')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/25 transition-colors"
          >
            Discover New Leads <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(c.tab)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-all cursor-pointer group shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{c.label}</p>
                <p className="text-3xl font-bold text-white mt-1 group-hover:text-blue-400 transition-colors">{c.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${c.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel & Conversion Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Outreach & Sales Funnel
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Discovered Businesses', count: stats.totalBusinesses, pct: 100, color: 'bg-blue-600' },
              { label: 'Websites Audited', count: stats.auditedWebsites, pct: Math.round((stats.auditedWebsites / (stats.totalBusinesses || 1)) * 100), color: 'bg-amber-500' },
              { label: 'Pitches Generated', count: stats.draftsCount, pct: Math.round((stats.draftsCount / (stats.totalBusinesses || 1)) * 100), color: 'bg-purple-500' },
              { label: 'Outreach Sent', count: stats.sentCount, pct: Math.round((stats.sentCount / (stats.totalBusinesses || 1)) * 100), color: 'bg-cyan-500' },
              { label: 'Replies / Interested', count: stats.interestedCount, pct: Math.round((stats.interestedCount / (stats.totalBusinesses || 1)) * 100), color: 'bg-pink-500' },
              { label: 'Contracts Won', count: stats.wonCount, pct: Math.round((stats.wonCount / (stats.totalBusinesses || 1)) * 100), color: 'bg-emerald-500' },
            ].map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-300">{f.label}</span>
                  <span className="text-neutral-400">{f.count} ({f.pct}%)</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div className={`${f.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, f.pct)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Agency Target Progress</h2>
            <p className="text-sm text-neutral-400 mb-6">
              You are currently working towards acquiring your first 5 high-value web development retainer clients.
            </p>
            <div className="bg-neutral-800/60 rounded-xl p-5 border border-neutral-700/60 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-200">Closed Clients</span>
                <span className="text-lg font-bold text-emerald-400">{stats.wonCount} / 5</span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-3 overflow-hidden">
                <div className="bg-emerald-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, (stats.wonCount / 5) * 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-700/50">
                <span>Total Pipeline Revenue</span>
                <span className="font-semibold text-amber-400">${stats.totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate('pipeline')}
              className="w-full py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-sm border border-neutral-700 transition-colors flex items-center justify-center gap-2"
            >
              Open CRM Pipeline <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
