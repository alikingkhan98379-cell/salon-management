import React, { useState, useEffect, useRef } from 'react';
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
import { RegisterSalonScreen } from './components/RegisterSalonScreen';
import { SubscriptionExpiredGate } from './components/SubscriptionExpiredGate';
import { PaymentVerificationManager } from './components/PaymentVerificationManager';
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

  // Stability Guards to eliminate repeated refresh/re-render loops
  const lastAuthUserIdRef = useRef<string | null>(null);
  const isResolvingRef = useRef<boolean>(false);

  // 1. Supabase Auth Session Listener
  useEffect(() => {
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          lastAuthUserIdRef.current = null;
          setCurrentUser(null);
          setSelectedSalon(null);
          setUserSalons([]);
          return;
        }

        if (session?.user) {
          // Only resolve if user is not already resolved or on explicit SIGNED_IN
          if (event === 'SIGNED_IN' || lastAuthUserIdRef.current !== session.user.id) {
            handleAuthenticatedUser(session.user);
          }
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // 2. Re-render when data service mutates (data mutations like tokens, appointments, etc.)
  useEffect(() => {
    const unsubscribe = salonDataService.subscribe(() => {
      setTick(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  const handleAuthenticatedUser = async (user: { id: string; email?: string; user_metadata?: { full_name?: string } }) => {
    if (isResolvingRef.current) return;
    isResolvingRef.current = true;
    try {
      const email = user.email ? user.email.trim().toLowerCase() : '';
      let name = user.user_metadata?.full_name || email.split('@')[0] || 'Salon User';

      // 1. Server-side check: Super Admin
      const isSuperAdmin = await salonDataService.checkIsSuperAdmin(email);
      if (isSuperAdmin) {
        return await resolveSalonForUser({
          id: user.id,
          email,
          name: name || 'Platform Super Admin',
          role: 'super_admin'
        });
      }

      // 2. Demo shortcuts for offline / testing convenience
      if (email === 'kabir@westernboys.com' || email === 'kabir@westernboyssalon.com') {
        return await resolveSalonForUser({
          id: user.id,
          email,
          name: 'Kabir Khan',
          role: 'salon_owner',
          ownedSalonIds: [REGISTERED_SALONS[0].id, REGISTERED_SALONS[1].id]
        });
      }
      if (email === 'rishi@westernboys.com' || email === 'rishi@udaipurlounge.com') {
        return await resolveSalonForUser({
          id: user.id,
          email,
          name: 'Rishi Mehra',
          role: 'salon_owner',
          ownedSalonIds: [REGISTERED_SALONS[1].id]
        });
      }
      if (email === 'farhan@westernboys.com' || email === 'farhan@westernboyssalon.com') {
        return await resolveSalonForUser({
          id: user.id,
          email,
          name: 'Farhan Akhtar',
          role: 'staff',
          assignedSalonId: REGISTERED_SALONS[0].id
        });
      }
      if (email === 'aman@westernboys.com' || email === 'aman@westernboyssalon.com') {
        return await resolveSalonForUser({
          id: user.id,
          email,
          name: 'Aman Sharma',
          role: 'manager',
          assignedSalonId: REGISTERED_SALONS[0].id
        });
      }

      // 3. For any other real Google account or email login:
      // Query their owned salons from database.
      // They NEVER automatically inherit Jaipur salon!
      const tempUser: AuthUser = {
        id: user.id,
        email,
        name,
        role: 'salon_owner',
        ownedSalonIds: []
      };

      const owned = await salonDataService.fetchUserSalons(tempUser);
      if (owned.length > 0) {
        tempUser.ownedSalonIds = owned.map(s => s.id);
      }
      await resolveSalonForUser(tempUser, owned);
    } finally {
      isResolvingRef.current = false;
    }
  };

  const resolveSalonForUser = async (user: AuthUser, initialSalons?: Salon[]) => {
    setCurrentUser(user);
    lastAuthUserIdRef.current = user.id;

    // Customer route
    if (user.role === 'customer') {
      setActiveTab(prev => (prev === 'track' ? 'track' : 'marketplace'));
      setIsPickerActive(false);
      return;
    }

    // Super Admin route
    if (user.role === 'super_admin') {
      const allSalons = initialSalons || await salonDataService.getAllSalonsForAdmin();
      setUserSalons(allSalons);
      const defaultSalon = allSalons[0] || REGISTERED_SALONS[0];
      setSelectedSalon(defaultSalon);
      salonDataService.setActiveSalonId(defaultSalon.id);
      setActiveTab(prev => (prev === 'admin' ? prev : 'admin'));
      setIsPickerActive(false);
      return;
    }

    // Salon Owner route (Multi vs Single Salon Logic)
    if (user.role === 'salon_owner') {
      const owned = initialSalons !== undefined ? initialSalons : await salonDataService.fetchUserSalons(user);
      setUserSalons(owned);

      if (owned.length === 0) {
        // Unregistered Owner: Must register their salon first!
        setSelectedSalon(null);
        setIsPickerActive(false);
        return;
      }

      if (owned.length > 1) {
        // Multi-Salon Owner: MUST show Salon Picker first!
        setIsPickerActive(true);
        setSelectedSalon(null);
      } else {
        // Single Salon Owner: bypass picker directly to dashboard
        setSelectedSalon(owned[0]);
        salonDataService.setActiveSalonId(owned[0].id);
        setIsPickerActive(false);
        // Preserve active tab if user was already on a valid screen
        setActiveTab(prev => {
          const validTabs = ['dashboard', 'queue', 'marketplace', 'book', 'track', 'whatsapp', 'staff', 'verifications', 'services', 'inventory', 'customers', 'invoices', 'analytics'];
          return validTabs.includes(prev) ? prev : 'dashboard';
        });
      }
      return;
    }

    // Staff or Manager route
    const salons = initialSalons || await salonDataService.fetchUserSalons(user);
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
    lastAuthUserIdRef.current = null;
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    setSelectedSalon(null);
    setUserSalons([]);
    setIsPickerActive(false);
    setActiveTab('dashboard');
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
  // SALON ONBOARDING GATE: Unregistered owner routes to Register Your Salon
  // ---------------------------------------------------------------------------
  if (currentUser.role === 'salon_owner' && userSalons.length === 0) {
    return (
      <RegisterSalonScreen
        owner={{
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          phone: currentUser.phone
        }}
        onSalonRegistered={(newSalon) => {
          setUserSalons([newSalon]);
          setSelectedSalon(newSalon);
          setCurrentUser(prev => prev ? {
            ...prev,
            ownedSalonIds: [newSalon.id]
          } : null);
          salonDataService.setActiveSalonId(newSalon.id);
          setIsPickerActive(false);
          setActiveTab('dashboard');
        }}
        onLogout={handleLogout}
      />
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

  // ---------------------------------------------------------------------------
  // SUBSCRIPTION EXPIRED GATE: Salons with expired subscription gated for owner
  // ---------------------------------------------------------------------------
  if (currentUser.role === 'salon_owner' && activeSalon && activeSalon.subscription_status === 'expired') {
    return (
      <SubscriptionExpiredGate
        salon={activeSalon}
        ownerEmail={currentUser.email}
        onSubscriptionRenewed={(updatedSalon) => {
          setSelectedSalon(updatedSalon);
          setUserSalons(prev => prev.map(s => s.id === updatedSalon.id ? updatedSalon : s));
        }}
        onLogout={handleLogout}
      />
    );
  }

  const currentlyServing = salonStore.getCurrentlyServingToken();
  const waitingTokens = salonStore.getWaitingTokens();
  const isMultiSalonOwner = currentUser.role === 'salon_owner' && (userSalons.length > 1 || (currentUser.ownedSalonIds?.length || 0) > 1);
  const pendingVerificationsCount = activeSalon ? salonDataService.getPendingVerifications(activeSalon.id).length : 0;

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
        pendingVerificationsCount={pendingVerificationsCount}
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
        {activeTab === 'verifications' && (
          <PaymentVerificationManager salonId={activeSalon.id} salonName={activeSalon.name} />
        )}
        {activeTab === 'services' && <ServicesManager />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'customers' && <CustomerCRM />}
        {activeTab === 'invoices' && <InvoiceGenerator />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'admin' && <SuperAdminConsole adminEmail={currentUser.email} onLogout={handleLogout} />}

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
