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
import { ManageStaffScreen } from './components/ManageStaffScreen';
import { InactivityModal } from './components/InactivityModal';
import { NewBookingNotificationToast, BookingAlertData } from './components/NewBookingNotificationToast';
import { salonDataService, REGISTERED_SALONS } from './lib/salonDataService';
import { salonStore } from './lib/mockStore';
import { playNewBookingChime } from './lib/soundUtils';
import { supabase } from './lib/supabaseClient';
import { UserRole, Salon } from './types';
import { Scissors, ShieldCheck, Wifi, AlertTriangle, Clock, X } from 'lucide-react';

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
  const [isPartnerAuthOpen, setIsPartnerAuthOpen] = useState<boolean>(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [trackingTokenCode, setTrackingTokenCode] = useState<string>('WBS-02');

  // Active Salon & Root In-App Notifications
  const activeSalon = selectedSalon || salonDataService.getActiveSalon();
  const [activeBookingNotification, setActiveBookingNotification] = useState<BookingAlertData | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Stability Guards to eliminate repeated refresh/re-render loops
  const lastAuthUserIdRef = useRef<string | null>(null);
  const isResolvingRef = useRef<boolean>(false);

  // Clean trailing '#' from OAuth redirect if present
  useEffect(() => {
    if (window.location.hash === '#' || window.location.hash.startsWith('#access_token') || window.location.hash.startsWith('#error')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

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

  // 3. Strict Role-Based Navigation Route Protection
  useEffect(() => {
    if (currentUser?.role === 'staff' && activeTab !== 'staff') {
      setActiveTab('staff');
    }
    if (currentUser?.role === 'manager' && (activeTab === 'analytics' || activeTab === 'admin')) {
      setActiveTab('dashboard');
    }
  }, [currentUser?.role, activeTab]);

  // Synchronize pending verifications count for active salon
  const updatePendingCount = async (salonId: string) => {
    try {
      const list = await salonDataService.fetchPendingVerifications(salonId);
      setPendingCount(list.length);
    } catch {
      setPendingCount(salonDataService.getPendingVerifications(salonId).length);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. ROOT-LEVEL REALTIME BOOKING NOTIFICATIONS & CHIME (Salon Owner & Manager)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser || !activeSalon) return;
    if (currentUser.role !== 'salon_owner' && currentUser.role !== 'manager' && currentUser.role !== 'super_admin') {
      return;
    }

    const currentSalonId = activeSalon.id;

    // Initial fetch of pending count
    updatePendingCount(currentSalonId);

    const handleIncomingBooking = (alertPayload: BookingAlertData) => {
      // Security Check: Strictly ensure incoming booking is for this specific salon!
      if (alertPayload.salonId !== currentSalonId) return;

      // 1. Play audible Web Audio chime
      playNewBookingChime();

      // 2. Trigger notification toast
      setActiveBookingNotification(alertPayload);

      // 3. Update pending count immediately
      updatePendingCount(currentSalonId);
    };

    // 1. Listen to Supabase Realtime changes on appointments table
    let channel: any = null;
    if (supabase) {
      channel = supabase.channel(`salon-owner-realtime-alerts-${currentSalonId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${currentSalonId}`
        }, (payload: any) => {
          if (payload.new && payload.new.salon_id === currentSalonId) {
            let parsedNotes: any = {};
            try {
              if (payload.new.notes) parsedNotes = JSON.parse(payload.new.notes);
            } catch {}

            const alertData: BookingAlertData = {
              id: payload.new.id,
              salonId: payload.new.salon_id,
              customerName: payload.new.customer_name || parsedNotes.customer_name || 'Customer',
              customerPhone: payload.new.customer_phone || parsedNotes.customer_phone,
              serviceName: payload.new.service_name || parsedNotes.service_name || 'Custom Service',
              tokenCode: payload.new.token_code || parsedNotes.token_code || 'WBS-REQ',
              tokenFee: payload.new.amount || parsedNotes.token_fee || 25,
              balanceDue: payload.new.balance_due || parsedNotes.balance_due || 0,
              timeSlot: payload.new.time_slot,
              appointmentDate: payload.new.appointment_date,
              receivedAt: Date.now()
            };
            handleIncomingBooking(alertData);
          }
        })
        .subscribe();
    }

    // 2. Listen to cross-window and in-app custom event
    const onCustomNotification = (e: CustomEvent<BookingAlertData>) => {
      if (e.detail && e.detail.salonId === currentSalonId) {
        handleIncomingBooking(e.detail);
      }
    };

    const onApptCreated = (e: CustomEvent<any>) => {
      if (e.detail && e.detail.salonId === currentSalonId) {
        const appt = e.detail.appointment;
        const alertData: BookingAlertData = {
          id: appt.id,
          salonId: e.detail.salonId,
          customerName: appt.customer_name || 'Customer',
          customerPhone: appt.customer_phone,
          serviceName: appt.service_name || 'Service',
          tokenCode: appt.token_code || 'WBS',
          tokenFee: appt.token_fee || appt.amount || 25,
          balanceDue: appt.balance_due || 0,
          timeSlot: appt.time_slot,
          appointmentDate: appt.appointment_date,
          receivedAt: Date.now()
        };
        handleIncomingBooking(alertData);
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === `wbs_salon_alert_${currentSalonId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.salonId === currentSalonId) {
            handleIncomingBooking(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('wbs_new_booking_notification' as any, onCustomNotification);
    window.addEventListener('wbs_appointment_created' as any, onApptCreated);
    window.addEventListener('storage', onStorage);

    // Heartbeat fallback to check pending verifications every 6 seconds
    const interval = setInterval(() => {
      updatePendingCount(currentSalonId);
    }, 6000);

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('wbs_new_booking_notification' as any, onCustomNotification);
      window.removeEventListener('wbs_appointment_created' as any, onApptCreated);
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, [currentUser?.role, activeSalon?.id]);

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

      // 3. Check if user is a registered Staff or Manager in any salon
      const staffMember = await salonDataService.findStaffProfileByAuthUserOrEmail({
        id: user.id,
        email,
        phone: (user as any).phone
      });

      if (staffMember) {
        if (staffMember.isDeactivated) {
          alert('Access Denied: Your staff account has been deactivated by salon management. Please contact your salon administrator.');
          if (supabase) {
            await supabase.auth.signOut().catch(() => {});
          }
          return;
        }

        if (email) {
          try {
            localStorage.setItem(`wbs_user_role_${email}`, staffMember.profile.role);
            localStorage.setItem(`wbs_active_salon_${email}`, staffMember.salon.id);
          } catch {}
        }

        return await resolveSalonForUser({
          id: user.id,
          email,
          name: staffMember.profile.full_name || name,
          role: staffMember.profile.role,
          assignedSalonId: staffMember.profile.salon_id,
          phone: staffMember.profile.phone
        }, [staffMember.salon]);
      }

      // 4. Check login intent and saved role
      const storedRole = email ? localStorage.getItem(`wbs_user_role_${email}`) : null;
      const loginIntent = sessionStorage.getItem('wbs_login_intent') || localStorage.getItem('wbs_login_intent');

      // Check if user is already an owner of registered salons in Supabase / Local
      const tempOwnerCheck: AuthUser = {
        id: user.id,
        email,
        name,
        role: 'salon_owner',
        ownedSalonIds: []
      };

      try {
        if (email) {
          const savedActiveSalon = localStorage.getItem(`wbs_active_salon_${email}`);
          if (savedActiveSalon) {
            tempOwnerCheck.ownedSalonIds = [savedActiveSalon];
          }
        }
      } catch {}

      const owned = await salonDataService.fetchUserSalons(tempOwnerCheck);

      // If user owns a salon, they are definitely a salon owner!
      if (owned.length > 0) {
        tempOwnerCheck.ownedSalonIds = owned.map(s => s.id);
        try {
          if (email) {
            localStorage.setItem(`wbs_active_salon_${email}`, owned[0].id);
            localStorage.setItem(`wbs_user_role_${email}`, 'salon_owner');
          }
        } catch {}
        return await resolveSalonForUser(tempOwnerCheck, owned);
      }

      // If user does NOT own any salon:
      // Distinguish Customer vs Salon Owner by explicit login intent:
      if (loginIntent === 'salon_owner') {
        // User deliberately came via Salon Partner Portal and owns 0 salons -> route to RegisterSalonScreen
        tempOwnerCheck.role = 'salon_owner';
        return await resolveSalonForUser(tempOwnerCheck, []);
      }

      // Otherwise: Default for all customers, online bookers & general users is STRICTLY 'customer'!
      // They NEVER see Register Your Salon!
      const customerUser: AuthUser = {
        id: user.id,
        email,
        name,
        role: 'customer',
        ownedSalonIds: []
      };
      if (email) {
        localStorage.setItem(`wbs_user_role_${email}`, 'customer');
      }
      return await resolveSalonForUser(customerUser, []);
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
          const validTabs = ['dashboard', 'queue', 'marketplace', 'book', 'track', 'whatsapp', 'staff', 'manage_staff', 'verifications', 'services', 'inventory', 'customers', 'invoices', 'analytics'];
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

  const handleLogout = async (reason?: string) => {
    lastAuthUserIdRef.current = null;
    setIsPartnerAuthOpen(false);
    if (currentUser?.email) {
      try {
        localStorage.removeItem(`wbs_active_salon_${currentUser.email.trim().toLowerCase()}`);
      } catch {}
    }
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    setSelectedSalon(null);
    setUserSalons([]);
    setIsPickerActive(false);
    setActiveTab('dashboard');
    if (reason === 'inactivity') {
      setInactivityNotice('You were signed out due to 30 minutes of inactivity to protect your account.');
    }
  };

  const handleNavigateToTrack = (tokenCode: string) => {
    setTrackingTokenCode(tokenCode);
    setActiveTab('track');
  };

  // ---------------------------------------------------------------------------
  // Session Inactivity Timeout (30-min Auto-Logout with 60s Warning for Operational Roles)
  // ---------------------------------------------------------------------------
  const INACTIVITY_TIMEOUT_SECONDS = 1800; // 30 minutes
  const WARNING_THRESHOLD_SECONDS = 60;   // 60 seconds warning

  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState<number>(INACTIVITY_TIMEOUT_SECONDS);
  const [showInactivityWarning, setShowInactivityWarning] = useState<boolean>(false);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);

  const lastActivityTimeRef = useRef<number>(Date.now());
  const showWarningRef = useRef<boolean>(false);
  showWarningRef.current = showInactivityWarning;

  const handleStayLoggedIn = () => {
    lastActivityTimeRef.current = Date.now();
    setInactivitySecondsLeft(INACTIVITY_TIMEOUT_SECONDS);
    setShowInactivityWarning(false);
  };

  const handleInactivityLogout = async () => {
    setShowInactivityWarning(false);
    await handleLogout('inactivity');
  };

  useEffect(() => {
    // Only operational roles (salon_owner, manager, staff, super_admin) have session inactivity timeouts
    const isOperationalRole = currentUser && ['salon_owner', 'manager', 'staff', 'super_admin'].includes(currentUser.role);
    if (!isOperationalRole) {
      setShowInactivityWarning(false);
      return;
    }

    // Reset activity timer upon role load or user change
    lastActivityTimeRef.current = Date.now();
    setInactivitySecondsLeft(INACTIVITY_TIMEOUT_SECONDS);
    setShowInactivityWarning(false);

    const resetActivity = () => {
      // While warning modal is shown, explicit action (Stay Logged In) is required to dismiss warning
      if (!showWarningRef.current) {
        lastActivityTimeRef.current = Date.now();
      }
    };

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityTimeRef.current) / 1000);
      const remaining = Math.max(0, INACTIVITY_TIMEOUT_SECONDS - elapsedSeconds);
      setInactivitySecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleInactivityLogout();
      } else if (remaining <= WARNING_THRESHOLD_SECONDS) {
        setShowInactivityWarning(true);
      } else {
        setShowInactivityWarning(false);
      }
    }, 1000);

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetActivity, { passive: true }));

    return () => {
      clearInterval(interval);
      events.forEach(event => window.removeEventListener(event, resetActivity));
    };
  }, [currentUser?.role, currentUser?.id]);

  // Auto-dismiss inactivity notice after 10 seconds
  useEffect(() => {
    if (inactivityNotice) {
      const timer = setTimeout(() => {
        setInactivityNotice(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [inactivityNotice]);

  // ---------------------------------------------------------------------------
  // 1. ANONYMOUS GUEST & CUSTOMER ROUTE: Open Browsing (Zero Login Required)
  // ---------------------------------------------------------------------------
  const renderAppContent = () => {
    if (!currentUser) {
    if (isPartnerAuthOpen) {
      return (
        <AuthScreen
          onBackToMarketplace={() => setIsPartnerAuthOpen(false)}
          onTestLogin={(testUser) => {
            setIsPartnerAuthOpen(false);
            resolveSalonForUser(testUser);
          }}
        />
      );
    }

    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <CustomerMarketplace
            customer={null}
            initialTab={activeTab === 'track' ? 'track' : 'marketplace'}
            initialTokenCode={trackingTokenCode}
            onNavigateToTrack={handleNavigateToTrack}
            onLogout={handleLogout}
            onOpenPartnerLogin={() => setIsPartnerAuthOpen(true)}
            onCustomerLogin={(custUser) => {
              resolveSalonForUser({
                id: custUser.id,
                email: custUser.email,
                name: custUser.name,
                phone: custUser.phone,
                role: 'customer'
              });
            }}
          />
        </main>
      </div>
    );
  }

  // Authenticated Customer: Always Marketplace, NEVER RegisterSalonScreen!
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
            onOpenPartnerLogin={() => setIsPartnerAuthOpen(true)}
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
          try {
            const emailKey = (newSalon.owner_email || currentUser.email || '').trim().toLowerCase();
            if (emailKey) {
              localStorage.setItem(`wbs_active_salon_${emailKey}`, newSalon.id);
            }
          } catch {}
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
      
      {/* Real-time Salon Booking Notification Toast */}
      <NewBookingNotificationToast
        notification={activeBookingNotification}
        onReview={(appointmentId) => {
          setActiveTab('verifications');
          setActiveBookingNotification(null);
        }}
        onDismiss={() => setActiveBookingNotification(null)}
      />

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
        pendingVerificationsCount={Math.max(pendingCount, pendingVerificationsCount)}
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
        {activeTab === 'staff' && <StaffPortal currentUser={currentUser} />}
        {activeTab === 'manage_staff' && (
          <ManageStaffScreen 
            currentSalon={activeSalon}
            currentUserRole={currentUser.role}
            currentUserEmail={currentUser.email}
          />
        )}
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
  };

  return (
    <>
      {inactivityNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] max-w-md w-full px-4 animate-fadeIn font-sans">
          <div className="bg-amber-500 text-slate-950 font-bold p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-amber-400">
            <div className="flex items-center gap-2.5 text-xs">
              <Clock className="w-5 h-5 shrink-0" />
              <span>{inactivityNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setInactivityNotice(null)}
              className="text-slate-950 hover:bg-amber-600/30 p-1.5 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showInactivityWarning && (
        <InactivityModal
          secondsRemaining={inactivitySecondsLeft}
          onStayLoggedIn={handleStayLoggedIn}
          onLogout={() => {
            setShowInactivityWarning(false);
            handleLogout();
          }}
        />
      )}

      {renderAppContent()}
    </>
  );
}
export default App;
