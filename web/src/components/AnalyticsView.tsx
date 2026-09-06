import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Users, 
  Download, 
  Building2, 
  Sparkles,
  Calendar
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';

export const AnalyticsView: React.FC = () => {
  const currentSalon = salonStore.getActiveSalon();
  const allSalons = salonStore.getAllSalons();
  const appointments = salonStore.getAppointments();
  const services = salonStore.getServices();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Multi-Salon Revenue Simulation
  const salon1Revenue = 12450;
  const salon2Revenue = 8900;
  const combinedRevenue = salon1Revenue + salon2Revenue;

  // Peak Hours distribution data
  const peakHours = [
    { hour: '10 AM', count: 3, percentage: 35 },
    { hour: '11 AM', count: 7, percentage: 85 },
    { hour: '12 PM', count: 8, percentage: 95 },
    { hour: '01 PM', count: 5, percentage: 60 },
    { hour: '02 PM', count: 2, percentage: 25 },
    { hour: '03 PM', count: 4, percentage: 45 },
    { hour: '04 PM', count: 6, percentage: 70 },
    { hour: '05 PM', count: 8, percentage: 95 },
    { hour: '06 PM', count: 9, percentage: 100 },
    { hour: '07 PM', count: 7, percentage: 80 },
    { hour: '08 PM', count: 4, percentage: 50 },
  ];

  // Best Selling Services
  const topServices = [
    { name: 'Western Gentlemen Combo', bookings: 42, revenue: 15960, share: 38 },
    { name: 'Signature Fade & Scissor Cut', bookings: 55, revenue: 13750, share: 32 },
    { name: 'Activated Charcoal Facial', bookings: 16, revenue: 8800, share: 18 },
    { name: 'Royal Beard Sculpt & Hot Towel', bookings: 28, revenue: 5040, share: 12 },
  ];

  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Service,Bookings,Revenue (INR),Share\n"
      + topServices.map(e => `"${e.name}",${e.bookings},${e.revenue},${e.share}%`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wbs_financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Owner Financial Intelligence</span>
          <h2 className="text-2xl font-bold font-serif text-white">Business Performance &amp; Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">
            Revenue trends, peak chair utilization hours, best-selling packages, and multi-branch reports.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-1 flex space-x-1 text-xs font-semibold">
            {(['today', 'week', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg capitalize transition ${
                  timeRange === range
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Multi-Salon Combined Overview Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> Multi-Salon Network Revenue
          </span>
          <span className="text-xs font-mono text-slate-400">Across {allSalons.length} Locations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">Total Combined Revenue</span>
            <span className="text-2xl font-black font-mono text-white mt-1 block">
              ₹{combinedRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +24% growth vs last month
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">1. Western Boys Salon (Jaipur)</span>
            <span className="text-xl font-black font-mono text-amber-400 mt-1 block">
              ₹{salon1Revenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Flagship • 68 bookings</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs text-slate-400 block">2. Western Grooming Lounge (Udaipur)</span>
            <span className="text-xl font-black font-mono text-amber-400 mt-1 block">
              ₹{salon2Revenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Branch • 44 bookings</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Peak Hours Breakdown (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Peak Hours Utilization
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Assists with shift scheduling and barber chair allocation</p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-semibold">12 PM &amp; 6 PM Peak</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {peakHours.map((slot) => (
              <div key={slot.hour} className="flex items-center text-xs space-x-3">
                <span className="w-14 text-slate-400 font-mono text-right">{slot.hour}</span>
                <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      slot.percentage >= 90
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                        : slot.percentage >= 60
                        ? 'bg-amber-500/70'
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${slot.percentage}%` }}
                  ></div>
                </div>
                <span className="w-12 font-mono text-slate-300 font-semibold">{slot.count} visits</span>
              </div>
            ))}
          </div>
        </div>

        {/* Best Selling Services Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold font-serif text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Top Performing Services
          </h3>
          <p className="text-xs text-slate-400 mb-4">Highest revenue generating grooming packages</p>

          <div className="space-y-4">
            {topServices.map((serv, index) => (
              <div key={serv.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate max-w-[200px]">
                    #{index + 1} {serv.name}
                  </span>
                  <span className="font-mono font-bold text-amber-400">₹{serv.revenue.toLocaleString()}</span>
                </div>
                
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${serv.share * 2.5}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{serv.bookings} appointments booked</span>
                  <span>{serv.share}% of gross revenue</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
