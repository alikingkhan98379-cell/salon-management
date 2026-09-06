import React, { useState, useEffect, useRef } from 'react';
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
  X, 
  AlertTriangle, 
  LogOut, 
  FileText, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  RefreshCw, 
  Eye,
  Sliders,
  DollarSign
} from 'lucide-react';
import { salonDataService } from '../lib/salonDataService';
import { Salon, AdminAuditLog } from '../types';

interface SuperAdminConsoleProps {
  adminEmail?: string;
  onLogout?: () => void;
}

export const SuperAdminConsole: React.FC<SuperAdminConsoleProps> = ({
  adminEmail = 'saifaliansari983790@gmail.com',
  onLogout
}) => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifyingSecurity, setIsVerifyingSecurity] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'salons' | 'analytics' | 'audit'>('salons');

  // Salon Inspection Modal (Read-Only)
  const [inspectingSalon, setInspectingSalon] = useState<Salon | null>(null);

  // Inactivity 30-Minute Timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800); // 30 minutes
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Server-Side Security Verification on Mount
  useEffect(() => {
    const verifyAdmin = async () => {
      setIsVerifyingSecurity(true);
      try {
        const isSuperAdmin = await salonDataService.checkIsSuperAdmin(adminEmail);
        setIsAuthorized(isSuperAdmin);

        if (isSuperAdmin) {
          const all = await salonDataService.getAllSalons();
          setSalons(all);
          setAuditLogs(salonDataService.getAdminAuditLogs());

          // Log access
          await salonDataService.logAdminAction(
            adminEmail,
            'ADMIN_CONSOLE_ACCESS',
            undefined,
            { userAgent: navigator.userAgent }
          );
        }
      } catch (err) {
        console.error('Security verification failed:', err);
        setIsAuthorized(false);
      } finally {
        setIsVerifyingSecurity(false);
      }
    };

    verifyAdmin();
  }, [adminEmail]);

  // 2. 30-Minute Inactivity Auto-Logout
  useEffect(() => {
    const resetTimer = () => {
      setSecondsRemaining(1800);
    };

    const handleInactivityTick = () => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (onLogout) onLogout();
          return 0;
        }
        return prev - 1;
      });
    };

    const interval = setInterval(handleInactivityTick, 1000);

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('scroll', resetTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [onLogout]);

  const loadData = async () => {
    const all = await salonDataService.getAllSalons();
    setSalons(all);
    setAuditLogs(salonDataService.getAdminAuditLogs());
  };

  // Actions
  const handleExtendTrial = async (salon: Salon) => {
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    salon.subscription_status = 'trial';
    salon.trial_ends_at = newExpiry;
    salon.subscription_expires_at = newExpiry;

    await salonDataService.logAdminAction(
      adminEmail,
      'EXTEND_TRIAL_7_DAYS',
      salon.id,
      { newExpiry }
    );
    loadData();
  };

  const handleActivateSubscription = async (salon: Salon) => {
    await salonDataService.renewSubscription(salon.id, 'base_monthly', 'monthly');
    await salonDataService.logAdminAction(
      adminEmail,
      'MANUAL_ACTIVATE_SUBSCRIPTION',
      salon.id,
      { plan: 'base_monthly' }
    );
    loadData();
  };

  const handleMarkExpired = async (salon: Salon) => {
    salon.subscription_status = 'expired';
    await salonDataService.logAdminAction(
      adminEmail,
      'MANUAL_EXPIRE_SALON',
      salon.id,
      { previousStatus: salon.subscription_status }
    );
    loadData();
  };

  if (isVerifyingSecurity) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Verifying Super Admin Server Security...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 bg-slate-900 border border-rose-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif text-white">403 Forbidden Access</h2>
        <p className="text-xs text-slate-300">
          Your account ({adminEmail}) is not authorized as a platform Super Admin. This route is strictly protected via server-side verification.
        </p>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
          >
            Return to Login
          </button>
        )}
      </div>
    );
  }

  const filteredSalons = salons.filter(s =>
    !searchQuery ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.owner_name && s.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // City-wise aggregation
  const cityDistribution: Record<string, number> = {};
  salons.forEach(s => {
    const c = s.city || 'Other';
    cityDistribution[c] = (cityDistribution[c] || 0) + 1;
  });

  const minutesLeft = Math.floor(secondsRemaining / 60);
  const secondsLeft = secondsRemaining % 60;

  return (
    <div className="space-y-6 animate-fadeIn font-sans">

      {/* Super Admin Top Security Bar */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Oversight
            </span>
            <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
              ● Server-Side RPC Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white flex items-center gap-2">
            Multi-Tenant Platform Console
            <Crown className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global directory management, subscription oversight, and trial controls across India.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl">
          <div className="text-xs">
            <div className="font-bold text-slate-200">{adminEmail}</div>
            <div className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Inactivity Timeout: </span>
              <strong className="text-amber-300">{minutesLeft}:{secondsLeft.toString().padStart(2, '0')}</strong>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition"
              title="Secure Admin Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('salons')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'salons'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>All Salons &amp; Subscriptions ({salons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>India-Wide City Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Admin Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Salons & Subscriptions Table */}
      {activeTab === 'salons' && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search salons by name, city, state, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-2xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Salons</span>
            </button>
          </div>

          {/* Salons Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Salon &amp; Location</th>
                    <th className="p-4">Owner Contact</th>
                    <th className="p-4">Subscription Status</th>
                    <th className="p-4">Trial / Expiry</th>
                    <th className="p-4 text-right">Oversight Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSalons.map((salon) => {
                    const isTrial = salon.subscription_status === 'trial';
                    const isActive = salon.subscription_status === 'active';
                    const isExpired = salon.subscription_status === 'expired';

                    return (
                      <tr key={salon.id} className="hover:bg-slate-800/40 transition">
                        
                        {/* Salon Name & City */}
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{salon.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{salon.address}, {salon.city}, {salon.state} {salon.pincode && `(${salon.pincode})`}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ID: {salon.id.slice(0, 10)}... • Slug: {salon.slug}
                          </div>
                        </td>

                        {/* Owner Info */}
                        <td className="p-4">
                          <div className="font-semibold text-slate-200">
                            {salon.owner_name || 'Registered Owner'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {salon.phone}
                          </div>
                          {salon.owner_email && (
                            <div className="text-[10px] text-slate-500">{salon.owner_email}</div>
                          )}
                        </td>

                        {/* Subscription Status */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isTrial
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {isTrial && <Clock className="w-3 h-3" />}
                            {isActive && <CheckCircle2 className="w-3 h-3" />}
                            {isExpired && <XCircle className="w-3 h-3" />}
                            <span>{salon.subscription_status}</span>
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1 capitalize">
                            Plan: {salon.subscription_plan.replace('_', ' ')} ({salon.billing_cycle})
                          </div>
                        </td>

                        {/* Expiry Date */}
                        <td className="p-4 font-mono text-[11px] text-slate-300">
                          {salon.subscription_expires_at ? (
                            <div>
                              <div>{new Date(salon.subscription_expires_at).toLocaleDateString()}</div>
                              <div className="text-[10px] text-slate-500">
                                {isExpired ? 'Expired' : 'Active'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectingSalon(salon);
                              salonDataService.logAdminAction(
                                adminEmail,
                                'INSPECT_SALON_DATA',
                                salon.id,
                                { salonName: salon.name }
                              );
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition"
                            title="Inspect Salon"
                          >
                            Inspect
                          </button>

                          {isTrial && (
                            <button
                              type="button"
                              onClick={() => handleExtendTrial(salon)}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-semibold transition"
                              title="Add 7 days to free trial"
                            >
                              +7d Trial
                            </button>
                          )}

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleActivateSubscription(salon)}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition"
                              title="Activate Pro Subscription"
                            >
                              Activate
                            </button>
                          )}

                          {!isExpired && (
                            <button
                              type="button"
                              onClick={() => handleMarkExpired(salon)}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-semibold transition"
                              title="Pause / Expire Salon"
                            >
                              Expire
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: India-Wide City Distribution Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Registered Salons Distribution Across India
            </h3>
            <p className="text-xs text-slate-400">
              City-wise tenant count. Useful for regional expansion and marketing oversight.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {Object.entries(cityDistribution).map(([cityName, count]) => (
                <div key={cityName} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <span className="text-xs font-bold text-amber-400">{cityName}</span>
                  <div className="text-2xl font-black text-white font-mono mt-1">
                    {count} {count === 1 ? 'Salon' : 'Salons'}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {((count / salons.length) * 100).toFixed(0)}% of platform
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Admin Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Immutable Platform Audit Log
              </h3>
              <p className="text-xs text-slate-400">
                All Super Admin actions, inspections, and subscription changes are recorded for security.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-1.5 bg-slate-800 text-xs text-slate-200 rounded-xl"
            >
              Refresh Logs
            </button>
          </div>

          <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 font-mono text-[11px]">{log.action}</span>
                    {log.target_salon_name && (
                      <span className="text-slate-300">on {log.target_salon_name}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    By: {log.admin_email} • {JSON.stringify(log.details)}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspect Salon Modal */}
      {inspectingSalon && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">{inspectingSalon.name}</h3>
                  <span className="text-xs text-slate-400">Read-Only Tenant Inspection</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSalon(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Location</span>
                <span className="text-white font-semibold">{inspectingSalon.address}</span>
                <div className="text-slate-400 mt-0.5">{inspectingSalon.city}, {inspectingSalon.state} {inspectingSalon.pincode}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Subscription</span>
                <span className="text-amber-400 font-bold capitalize">{inspectingSalon.subscription_status}</span>
                <div className="text-slate-400 mt-0.5">Plan: {inspectingSalon.subscription_plan}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Direct UPI ID</span>
                <span className="text-amber-300 font-mono">{inspectingSalon.upi_id || 'Not configured'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">GPS Coordinates</span>
                <span className="text-slate-300 font-mono">
                  {inspectingSalon.latitude ? `${inspectingSalon.latitude.toFixed(4)}, ${inspectingSalon.longitude?.toFixed(4)}` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setInspectingSalon(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default SuperAdminConsole;
