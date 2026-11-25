import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { DiscoverLeads } from './components/DiscoverLeads';
import { BusinessesView } from './components/BusinessesView';
import { WebsiteAudits } from './components/WebsiteAudits';
import { OutreachCampaigns } from './components/OutreachCampaigns';
import { EmailCentre } from './components/EmailCentre';
import { SalesPipeline } from './components/SalesPipeline';
import { DealsRevenue } from './components/DealsRevenue';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { Stats, Business } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBusinessesList = async () => {
    try {
      const res = await fetch('/api/businesses');
      const data = await res.json();
      setBusinesses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchBusinessesList();
  }, []);

  const handleResetDemo = async () => {
    if (!confirm('Are you sure you want to reset and re-seed all demo data?')) return;
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchStats();
        fetchBusinessesList();
        setCurrentTab('overview');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAuditFromBusiness = (businessId: string, url: string) => {
    setCurrentTab('audits');
  };

  const handleGeneratePitchFromBusiness = (businessId: string) => {
    setCurrentTab('emails');
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'overview' && (
          <OverviewDashboard stats={stats} onNavigate={setCurrentTab} onResetDemo={handleResetDemo} />
        )}
        {currentTab === 'discover' && (
          <DiscoverLeads onRefresh={() => { fetchStats(); fetchBusinessesList(); }} />
        )}
        {currentTab === 'businesses' && (
          <BusinessesView
            onRunAudit={handleRunAuditFromBusiness}
            onGeneratePitch={handleGeneratePitchFromBusiness}
          />
        )}
        {currentTab === 'audits' && (
          <WebsiteAudits businesses={businesses} onRefreshStats={fetchStats} />
        )}
        {currentTab === 'campaigns' && (
          <OutreachCampaigns onRefreshStats={fetchStats} />
        )}
        {currentTab === 'emails' && (
          <EmailCentre businesses={businesses} onRefreshStats={fetchStats} />
        )}
        {currentTab === 'pipeline' && (
          <SalesPipeline />
        )}
        {currentTab === 'deals' && (
          <DealsRevenue businesses={businesses} onRefreshStats={fetchStats} />
        )}
        {currentTab === 'analytics' && (
          <AnalyticsView stats={stats} />
        )}
        {currentTab === 'settings' && (
          <SettingsView onResetDemo={handleResetDemo} />
        )}
      </main>
    </div>
  );
}
