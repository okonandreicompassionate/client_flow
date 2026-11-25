import React, { useState, useEffect } from 'react';
import { Deal, Business } from '../types';
import { DollarSign, Plus, CheckCircle2, FileText, Calendar } from 'lucide-react';

interface DealsRevenueProps {
  businesses: Business[];
  onRefreshStats: () => void;
}

export const DealsRevenue: React.FC<DealsRevenueProps> = ({ businesses, onRefreshStats }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [businessId, setBusinessId] = useState('');
  const [serviceSold, setServiceSold] = useState('Full Website Redesign & SEO');
  const [proposalAmount, setProposalAmount] = useState('2500');
  const [quotedPrice, setQuotedPrice] = useState('2500');
  const [depositAmount, setDepositAmount] = useState('1250');
  const [contractStatus, setContractStatus] = useState('Signed');
  const [finalRevenue, setFinalRevenue] = useState('2500');
  const [notification, setNotification] = useState<string | null>(null);

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals');
      const data = await res.json();
      setDeals(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const biz = businesses.find(b => b.id === businessId);
    if (!biz) return;

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_name: biz.name,
          service_sold: serviceSold,
          proposal_amount: Number(proposalAmount),
          quoted_price: Number(quotedPrice),
          deposit_amount: Number(depositAmount),
          payment_status: Number(depositAmount) > 0 ? 'Deposit Paid' : 'Pending',
          project_status: 'In Progress',
          expected_completion: '2026-12-31',
          contract_status: contractStatus,
          final_revenue: contractStatus === 'Signed' ? Number(finalRevenue) : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotification('Successfully recorded client deal and contract!');
        setShowModal(false);
        fetchDeals();
        onRefreshStats();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalRevenue = deals.reduce((sum, d) => sum + (d.final_revenue || 0), 0);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Deals, Contracts & Revenue</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage signed client contracts, deposits, project status, and total revenue.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/25 transition-colors"
        >
          <Plus className="w-4 h-4" /> Record New Deal
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Revenue Metric Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="text-xs font-medium text-neutral-400 uppercase">Total Confirmed Revenue</div>
          <div className="text-3xl font-bold text-amber-400 mt-2">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="text-xs font-medium text-neutral-400 uppercase">Signed Contracts</div>
          <div className="text-3xl font-bold text-emerald-400 mt-2">{deals.filter(d => d.contract_status === 'Signed').length}</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="text-xs font-medium text-neutral-400 uppercase">Average Deal Size</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">
            ${deals.length > 0 ? Math.round(totalRevenue / deals.length).toLocaleString() : 0}
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-4 px-6">Client Name</th>
                <th className="py-4 px-6">Service Sold</th>
                <th className="py-4 px-6">Quoted Price</th>
                <th className="py-4 px-6">Deposit</th>
                <th className="py-4 px-6">Contract Status</th>
                <th className="py-4 px-6">Project Status</th>
                <th className="py-4 px-6 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-sm">
              {deals.map((d) => (
                <tr key={d.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">{d.client_name || d.business_name}</td>
                  <td className="py-4 px-6 text-neutral-300">{d.service_sold}</td>
                  <td className="py-4 px-6 text-neutral-200">${d.quoted_price?.toLocaleString()}</td>
                  <td className="py-4 px-6 text-emerald-400">${d.deposit_amount?.toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {d.contract_status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-neutral-300">{d.project_status}</td>
                  <td className="py-4 px-6 text-right font-bold text-amber-400">${d.final_revenue?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-55">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-bold text-white">Record New Client Deal</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Business Prospect *</label>
                <select
                  required
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Business --</option>
                  {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Service Sold *</label>
                <input
                  type="text"
                  required
                  value={serviceSold}
                  onChange={(e) => setServiceSold(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Quoted Price ($)</label>
                  <input
                    type="number"
                    value={quotedPrice}
                    onChange={(e) => setQuotedPrice(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Deposit Amount ($)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Contract Status</label>
                  <select
                    value={contractStatus}
                    onChange={(e) => setContractStatus(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Signed">Signed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Final Revenue ($)</label>
                  <input
                    type="number"
                    value={finalRevenue}
                    onChange={(e) => setFinalRevenue(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
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
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
