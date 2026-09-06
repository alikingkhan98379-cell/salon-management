import React, { useState } from 'react';
import { 
  Crown, 
  Building2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  Sparkles,
  Search,
  X
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';
import { Salon } from '../types';

export const SuperAdminConsole: React.FC = () => {
  const salons = salonStore.getAllSalons();
  const [showAddSalonModal, setShowAddSalonModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Salon Form
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  const filteredSalons = salons.filter(s =>
    !searchQuery ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSalon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city || !phone) return;
    salonStore.addNewSalon(name, city, phone);
    setName('');
    setCity('');
    setPhone('');
    setShowAddSalonModal(false);
  };

  const handleUpdatePlan = (salonId: string, plan: Salon['subscription_plan'], cycle: Salon['billing_cycle']) => {
    salonStore.updateSalonSubscription(salonId, plan, cycle);
  };

  return (
    <div className="space-y-6">
      
      {/* Platform Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Platform Super Admin</span>
            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/30">
              Multi-Tenant Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-white mt-1">Tenant Salons &amp; SaaS Subscriptions</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage onboarding, tenant database isolation, and SaaS subscription tiers across all onboarded salons.
          </p>
        </div>

        <button
          onClick={() => setShowAddSalonModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Salon</span>
        </button>
      </div>

      {/* Subscription Pricing Tiers Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Monthly Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Standard Tier</span>
          <h3 className="text-lg font-bold text-white mt-1">Base Monthly</h3>
          <div className="flex items-baseline space-x-1 my-3">
            <span className="text-3xl font-black font-mono text-white">₹49</span>
            <span className="text-xs text-slate-400">/ month per salon</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
            <li className="flex items-center gap-1.5">✓ Full Multi-Tenant Isolation</li>
            <li className="flex items-center gap-1.5">✓ WhatsApp Booking Bot</li>
            <li className="flex items-center gap-1.5">✓ Unlimited Barbers &amp; Tokens</li>
          </ul>
        </div>

        {/* 6-Month Plan */}
        <div className="bg-gradient-to-b from-slate-900 to-amber-950/20 border-2 border-amber-500/40 rounded-2xl p-5 relative overflow-hidden">
          <span className="absolute top-3 right-3 text-[9px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            15% OFF
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Semi-Annual Tier</span>
          <h3 className="text-lg font-bold text-white mt-1">6-Month Plan</h3>
          <div className="flex items-baseline space-x-1 my-3">
            <span className="text-3xl font-black font-mono text-amber-400">₹250</span>
            <span className="text-xs text-slate-400">for 6 months (₹41/mo)</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
            <li className="flex items-center gap-1.5">✓ 15% Savings vs Monthly</li>
            <li className="flex items-center gap-1.5">✓ Priority Support &amp; Onboarding</li>
            <li className="flex items-center gap-1.5">✓ Reception TV Kiosk Mode</li>
          </ul>
        </div>

        {/* 1-Year Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <span className="absolute top-3 right-3 text-[9px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            20% OFF
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Annual Tier</span>
          <h3 className="text-lg font-bold text-white mt-1">1-Year Plan</h3>
          <div className="flex items-baseline space-x-1 my-3">
            <span className="text-3xl font-black font-mono text-white">₹470</span>
            <span className="text-xs text-slate-400">for 12 months (₹39/mo)</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
            <li className="flex items-center gap-1.5">✓ Maximum 20% Savings</li>
            <li className="flex items-center gap-1.5">✓ Custom Domain Support</li>
            <li className="flex items-center gap-1.5">✓ Dedicated Account Manager</li>
          </ul>
        </div>

      </div>

      {/* Salons Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" /> Active Salon Tenants ({salons.length})
          </h3>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search salon or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/80">
                <th className="py-3 px-4">Salon Name</th>
                <th className="py-3 px-4">City / Address</th>
                <th className="py-3 px-4">Subscription Tier</th>
                <th className="py-3 px-4">Billing Cycle</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Plan Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSalons.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white flex items-center space-x-2">
                      <span>{s.name}</span>
                      {s.slug === 'western-boys-salon' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-bold border border-amber-500/30">
                          FLAGSHIP
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-white">{s.city}</div>
                    <div className="text-[10px] text-slate-400">{s.address}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-amber-400">
                    {s.subscription_plan === 'base_monthly' ? 'Base Monthly (₹49/mo)' :
                     s.subscription_plan === 'half_yearly' ? '6-Month Plan (-15%)' :
                     '1-Year Plan (-20%)'}
                  </td>
                  <td className="py-3.5 px-4 capitalize font-mono text-slate-300">
                    {s.billing_cycle.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.subscription_status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {s.subscription_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleUpdatePlan(s.id, 'base_monthly', 'monthly')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold border border-slate-700"
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => handleUpdatePlan(s.id, 'half_yearly', '6_months')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-[10px] font-semibold border border-slate-700"
                    >
                      6-Mo (-15%)
                    </button>
                    <button
                      onClick={() => handleUpdatePlan(s.id, 'yearly', '1_year')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[10px] font-semibold border border-slate-700"
                    >
                      1-Yr (-20%)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ONBOARD NEW SALON MODAL */}
      {showAddSalonModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" /> Onboard New Salon Tenant
              </h3>
              <button onClick={() => setShowAddSalonModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSalon} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Salon Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Crown Barbershop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jodhpur"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Owner Contact Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98290 55667"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddSalonModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Activate Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
