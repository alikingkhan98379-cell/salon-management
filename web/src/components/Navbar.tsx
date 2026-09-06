import React from 'react';
import { 
  Scissors, 
  Crown, 
  Tv, 
  UserCheck, 
  Calendar, 
  MessageSquare, 
  Layers, 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  Building2,
  Bell,
  Clock,
  LogOut,
  User
} from 'lucide-react';
import { UserRole, Salon } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  userName: string;
  isMultiSalonOwner: boolean;
  onOpenSalonPicker: () => void;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeSalon: Salon;
  currentServingToken?: string;
  waitingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  userName,
  isMultiSalonOwner,
  onOpenSalonPicker,
  onLogout,
  activeTab,
  onTabChange,
  activeSalon,
  currentServingToken,
  waitingCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Top Banner with Brand, Active Salon, and User Profile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/30">
              <Scissors className="w-5 h-5 text-slate-950 font-bold -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wider text-lg font-serif text-white flex items-center gap-1.5">
                  WESTERN BOYS <Crown className="w-4 h-4 text-amber-400 inline" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  SaaS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                {activeSalon.name} • {activeSalon.city}
              </p>
            </div>
          </div>

          {/* Center Status Pill: Live Now Serving */}
          <div className="hidden md:flex items-center space-x-3 bg-slate-900/90 border border-slate-800 rounded-full px-4 py-1.5 shadow-inner">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-400">Now Serving:</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                {currentServingToken || 'None'}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="text-xs text-slate-400">
              In Queue: <span className="text-white font-semibold">{waitingCount}</span>
            </div>
          </div>

          {/* Right Controls: Salon Picker (for multi-owners) + User Badge + Logout */}
          <div className="flex items-center space-x-2.5">
            
            {/* Multi-Salon Switcher (only shown if user owns > 1 salon) */}
            {isMultiSalonOwner && (
              <button
                type="button"
                onClick={onOpenSalonPicker}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-xl px-3 py-1.5 transition shadow-sm"
                title="Switch between your salons"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch Salon</span>
              </button>
            )}

            {/* Authenticated User Badge */}
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                {userName[0].toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-white leading-none truncate max-w-[110px]">{userName}</p>
                <p className="text-[10px] font-mono font-semibold text-amber-400 uppercase leading-none mt-0.5">
                  {currentRole.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* TV Display Button */}
            <button
              onClick={() => onTabChange('display')}
              className={`p-2 rounded-xl transition-colors border ${
                activeTab === 'display'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-amber-400'
              }`}
              title="Open Reception TV Display"
            >
              <Tv className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl border border-slate-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Navigation Tabs based on Current Authenticated Role */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          
          {/* Dashboard (Owner, Manager, Super Admin) */}
          {currentRole !== 'staff' && (
            <>
              <button
                onClick={() => onTabChange('dashboard')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Dashboard &amp; Queue</span>
              </button>

              <button
                onClick={() => onTabChange('queue')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'queue'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Live Tokens</span>
              </button>
            </>
          )}

          {/* Customer / Self-Service Tabs */}
          <button
            onClick={() => onTabChange('book')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'book'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Book Online (In-Salon / Home)</span>
          </button>

          <button
            onClick={() => onTabChange('track')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'track'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Check My Token</span>
          </button>

          {/* WhatsApp Bot Simulator */}
          <button
            onClick={() => onTabChange('whatsapp')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/30'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Bot Simulator</span>
          </button>

          {/* Staff specific tab */}
          {(currentRole === 'staff' || currentRole === 'salon_owner' || currentRole === 'manager') && (
            <button
              onClick={() => onTabChange('staff')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Barber Portal</span>
            </button>
          )}

          {/* Owner & Manager tabs */}
          {(currentRole === 'salon_owner' || currentRole === 'manager') && (
            <>
              <button
                onClick={() => onTabChange('services')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'services'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Services &amp; Dual Pricing</span>
              </button>

              <button
                onClick={() => onTabChange('inventory')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'inventory'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Inventory Alerts</span>
              </button>

              <button
                onClick={() => onTabChange('customers')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'customers'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Customer CRM</span>
              </button>

              <button
                onClick={() => onTabChange('invoices')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'invoices'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>GST Invoices</span>
              </button>
            </>
          )}

          {/* Owner only Analytics */}
          {currentRole === 'salon_owner' && (
            <button
              onClick={() => onTabChange('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Owner Analytics</span>
            </button>
          )}

          {/* Super Admin Tab */}
          {currentRole === 'super_admin' && (
            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Platform Tenants &amp; Plans</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
