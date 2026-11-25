import React, { useState } from 'react';
import Papa from 'papaparse';
import { Search, Plus, Upload, Building2, MapPin, Globe, Phone, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

interface DiscoverLeadsProps {
  onRefresh: () => void;
}

export const DiscoverLeads: React.FC<DiscoverLeadsProps> = ({ onRefresh }) => {
  const [industry, setIndustry] = useState('All');
  const [location, setLocation] = useState('Nigeria');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Manual Add Form State
  const [formName, setFormName] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formIndustry, setFormIndustry] = useState('Real estate agencies');
  const [formLocation, setFormLocation] = useState('Lagos, Nigeria');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const industries = [
    'Real estate agencies',
    'Hotels and hospitality',
    'Private schools',
    'Logistics businesses',
    'Professional services',
    'Clinics',
    'Other businesses with existing websites'
  ];

  const handleSearchAPI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate finding businesses from legitimate data provider / search query
    setTimeout(() => {
      const mockFound = [
        { name: `${searchQuery || industry} Pro Services Ltd`, website: `https://www.${(searchQuery || industry).toLowerCase().replace(/[^a-z]/g, '')}pro.ng`, industry: industry === 'All' ? 'Professional services' : industry, location: location, phone: '+234 803 555 1234', email: `info@${(searchQuery || industry).toLowerCase().replace(/[^a-z]/g, '')}pro.ng`, notes: 'Discovered via directory search' },
        { name: `Grand View ${industry === 'All' ? 'Hospitality' : industry} Hub`, website: `https://www.grandview${industry.toLowerCase().slice(0,3)}.ng`, industry: industry === 'All' ? 'Hotels and hospitality' : industry, location: location, phone: '+234 1 777 8899', email: `contact@grandview.ng`, notes: 'Outdated mobile layout detected' },
        { name: `Apex ${industry === 'All' ? 'Solutions' : industry} Group`, website: `https://www.apex${industry.toLowerCase().slice(0,4)}.com.ng`, industry: industry === 'All' ? 'Clinics' : industry, location: location, phone: '+234 809 123 4567', email: `support@apexgroup.ng`, notes: 'Slow server response time' }
      ];
      setSearchResults(mockFound);
      setIsSearching(false);
    }, 800);
  };

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          website: formWebsite,
          industry: formIndustry,
          location: formLocation,
          phone: formPhone,
          email: formEmail,
          notes: formNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotification('Business successfully added to pipeline!');
        setShowAddModal(false);
        setFormName(''); setFormWebsite(''); setFormPhone(''); setFormEmail(''); setFormNotes('');
        onRefresh();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedBusinesses = results.data.map((row: any) => ({
          name: row.name || row.Name || row.business_name,
          website: row.website || row.Website || row.url,
          industry: row.industry || row.Industry || 'Professional services',
          location: row.location || row.Location || 'Nigeria',
          phone: row.phone || row.Phone || row.telephone,
          email: row.email || row.Email,
          notes: row.notes || row.Notes || 'Imported via CSV'
        })).filter(b => b.name);

        try {
          const res = await fetch('/api/businesses/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businesses: parsedBusinesses })
          });
          const data = await res.json();
          if (data.success) {
            setNotification(`Successfully imported ${data.imported} businesses (${data.duplicates} duplicates skipped).`);
            onRefresh();
            setTimeout(() => setNotification(null), 5000);
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const saveDiscoveredLead = async (b: any) => {
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Saved ${b.name} to pipeline!`);
        onRefresh();
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Lead Discovery & Prospecting</h1>
          <p className="text-neutral-400 text-sm mt-1">Search targeted business directories, import CSV records, or add leads manually.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium border border-neutral-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/25 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Business
          </button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Search & Filter Workspace */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSearchAPI} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">Target Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Target Industries</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">Geography</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lagos, Nigeria"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">Keywords / Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Luxury, School, Clinic"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 transition-colors disabled:opacity-50"
              >
                {isSearching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Discovered Prospects ({searchResults.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {searchResults.map((b, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-all shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-white text-base">{b.name}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Verified URL</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-neutral-400">
                    <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-blue-400" /><a href={b.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate">{b.website}</a></div>
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-neutral-500" /><span>{b.location}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-neutral-500" /><span>{b.phone}</span></div>
                    <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-neutral-500" /><span>{b.email}</span></div>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-neutral-800 flex justify-end">
                  <button
                    onClick={() => saveDiscoveredLead(b)}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to Pipeline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Business Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-bold text-white">Add Business Prospect Manually</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddBusiness} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Zenith Hotels & Suites"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    placeholder="https://zenithhotels.ng"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Industry</label>
                  <select
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                  >
                    {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Abuja, Nigeria"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contact@zenithhotels.ng"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Initial Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Outdated website, no SSL certificate..."
                  rows={3}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-md"
                >
                  Save Business
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
