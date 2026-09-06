import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Volume2, 
  Plus, 
  AlertTriangle, 
  Sparkles, 
  Phone, 
  User, 
  Car,
  Check,
  X
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';
import { Token, Appointment, Service, InventoryItem } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onSelectTokenForInvoice?: (token: Token) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const currentSalon = salonStore.getActiveSalon();
  const currentlyServing = salonStore.getCurrentlyServingToken();
  const waitingTokens = salonStore.getWaitingTokens();
  const appointments = salonStore.getAppointments();
  const services = salonStore.getServices();
  const staffMembers = salonStore.getStaff();
  const inventory = salonStore.getInventory();

  // Walk-In Modal State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState(services[0]?.id || '');
  const [walkInServiceType, setWalkInServiceType] = useState<'in_salon' | 'home_service'>('in_salon');
  const [walkInStaffId, setWalkInStaffId] = useState(staffMembers[0]?.id || '');
  const [lastCalledCustomer, setLastCalledCustomer] = useState<string | null>(null);

  // Financial Metrics
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const todayRevenue = appointments
    .filter(a => a.payment_status === 'completed')
    .reduce((acc, a) => acc + a.amount, 0);

  const lowStockItems: InventoryItem[] = inventory.filter(i => i.quantity <= i.low_stock_threshold);

  const handleCallNext = () => {
    const nextToken = salonStore.callNextCustomer();
    if (nextToken) {
      setLastCalledCustomer(nextToken.customer_name);
      setTimeout(() => setLastCalledCustomer(null), 5000);
    }
  };

  const handleCreateWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInPhone) return;

    salonStore.addAppointmentAndToken({
      customer_name: walkInName,
      customer_phone: walkInPhone,
      service_id: walkInServiceId,
      service_type: walkInServiceType,
      staff_id: walkInStaffId || undefined,
      appointment_date: new Date().toISOString().split('T')[0],
      time_slot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      booking_channel: 'walk_in',
      payment_status: 'pending',
      payment_gateway: 'cash',
    });

    setWalkInName('');
    setWalkInPhone('');
    setShowWalkInModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Low Stock Alert Notice if applicable */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between text-amber-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Low Stock Alert ({lowStockItems.length} items)</p>
              <p className="text-xs text-amber-300/80">
                {lowStockItems.map(i => `${i.item_name} (${i.quantity} left)`).join(', ')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('inventory')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
          >
            Manage Inventory &rarr;
          </button>
        </div>
      )}

      {/* Top Banner & Primary Call Next Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Live Queue Spotlight */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-[#121826] to-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-amber-400">Reception Control Board</span>
              <h2 className="text-2xl font-bold font-serif text-white flex items-center gap-2">
                Live Queue Station
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowWalkInModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition shadow-sm"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Quick Walk-In</span>
              </button>
              <button
                onClick={() => onNavigate('display')}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <span>TV Display</span>
              </button>
            </div>
          </div>

          {/* Active Serving Token Section */}
          <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex flex-col items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-mono font-black border-2 border-amber-300">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-900">NOW SERVING</span>
                  <span className="text-3xl font-extrabold">{currentlyServing ? currentlyServing.token_code : '--'}</span>
                </div>
                {currentlyServing && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div>
                {currentlyServing ? (
                  <>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {currentlyServing.customer_name}
                      {currentlyServing.service_type === 'home_service' && (
                        <span className="bg-blue-500/20 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Car className="w-3 h-3" /> Home Visit
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-amber-400/90 font-medium">{currentlyServing.service_name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Stylist: <span className="text-slate-200 font-semibold">{currentlyServing.staff_name || 'Unassigned'}</span>
                    </p>
                  </>
                ) : (
                  <div>
                    <h3 className="text-lg font-bold text-slate-300">No Customer Currently in Chair</h3>
                    <p className="text-xs text-slate-400">Click &quot;Call Next Customer&quot; below to advance the queue.</p>
                  </div>
                )}
              </div>
            </div>

            {/* CALL NEXT CUSTOMER BUTTON */}
            <div className="flex flex-col items-center sm:items-end w-full md:w-auto">
              <button
                onClick={handleCallNext}
                disabled={waitingTokens.length === 0}
                className={`w-full md:w-auto px-6 py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center space-x-2.5 shadow-xl ${
                  waitingTokens.length > 0
                    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 shadow-amber-500/25 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span>CALL NEXT CUSTOMER</span>
              </button>
              
              <div className="mt-2 text-right">
                <span className="text-xs text-slate-400">
                  Waiting in Line: <strong className="text-amber-400 font-mono text-sm">{waitingTokens.length}</strong>
                </span>
                {waitingTokens[0] && (
                  <p className="text-[11px] text-slate-400">
                    Next: <span className="text-slate-200 font-semibold">{waitingTokens[0].token_code}</span> ({waitingTokens[0].customer_name})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Automated Notification Banner on Call */}
          {lastCalledCustomer && (
            <div className="mt-2 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Called <strong>{lastCalledCustomer}</strong>! WhatsApp notification & chime dispatched.</span>
              </div>
            </div>
          )}

          {/* Quick Queue Strip */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
              Next in Line (Live Queue)
            </span>
            {waitingTokens.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Queue is clear. No waiting customers.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {waitingTokens.slice(0, 3).map((tok, idx) => (
                  <div key={tok.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-amber-400 text-sm">#{tok.token_code}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-700 px-1.5 py-0.2 rounded font-sans">
                          #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-white truncate max-w-[120px]">{tok.customer_name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{tok.service_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono font-semibold text-slate-300 block">
                        ~{tok.estimated_wait_minutes}m
                      </span>
                      <span className="text-[9px] text-slate-400">wait</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Metric Highlights */}
        <div className="space-y-4">
          
          {/* Today's Revenue Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Revenue</p>
                <h4 className="text-3xl font-extrabold text-white mt-1 font-mono">
                  {currentSalon.currency_symbol}{todayRevenue.toLocaleString()}
                </h4>
                <div className="flex items-center space-x-1 mt-1 text-emerald-400 text-xs font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18% vs yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Today's Appointments & Service Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Completed</span>
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2">
                {completedAppointments.length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Visits today</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Avg Wait</span>
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2">
                18 <span className="text-xs font-normal text-slate-400">mins</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Queue pacing</p>
            </div>
          </div>

          {/* Active Staff Barbers on Duty */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Stylists on Duty
              </span>
              <span className="text-xs font-bold text-amber-400">{staffMembers.length} Active</span>
            </div>
            <div className="space-y-2">
              {staffMembers.map(st => (
                <div key={st.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                      {st.full_name[0]}
                    </div>
                    <span className="text-slate-200 font-medium">{st.full_name}</span>
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-mono">★ {st.rating}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Today's Appointments & Customer Roster */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-serif">Today&apos;s Appointments Schedule</h3>
            <p className="text-xs text-slate-400">All registered bookings across Web, WhatsApp, and Walk-In channels</p>
          </div>
          <button
            onClick={() => onNavigate('queue')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
          >
            View Full Queue Board &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Token</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Barber</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">
                    {appt.token_code || '--'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-white font-semibold">{appt.customer_name}</div>
                    <div className="text-[10px] text-slate-400">{appt.customer_phone}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    {appt.service_name}
                  </td>
                  <td className="py-3 px-3">
                    {appt.service_type === 'home_service' ? (
                      <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                        <Car className="w-3 h-3" /> Home
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                        In-Salon
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {appt.time_slot}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {appt.staff_name || 'Available'}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-white">
                    ₹{appt.amount}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      appt.payment_status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {appt.payment_status} ({appt.payment_gateway.replace('mock_', '')})
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      appt.status === 'serving'
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : appt.status === 'completed'
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK WALK-IN REGISTRATION MODAL */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> New Walk-In Customer
              </h3>
              <button 
                onClick={() => setShowWalkInModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Singhania"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number (for WhatsApp Token)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98290 11223"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Service</label>
                <select
                  value={walkInServiceId}
                  onChange={(e) => setWalkInServiceId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {services.map((s: Service) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ₹{walkInServiceType === 'home_service' ? s.home_service_price : s.in_salon_price} ({s.duration_minutes}m)
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Location */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkInServiceType('in_salon')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                      walkInServiceType === 'in_salon'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    💈 In-Salon
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkInServiceType('home_service')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition ${
                      walkInServiceType === 'home_service'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    🚗 Home Visit
                  </button>
                </div>
              </div>

              {/* Staff / Barber */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assign Barber</label>
                <select
                  value={walkInStaffId}
                  onChange={(e) => setWalkInStaffId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">Any Available Barber</option>
                  {staffMembers.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} ({st.specialties[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-lg shadow-amber-500/20"
                >
                  Generate Token & Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
