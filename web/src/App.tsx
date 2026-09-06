import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { SalonPickerScreen } from './components/SalonPickerScreen';
import { CustomerMarketplace } from './components/CustomerMarketplace';
import { DashboardView } from './components/DashboardView';
import { QueueManager } from './components/QueueManager';
import { NowServingDisplay } from './components/NowServingDisplay';
import { BookingPortal } from './components/BookingPortal';
import { TokenTracker } from './components/TokenTracker';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { StaffPortal } from './components/StaffPortal';
import { ServicesManager } from './components/ServicesManager';
import { InventoryManager } from './components/InventoryManager';
import { CustomerCRM } from './components/CustomerCRM';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { AnalyticsView } from './components/AnalyticsView';
import { SuperAdminConsole } from './components/SuperAdminConsole';
import { salonDataService, REGISTERED_SALONS } from './lib/salonDataService';
import { salonStore } from './lib/mockStore';
import { supabase } from './lib/supabaseClient';
import { UserRole, Salon } from './types';
import { Scissors, ShieldCheck, Wifi, AlertTriangle } from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  ownedSalonIds?: string[];
  assignedSalonId?: string;
}

export function App() {
  const [, setTick] = useState(0);

  // Authentication & Tenant State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userSalons, setUserSalons] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [isPickerActive, setIsPickerActive] = useState<boolean>(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [trackingTokenCode, setTrackingTokenCode] = useState<string>('WBS-02');

  // 1. Supabase Auth Session Listener
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleAuthenticatedUser(session.user);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          handleAuthenticatedUser(session.user);
        } else {
          setCurrentUser(null);
          setSelectedSalon(null);
          setUserSalons([]);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // 2. Re-render when data service mutates
  useEffect(() => {
    const unsubscribe = salonDataService.subscribe(() => {
      setTick(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  const handleAuthenticatedUser = (user: { id: string; email?: string; user_metadata?: { full_name?: string } }) => {
    // Check if this email matches seed profiles or default to salon_owner
    const email = user.email || '';
    let role: UserRole = 'salon_owner';
    let name = user.user_metadata?.full_name || email.split('@')[0] || 'Salon User';
    let ownedSalonIds = [REGISTERED_SALONS[0].id];
    let assignedSalonId: string | undefined;

    if (email.includes('admin')) {
      role = 'super_admin';
    } else if (email.includes('kabir')) {
      role = 'salon_owner';
      name = 'Kabir Khan';
      ownedSalonIds = [REGISTERED_SALONS[0].id, REGISTERED_SALONS[1].id];
    } else if (email.includes('rishi')) {
      role = 'salon_owner';
      name = 'Rishi Mehra';
      ownedSalonIds = [REGISTERED_SALONS[1].id];
    } else if (email.includes('farhan')) {
      role = 'staff';
      name = 'Farhan Akhtar';
      assignedSalonId = REGISTERED_SALONS[0].id;
    } else if (email.includes('aman')) {
      role = 'manager';
      name = 'Aman Sharma';
      assignedSalonId = REGISTERED_SALONS[0].id;
    }

    const authUser: AuthUser = {
      id: user.id,
      email,
      name,
      role,
      ownedSalonIds,
      assignedSalonId
    };

    resolveSalonForUser(authUser);
  };

  const resolveSalonForUser = async (user: AuthUser) => {
    setCurrentUser(user);

    // Customer route
    if (user.role === 'customer') {
      setActiveTab('marketplace');
      setIsPickerActive(false);
      return;
    }

    // Super Admin route
    if (user.role === 'super_admin') {
      const allSalons = await salonDataService.fetchUserSalons(user);
      setUserSalons(allSalons);
      setSelectedSalon(allSalons[0] || REGISTERED_SALONS[0]);
      salonDataService.setActiveSalonId(allSalons[0]?.id || REGISTERED_SALONS[0].id);
      setActiveTab('admin');
      setIsPickerActive(false);
      return;
    }

    // Salon Owner route (Multi vs Single Salon Logic)
    if (user.role === 'salon_owner') {
      const owned = await salonDataService.fetchUserSalons(user);
      setUserSalons(owned);

      if (owned.length > 1) {
        // Multi-Salon Owner: MUST show Salon Picker first!
        setIsPickerActive(true);
        setSelectedSalon(null);
      } else if (owned.length === 1) {
        // Single Salon Owner: bypass picker directly to dashboard
        setSelectedSalon(owned[0]);
        salonDataService.setActiveSalonId(owned[0].id);
        setIsPickerActive(false);
        setActiveTab('dashboard');
      } else {
        // 0 salons fallback to default
        setSelectedSalon(REGISTERED_SALONS[0]);
        salonDataService.setActiveSalonId(REGISTERED_SALONS[0].id);
        setIsPickerActive(false);
        setActiveTab('dashboard');
      }
      return;
    }

    // Staff or Manager route
    const salons = await salonDataService.fetchUserSalons(user);
    const assigned = salons[0] || REGISTERED_SALONS[0];
    setSelectedSalon(assigned);
    salonDataService.setActiveSalonId(assigned.id);
    setIsPickerActive(false);
    setActiveTab(user.role === 'staff' ? 'staff' : 'dashboard');
  };

  const handleSelectSalonFromPicker = (salon: Salon) => {
    setSelectedSalon(salon);
    salonDataService.setActiveSalonId(salon.id);
    setIsPickerActive(false);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    setSelectedSalon(null);
    setUserSalons([]);
    setIsPickerActive(false);
  };

  const handleNavigateToTrack = (tokenCode: string) => {
    setTrackingTokenCode(tokenCode);
    setActiveTab('track');
  };

  // ---------------------------------------------------------------------------
  // AUTH GATE: Strict check. If no session, ONLY render AuthScreen
  // ---------------------------------------------------------------------------
  if (!currentUser) {
    return (
      <AuthScreen
        onTestLogin={(testUser) => {
          resolveSalonForUser(testUser);
        }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // CUSTOMER ROUTE: Customer Marketplace Experience
  // ---------------------------------------------------------------------------
  if (currentUser.role === 'customer') {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <CustomerMarketplace
            customer={{
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone
            }}
            initialTab={activeTab === 'track' ? 'track' : 'marketplace'}
            initialTokenCode={trackingTokenCode}
            onNavigateToTrack={handleNavigateToTrack}
            onLogout={handleLogout}
          />
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MULTI-SALON OWNER PICKER GATE: If owner has > 1 salon and picker is active
  // ---------------------------------------------------------------------------
  if (isPickerActive && currentUser.role === 'salon_owner') {
    const ownedSalons = userSalons.length > 0 ? userSalons : salonDataService.getSalonsByIds(currentUser.ownedSalonIds || []);
    return (
      <SalonPickerScreen
        ownerName={currentUser.name}
        salons={ownedSalons}
        onSelectSalon={handleSelectSalonFromPicker}
        onLogout={handleLogout}
      />
    );
  }

  const activeSalon = selectedSalon || salonDataService.getActiveSalon();
  const currentlyServing = salonStore.getCurrentlyServingToken();
  const waitingTokens = salonStore.getWaitingTokens();
  const isMultiSalonOwner = currentUser.role === 'salon_owner' && (userSalons.length > 1 || (currentUser.ownedSalonIds?.length || 0) > 1);

  // Reception TV Display Mode
  if (activeTab === 'display') {
    return <NowServingDisplay onBack={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Top Navigation */}
      <Navbar
        currentRole={currentUser.role}
        userName={currentUser.name}
        isMultiSalonOwner={isMultiSalonOwner}
        onOpenSalonPicker={() => setIsPickerActive(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeSalon={activeSalon}
        currentServingToken={currentlyServing ? currentlyServing.token_code : undefined}
        waitingCount={waitingTokens.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Scoped Tenant Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-bold">Active Tenant:</span>
            <span className="bg-amber-500/10 text-amber-300 font-semibold px-2.5 py-0.5 rounded border border-amber-500/20 font-mono">
              {activeSalon.name} ({activeSalon.city})
            </span>
            <span className="text-slate-500 hidden sm:inline">• Tenant ID: {activeSalon.id.slice(0, 8)}...</span>
          </div>

          <div className="flex items-center space-x-3 text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
              <Wifi className="w-3.5 h-3.5" /> Scoped RLS Active
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" /> {currentUser.role.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Dynamic Route Switching based on activeTab */}
        {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
        {activeTab === 'queue' && <QueueManager />}
        {activeTab === 'marketplace' && (
          <CustomerMarketplace
            customer={{
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone
            }}
            onNavigateToTrack={handleNavigateToTrack}
            onLogout={handleLogout}
          />
        )}
        {activeTab === 'book' && <BookingPortal onNavigateToTrack={handleNavigateToTrack} />}
        {activeTab === 'track' && (
          <TokenTracker 
            initialTokenCode={trackingTokenCode} 
            onBookAnother={() => setActiveTab('book')} 
          />
        )}
        {activeTab === 'whatsapp' && <WhatsAppSimulator />}
        {activeTab === 'staff' && <StaffPortal />}
        {activeTab === 'services' && <ServicesManager />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'customers' && <CustomerCRM />}
        {activeTab === 'invoices' && <InvoiceGenerator />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'admin' && <SuperAdminConsole />}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b13] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <Scissors className="w-4 h-4 text-amber-500 -rotate-45" />
            <strong className="text-slate-300 font-serif">{activeSalon.name}</strong>
            <span>• Multi-Tenant Cloud Architecture</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-400">{activeSalon.city}, Rajasthan</span>
            <span>Logged in as {currentUser.email}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
export default App;
