import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Building2, 
  Gauge, 
  Send, 
  Mail, 
  Kanban, 
  DollarSign, 
  BarChart3, 
  Settings,
  Flame,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'discover', label: 'Discover Leads', icon: Search },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'audits', label: 'Website Audits', icon: Gauge },
  { id: 'campaigns', label: 'Outreach Campaigns', icon: Send },
  { id: 'emails', label: 'Email Centre', icon: Mail },
  { id: 'pipeline', label: 'Sales Pipeline', icon: Kanban },
  { id: 'deals', label: 'Deals & Revenue', icon: DollarSign },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, collapsed, setCollapsed }) => {
  return (
    <aside aria-label="Sidebar Navigation" className={`bg-neutral-900 border-r border-neutral-800 flex flex-col transition-all duration-300 relative ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white tracking-wider text-lg">CLIENTFLOW</span>
              <span className="text-xs text-neutral-400 font-medium">Sales Automation</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 overflow-y-auto space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-neutral-800 text-xs text-neutral-400">
          <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50">
            <div className="font-semibold text-neutral-300 mb-1">Target: 100 Prospects</div>
            <div className="w-full bg-neutral-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <div className="mt-2 text-[11px] text-neutral-400 flex justify-between">
              <span>5 Clients Goal</span>
              <span className="text-blue-400 font-medium">Active</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
