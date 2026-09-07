import { supabase } from './supabaseClient';
import { 
  Salon, 
  Profile, 
  Service, 
  Customer, 
  Appointment, 
  Token, 
  InventoryItem, 
  Invoice, 
  NotificationLog, 
  UserRole,
  CustomerVisitRecord,
  SubscriptionPlanType,
  AdminAuditLog
} from '../types';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function isValidUUID(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// Registered default salons for seed/fallback
export const REGISTERED_SALONS: Salon[] = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Western Boys Salon (Vaishali Nagar)',
    slug: 'western-boys-salon',
    phone: '+91 98765 43210',
    email: 'contact@westernboyssalon.com',
    address: 'Shop 14, Royal Heritage Arcade, Vaishali Nagar',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302021',
    latitude: 26.9048,
    longitude: 75.7483,
    currency: 'INR',
    currency_symbol: '₹',
    upi_id: 'jaipur.westernboys@okhdfcbank',
    owner_name: 'Kabir Khan',
    owner_email: 'kabir@westernboyssalon.com',
    subscription_plan: 'base_monthly',
    billing_cycle: 'monthly',
    subscription_status: 'active',
    trial_ends_at: '2026-09-30T10:00:00Z',
    subscription_expires_at: '2026-10-30T10:00:00Z',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    name: 'Western Grooming Lounge (Celebration Mall)',
    slug: 'western-grooming-lounge',
    phone: '+91 98290 88776',
    email: 'udaipur@westernboyssalon.com',
    address: 'Level 2, Celebration Mall Complex, Bhuwana',
    city: 'Udaipur',
    state: 'Rajasthan',
    pincode: '313001',
    latitude: 24.6186,
    longitude: 73.7082,
    currency: 'INR',
    currency_symbol: '₹',
    upi_id: 'udaipur.grooming@icici',
    owner_name: 'Rishi Mehra',
    owner_email: 'rishi@udaipurlounge.com',
    subscription_plan: 'yearly',
    billing_cycle: '1_year',
    subscription_status: 'active',
    trial_ends_at: '2026-10-15T10:00:00Z',
    subscription_expires_at: '2027-02-15T10:00:00Z',
    created_at: '2026-02-15T10:00:00Z',
  }
];

interface TenantStore {
  services: Service[];
  appointments: Appointment[];
  tokens: Token[];
  inventory: InventoryItem[];
  customers: Customer[];
  invoices: Invoice[];
  staff: Profile[];
}

const DEFAULT_JAIPUR_SERVICES: Service[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    salon_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Jaipur Signature Fade & Scissor Cut',
    category: 'Hair',
    description: 'Precision scissor cut with organic tea tree wash.',
    duration_minutes: 30,
    in_salon_price: 250,
    home_service_price: 450,
    is_active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    salon_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Royal Beard Sculpt & Hot Towel',
    category: 'Beard',
    description: 'Straight razor beard detailing and eucalyptus hot steam.',
    duration_minutes: 25,
    in_salon_price: 180,
    home_service_price: 320,
    is_active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    salon_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Gentlemen Combo (Hair + Beard)',
    category: 'Combo',
    description: 'Haircut + beard shaping + relaxing head massage.',
    duration_minutes: 50,
    in_salon_price: 380,
    home_service_price: 650,
    is_active: true,
  }
];

const DEFAULT_UDAIPUR_SERVICES: Service[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    salon_id: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    name: 'Lake City Premium Scissor Cut & Spa',
    category: 'Hair',
    description: 'Udaipur special scissor cut and organic hair spa wash.',
    duration_minutes: 35,
    in_salon_price: 300,
    home_service_price: 500,
    is_active: true,
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    salon_id: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    name: 'Maharaja Sandalwood Beard Detailing',
    category: 'Beard',
    description: 'Luxury sandalwood beard wash and contour razor shaping.',
    duration_minutes: 30,
    in_salon_price: 220,
    home_service_price: 380,
    is_active: true,
  }
];

class SalonDataService {
  private tenantData: Map<string, TenantStore> = new Map();
  private allSalonsCache: Salon[] = REGISTERED_SALONS;
  private listeners: Set<() => void> = new Set();
  private activeSalonId: string = REGISTERED_SALONS[0].id;
  public isConnectedToSupabase: boolean = false;

  constructor() {
    this.initDefaultStores();
    this.checkSupabaseConnection();
  }

  private initDefaultStores() {
    // Tenant A (Jaipur Flagship)
    this.tenantData.set(REGISTERED_SALONS[0].id, {
      services: [...DEFAULT_JAIPUR_SERVICES],
      appointments: [
        {
          id: 'appt-jpr-1',
          salon_id: REGISTERED_SALONS[0].id,
          salon_name: REGISTERED_SALONS[0].name,
          customer_id: 'cust-1',
          customer_name: 'Rahul Sharma',
          customer_phone: '+91 98290 12345',
          staff_id: '33333333-3333-3333-3333-333333333333',
          staff_name: 'Farhan Akhtar',
          service_id: 's3333333-3333-3333-3333-333333333333',
          service_name: 'Gentlemen Combo (Hair + Beard)',
          service_type: 'in_salon',
          booking_channel: 'whatsapp',
          appointment_date: new Date().toISOString().split('T')[0],
          time_slot: '11:00 AM',
          status: 'serving',
          amount: 380,
          payment_status: 'completed',
          payment_gateway: 'mock_razorpay',
          token_number: 1,
          token_code: 'WBS-01',
          created_at: new Date().toISOString(),
        },
        {
          id: 'appt-jpr-2',
          salon_id: REGISTERED_SALONS[0].id,
          salon_name: REGISTERED_SALONS[0].name,
          customer_id: 'cust-2',
          customer_name: 'Sameer Khan',
          customer_phone: '+91 98290 11223',
          staff_id: '44444444-4444-4444-4444-444444444444',
          staff_name: 'Vikram Singh',
          service_id: 's1111111-1111-1111-1111-111111111111',
          service_name: 'Jaipur Signature Fade & Scissor Cut',
          service_type: 'in_salon',
          booking_channel: 'web',
          appointment_date: new Date().toISOString().split('T')[0],
          time_slot: '11:30 AM',
          status: 'confirmed',
          amount: 250,
          payment_status: 'completed',
          payment_gateway: 'upi',
          token_number: 2,
          token_code: 'WBS-02',
          created_at: new Date().toISOString(),
        }
      ],
      tokens: [
        {
          id: 'tok-jpr-1',
          salon_id: REGISTERED_SALONS[0].id,
          appointment_id: 'appt-jpr-1',
          token_number: 1,
          token_code: 'WBS-01',
          customer_name: 'Rahul Sharma',
          service_name: 'Gentlemen Combo (Hair + Beard)',
          staff_name: 'Farhan Akhtar',
          service_type: 'in_salon',
          queue_date: new Date().toISOString().split('T')[0],
          status: 'serving',
          estimated_wait_minutes: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tok-jpr-2',
          salon_id: REGISTERED_SALONS[0].id,
          appointment_id: 'appt-jpr-2',
          token_number: 2,
          token_code: 'WBS-02',
          customer_name: 'Sameer Khan',
          service_name: 'Jaipur Signature Fade & Scissor Cut',
          staff_name: 'Vikram Singh',
          service_type: 'in_salon',
          queue_date: new Date().toISOString().split('T')[0],
          status: 'waiting',
          estimated_wait_minutes: 15,
          created_at: new Date().toISOString(),
        }
      ],
      inventory: [
        {
          id: 'inv-jpr-1',
          salon_id: REGISTERED_SALONS[0].id,
          item_name: 'Matte Clay Hair Pomade',
          category: 'Styling',
          quantity: 14,
          unit: 'tubs',
          low_stock_threshold: 5,
          unit_cost: 220,
        },
        {
          id: 'inv-jpr-2',
          salon_id: REGISTERED_SALONS[0].id,
          item_name: 'Dorco Barber Razor Blades',
          category: 'Tools',
          quantity: 3,
          unit: 'packs',
          low_stock_threshold: 5,
          unit_cost: 120,
        }
      ],
      customers: [
        {
          id: 'c1111111-1111-1111-1111-111111111111',
          salon_id: REGISTERED_SALONS[0].id,
          name: 'Sameer Khan',
          phone: '+91 98290 11223',
          email: 'sameer@gmail.com',
          allergy_notes: 'Sensitive skin on neck',
          hair_preference_notes: 'Low skin taper fade, matte clay finish',
          behavior_notes: 'Always punctual, prefers quiet service',
          total_visits: 4,
          total_spent: 1520,
          created_at: '2026-01-10T10:00:00Z',
        },
        {
          id: 'cust-1',
          salon_id: REGISTERED_SALONS[0].id,
          name: 'Rahul Sharma',
          phone: '+91 98290 12345',
          email: 'rahul@gmail.com',
          allergy_notes: 'Allergic to menthol',
          hair_preference_notes: 'Classic side part, no blow dry',
          behavior_notes: 'Regular customer since 2025',
          total_visits: 5,
          total_spent: 1900,
          created_at: '2026-01-15T10:00:00Z',
        }
      ],
      invoices: [],
      staff: [
        {
          id: '55555555-5555-5555-5555-555555555555',
          salon_id: REGISTERED_SALONS[0].id,
          role: 'manager',
          full_name: 'Aman Sharma',
          phone: '+91 98765 00005',
          email: 'aman@westernboyssalon.com',
          specialties: ['Operations', 'VIP Styling'],
          rating: 5.0,
          commission_rate: 25,
          is_active: true,
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          salon_id: REGISTERED_SALONS[0].id,
          role: 'staff',
          full_name: 'Farhan Akhtar',
          phone: '+91 98765 00003',
          email: 'farhan@westernboyssalon.com',
          specialties: ['Skin Fade', 'Beard Sculpting'],
          rating: 4.9,
          commission_rate: 20,
          is_active: true,
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          salon_id: REGISTERED_SALONS[0].id,
          role: 'staff',
          full_name: 'Vikram Singh',
          phone: '+91 98765 00004',
          email: 'vikram@westernboyssalon.com',
          specialties: ['Hair Coloring', 'Keratin Treatment'],
          rating: 4.8,
          commission_rate: 18,
          is_active: true,
        }
      ]
    });

    // Tenant B (Udaipur Celebration Mall)
    this.tenantData.set(REGISTERED_SALONS[1].id, {
      services: [...DEFAULT_UDAIPUR_SERVICES],
      appointments: [
        {
          id: 'appt-udr-1',
          salon_id: REGISTERED_SALONS[1].id,
          salon_name: REGISTERED_SALONS[1].name,
          customer_id: 'cust-udr-1',
          customer_name: 'Prateek Jain',
          customer_phone: '+91 98290 33445',
          staff_id: '77777777-7777-7777-7777-777777777777',
          staff_name: 'Devendra Rajput',
          service_id: 'u1111111-1111-1111-1111-111111111111',
          service_name: 'Lake City Premium Scissor Cut & Spa',
          service_type: 'in_salon',
          booking_channel: 'web',
          appointment_date: new Date().toISOString().split('T')[0],
          time_slot: '02:00 PM',
          status: 'confirmed',
          amount: 300,
          payment_status: 'completed',
          payment_gateway: 'upi',
          token_number: 1,
          token_code: 'WGL-01',
          created_at: new Date().toISOString(),
        }
      ],
      tokens: [
        {
          id: 'tok-udr-1',
          salon_id: REGISTERED_SALONS[1].id,
          appointment_id: 'appt-udr-1',
          token_number: 1,
          token_code: 'WGL-01',
          customer_name: 'Prateek Jain',
          service_name: 'Lake City Premium Scissor Cut & Spa',
          staff_name: 'Devendra Rajput',
          service_type: 'in_salon',
          queue_date: new Date().toISOString().split('T')[0],
          status: 'waiting',
          estimated_wait_minutes: 10,
          created_at: new Date().toISOString(),
        }
      ],
      inventory: [
        {
          id: 'inv-udr-1',
          salon_id: REGISTERED_SALONS[1].id,
          item_name: 'Organic Sandalwood Beard Balm',
          category: 'Balm',
          quantity: 20,
          unit: 'jars',
          low_stock_threshold: 4,
          unit_cost: 310,
        }
      ],
      customers: [
        {
          id: 'c2222222-2222-2222-2222-222222222222',
          salon_id: REGISTERED_SALONS[1].id,
          name: 'Prateek Jain',
          phone: '+91 98290 33445',
          email: 'prateek@gmail.com',
          allergy_notes: 'None',
          hair_preference_notes: 'Pompadour, scissor-cut sides',
          behavior_notes: 'Loves black coffee during haircut',
          total_visits: 2,
          total_spent: 720,
          created_at: '2026-02-20T10:00:00Z',
        }
      ],
      invoices: [],
      staff: [
        {
          id: '77777777-7777-7777-7777-777777777777',
          salon_id: REGISTERED_SALONS[1].id,
          role: 'staff',
          full_name: 'Devendra Rajput',
          phone: '+91 98290 00007',
          email: 'devendra@udaipurlounge.com',
          specialties: ['Royal Shave', 'Beard Contour'],
          rating: 4.8,
          commission_rate: 18,
          is_active: true,
        }
      ]
    });

    this.loadLocalStorageSalons();
  }

  private loadLocalStorageSalons() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const saved = localStorage.getItem('wbs_custom_salons');
      if (saved) {
        const parsed: Salon[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(s => {
            if (!this.allSalonsCache.some(existing => existing.id === s.id)) {
              this.allSalonsCache.unshift(s);
            }
            const savedStore = localStorage.getItem('wbs_tenant_data_' + s.id);
            if (savedStore) {
              try {
                this.tenantData.set(s.id, JSON.parse(savedStore));
              } catch {}
            }
          });
        }
      }
      // Proactively sync any local salons to Supabase in the background
      this.syncLocalSalonsToSupabase().catch(() => {});
    } catch (e) {
      console.warn('Could not load custom salons from localStorage:', e);
    }
  }

  public async syncLocalSalonsToSupabase(): Promise<void> {
    if (!supabase) return;
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const saved = localStorage.getItem('wbs_custom_salons');
      if (!saved) return;
      const parsed: Salon[] = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      const { data: remoteSalons } = await supabase.from('salons').select('id');
      const remoteIds = new Set((remoteSalons || []).map((s: any) => s.id));

      for (const salon of parsed) {
        if (!remoteIds.has(salon.id)) {
          const baseInsertData = {
            id: salon.id,
            name: salon.name,
            slug: salon.slug || `salon-${Date.now()}`,
            phone: salon.phone || '+91 9999999999',
            email: salon.email || salon.owner_email || '',
            address: salon.address + (salon.pincode && !salon.address.includes(salon.pincode) ? ` - ${salon.pincode}` : ''),
            city: salon.city || 'Jaipur',
            state: salon.state || 'Rajasthan',
            currency: salon.currency || 'INR',
            currency_symbol: salon.currency_symbol || '₹',
            subscription_plan: salon.subscription_plan || 'base_monthly',
            billing_cycle: salon.billing_cycle || 'monthly',
            subscription_status: salon.subscription_status || 'trial',
            subscription_expires_at: salon.subscription_expires_at || salon.trial_ends_at || new Date(Date.now() + 7 * 86400000).toISOString()
          };
          const { error } = await supabase.from('salons').insert(baseInsertData);
          if (!error) {
            remoteIds.add(salon.id);
            console.log('Synced local salon to Supabase:', salon.name, salon.id);
          } else {
            console.warn('Supabase sync error for salon:', salon.id, error);
          }
        }
      }
    } catch (err) {
      console.warn('Error syncing local salons to Supabase:', err);
    }
  }

  public saveSalonLocally(salon: Salon, ownerEmail?: string, ownerId?: string) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const saved = localStorage.getItem('wbs_custom_salons');
      let list: Salon[] = saved ? JSON.parse(saved) : [];
      list = list.filter(s => s.id !== salon.id);
      list.unshift(salon);
      localStorage.setItem('wbs_custom_salons', JSON.stringify(list));

      const mapStr = localStorage.getItem('wbs_owner_salons_map');
      const ownerMap: Record<string, string[]> = mapStr ? JSON.parse(mapStr) : {};
      if (ownerEmail) {
        const cleanEmail = ownerEmail.trim().toLowerCase();
        ownerMap[cleanEmail] = Array.from(new Set([...(ownerMap[cleanEmail] || []), salon.id]));
      }
      if (ownerId) {
        ownerMap[ownerId] = Array.from(new Set([...(ownerMap[ownerId] || []), salon.id]));
      }
      localStorage.setItem('wbs_owner_salons_map', JSON.stringify(ownerMap));

      const store = this.tenantData.get(salon.id);
      if (store) {
        localStorage.setItem('wbs_tenant_data_' + salon.id, JSON.stringify(store));
      }
    } catch (e) {
      console.warn('Could not save salon to localStorage:', e);
    }
  }

  public getLocalSalonsForUser(email?: string, userId?: string, ownedIds?: string[]): Salon[] {
    this.loadLocalStorageSalons();
    const foundIds = new Set<string>(ownedIds || []);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const mapStr = localStorage.getItem('wbs_owner_salons_map');
        if (mapStr) {
          const ownerMap: Record<string, string[]> = JSON.parse(mapStr);
          if (email) {
            const cleanEmail = email.trim().toLowerCase();
            (ownerMap[cleanEmail] || []).forEach(id => foundIds.add(id));
          }
          if (userId) {
            (ownerMap[userId] || []).forEach(id => foundIds.add(id));
          }
        }
        if (email) {
          const activeSalonId = localStorage.getItem(`wbs_active_salon_${email.trim().toLowerCase()}`);
          if (activeSalonId) foundIds.add(activeSalonId);
        }
      }
    } catch {}

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      this.allSalonsCache.forEach(s => {
        if ((s.owner_email && s.owner_email.toLowerCase() === cleanEmail) ||
            (s.email && s.email.toLowerCase() === cleanEmail)) {
          foundIds.add(s.id);
        }
      });
    }

    return this.allSalonsCache.filter(s => foundIds.has(s.id));
  }

  private async checkSupabaseConnection() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('salons').select('*').limit(20);
      if (!error && data && data.length > 0) {
        this.isConnectedToSupabase = true;
        // Merge without wiping local custom salons
        const map = new Map<string, Salon>();
        this.allSalonsCache.forEach(s => map.set(s.id, s));
        data.forEach((s: Salon) => map.set(s.id, s));
        this.allSalonsCache = Array.from(map.values());
        this.notify();
      }
    } catch {
      this.isConnectedToSupabase = false;
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // Active Salon Context
  public getActiveSalonId(): string {
    return this.activeSalonId;
  }

  public setActiveSalonId(id: string) {
    if (this.activeSalonId === id && this.tenantData.has(id)) {
      return;
    }
    this.activeSalonId = id;
    if (!this.tenantData.has(id)) {
      // create empty store if new
      this.tenantData.set(id, {
        services: [],
        appointments: [],
        tokens: [],
        inventory: [],
        customers: [],
        invoices: [],
        staff: []
      });
    }
    this.notify();
  }

  public getActiveSalon(): Salon {
    return this.allSalonsCache.find(s => s.id === this.activeSalonId) || this.allSalonsCache[0] || REGISTERED_SALONS[0];
  }

  // Check if user is platform Super Admin server-side via Supabase RPC
  public async checkIsSuperAdmin(email?: string): Promise<boolean> {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('is_platform_admin', { check_email: cleanEmail });
        if (!error && typeof data === 'boolean') {
          return data;
        }
        const { data: adminRows } = await supabase
          .from('platform_admins')
          .select('id')
          .ilike('email', cleanEmail)
          .limit(1);
        if (adminRows && adminRows.length > 0) return true;
      } catch (err) {
        console.warn('Supabase is_platform_admin check error:', err);
      }
    }
    return cleanEmail === 'saifaliansari983790@gmail.com';
  }

  // Load Salons for User according to role - STRICT: ZERO DEFAULT LEAKAGE
  public async fetchUserSalons(user: { id: string; role: UserRole; ownedSalonIds?: string[]; assignedSalonId?: string; email?: string }): Promise<Salon[]> {
    if (supabase) {
      try {
        if (user.role === 'super_admin') {
          const { data } = await supabase
            .from('salons')
            .select('*')
            .order('created_at', { ascending: false });
          if (data && data.length > 0) {
            this.allSalonsCache = data;
            return data;
          }
        } else if (user.role === 'salon_owner') {
          let foundRemote: Salon[] = [];
          if (isValidUUID(user.id)) {
            const { data } = await supabase
              .from('salon_owners')
              .select('salon_id, salons(*)')
              .eq('user_id', user.id);
            if (data && data.length > 0) {
              foundRemote = data.map((item: any) => item.salons).filter(Boolean);
            }
          }
          if (foundRemote.length === 0 && user.email) {
            const { data: emailSalons } = await supabase
              .from('salons')
              .select('*')
              .ilike('email', user.email.trim().toLowerCase());
            if (emailSalons && emailSalons.length > 0) {
              foundRemote = emailSalons;
            }
          }
          if (foundRemote.length > 0) {
            foundRemote.forEach((s: Salon) => {
              if (!this.allSalonsCache.some(existing => existing.id === s.id)) {
                this.allSalonsCache.unshift(s);
              }
              this.saveSalonLocally(s, user.email, user.id);
            });
            return foundRemote;
          }
        } else if (user.role === 'manager' || user.role === 'staff') {
          if (isValidUUID(user.id)) {
            const { data } = await supabase
              .from('profiles')
              .select('salon_id, salons(*)')
              .eq('auth_user_id', user.id)
              .single();
            if (data && data.salons) {
              return [data.salons as unknown as Salon];
            }
          }
        }
      } catch (err) {
        console.warn('Supabase fetchUserSalons fallback:', err);
      }
    }

    // Role-based local resolution fallback with localStorage backup
    if (user.role === 'super_admin') {
      return [...this.allSalonsCache];
    } else if (user.role === 'salon_owner') {
      const localSalons = this.getLocalSalonsForUser(user.email, user.id, user.ownedSalonIds);
      if (localSalons.length > 0) {
        return localSalons;
      }
      if (user.ownedSalonIds && user.ownedSalonIds.length > 0) {
        return this.getSalonsByIds(user.ownedSalonIds);
      }
      return []; // Return empty so unassigned owners are routed to "Register Your Salon"
    } else if (user.assignedSalonId) {
      return this.getSalonsByIds([user.assignedSalonId]);
    }
    return []; // Never leak any salon to an unknown user!
  }

  // Super Admin: Get all registered salons (trial, active, past_due, expired)
  public async getAllSalonsForAdmin(): Promise<Salon[]> {
    if (supabase) {
      try {
        await this.syncLocalSalonsToSupabase();
        const { data, error } = await supabase
          .from('salons')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const enriched: Salon[] = data.map((remote: any) => {
            const local = this.allSalonsCache.find(x => x.id === remote.id);
            return {
              ...remote,
              pincode: local?.pincode || remote.pincode || '',
              upi_id: local?.upi_id || remote.upi_id || 'westernboys@upi',
              owner_name: local?.owner_name || remote.owner_name || (remote.email ? remote.email.split('@')[0] : 'Registered Owner'),
              owner_email: local?.owner_email || remote.owner_email || remote.email || '',
              trial_ends_at: remote.trial_ends_at || local?.trial_ends_at || remote.subscription_expires_at,
              subscription_expires_at: remote.subscription_expires_at || local?.subscription_expires_at
            };
          });

          // Merge remote with local in-memory cache so no newly registered salon is missed
          const map = new Map<string, Salon>();
          this.allSalonsCache.forEach(s => map.set(s.id, s));
          enriched.forEach(s => map.set(s.id, s));
          const merged = Array.from(map.values()).sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          this.allSalonsCache = merged;
          return merged;
        }
      } catch (err) {
        console.warn('Supabase getAllSalonsForAdmin error:', err);
      }
    }
    return [...this.allSalonsCache].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Marketplace: Get all active salons for customers (excludes expired salons)
  public async getAllSalons(): Promise<Salon[]> {
    if (supabase) {
      try {
        const { data } = await supabase
          .from('salons')
          .select('*')
          .neq('subscription_status', 'expired');
        if (data && data.length > 0) {
          this.allSalonsCache = data;
          return data;
        }
      } catch {}
    }
    return this.allSalonsCache.filter(s => s.subscription_status !== 'expired');
  }

  public getSalonsByIds(ids: string[]): Salon[] {
    return this.allSalonsCache.filter(s => ids.includes(s.id));
  }

  // Self-Serve Salon Registration with 7-Day Free Trial
  public async registerSalon(data: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    upi_id?: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    initialServices?: Array<{
      name: string;
      category: 'Hair' | 'Beard' | 'Combo' | 'Skin' | 'Spa';
      duration_minutes: number;
      in_salon_price: number;
      home_service_price: number;
    }>;
  }): Promise<Salon> {
    const salonId = generateUUID();
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `salon-${Date.now()}`;
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const newSalon: Salon = {
      id: salonId,
      name: data.name,
      slug,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      latitude: data.latitude,
      longitude: data.longitude,
      currency: 'INR',
      currency_symbol: '₹',
      upi_id: data.upi_id || 'westernboys@upi',
      owner_name: data.ownerName,
      owner_email: data.ownerEmail,
      subscription_plan: 'base_monthly',
      billing_cycle: 'monthly',
      subscription_status: 'trial',
      trial_ends_at: trialEnds,
      subscription_expires_at: trialEnds,
      created_at: now.toISOString(),
    };

    if (supabase) {
      try {
        let effectiveOwnerId = data.ownerId;
        if (!isValidUUID(effectiveOwnerId)) {
          try {
            const { data: authData } = await supabase.auth.getUser();
            if (authData?.user?.id && isValidUUID(authData.user.id)) {
              effectiveOwnerId = authData.user.id;
            }
          } catch {}
        }
        if (!isValidUUID(effectiveOwnerId)) {
          effectiveOwnerId = generateUUID();
        }

        const baseInsertData = {
          id: newSalon.id,
          name: newSalon.name,
          slug: newSalon.slug,
          phone: newSalon.phone,
          email: newSalon.email,
          address: newSalon.address + (newSalon.pincode && !newSalon.address.includes(newSalon.pincode) ? ` - ${newSalon.pincode}` : ''),
          city: newSalon.city,
          state: newSalon.state,
          currency: newSalon.currency || 'INR',
          currency_symbol: newSalon.currency_symbol || '₹',
          subscription_plan: newSalon.subscription_plan || 'base_monthly',
          billing_cycle: newSalon.billing_cycle || 'monthly',
          subscription_status: newSalon.subscription_status || 'trial',
          subscription_expires_at: newSalon.subscription_expires_at || newSalon.trial_ends_at
        };

        const { error: salonErr } = await supabase.from('salons').insert(baseInsertData);

        if (salonErr) {
          console.error('Supabase salons insert error:', salonErr);
        } else {
          console.log('Successfully registered salon in Supabase:', newSalon.id);
        }

        const { error: ownerErr } = await supabase.from('salon_owners').insert({
          user_id: effectiveOwnerId,
          salon_id: newSalon.id,
          is_primary: true
        });

        if (ownerErr) {
          console.error('Supabase salon_owners insert error:', ownerErr);
        }
      } catch (err) {
        console.warn('Supabase registerSalon insert error:', err);
      }
    }

    const servicesList: Service[] = (data.initialServices && data.initialServices.length > 0)
      ? data.initialServices.map((s) => ({
          id: generateUUID(),
          salon_id: salonId,
          name: s.name,
          category: s.category,
          description: 'Custom Salon Service',
          duration_minutes: s.duration_minutes,
          in_salon_price: s.in_salon_price,
          home_service_price: s.home_service_price,
          is_active: true
        }))
      : [
          {
            id: generateUUID(),
            salon_id: salonId,
            name: 'Classic Precision Haircut',
            category: 'Hair',
            description: 'Precision cut tailored to face profile with wash.',
            duration_minutes: 30,
            in_salon_price: 250,
            home_service_price: 450,
            is_active: true
          },
          {
            id: generateUUID(),
            salon_id: salonId,
            name: 'Royal Hot Towel Beard Sculpt',
            category: 'Beard',
            description: 'Straight razor trim, steam, and beard oil nourishment.',
            duration_minutes: 20,
            in_salon_price: 180,
            home_service_price: 300,
            is_active: true
          }
        ];

    if (supabase) {
      try {
        await supabase.from('services').insert(
          servicesList.map(s => ({
            id: s.id,
            salon_id: s.salon_id,
            name: s.name,
            category: s.category,
            description: s.description,
            duration_minutes: s.duration_minutes,
            in_salon_price: s.in_salon_price,
            home_service_price: s.home_service_price,
            is_active: true
          }))
        );
      } catch (err) {
        console.warn('Supabase services insert error:', err);
      }
    }

    this.tenantData.set(salonId, {
      services: servicesList,
      appointments: [],
      tokens: [],
      inventory: [],
      customers: [],
      invoices: [],
      staff: [
        {
          id: generateUUID(),
          salon_id: salonId,
          role: 'staff',
          full_name: data.ownerName || 'Lead Stylist',
          phone: data.phone,
          specialties: ['Precision Fade', 'Hot Towel Beard'],
          rating: 5.0,
          commission_rate: 0,
          is_active: true
        }
      ]
    });

    this.allSalonsCache.unshift(newSalon);
    this.activeSalonId = salonId;

    // Immediately persist salon and tenant data to localStorage
    this.saveSalonLocally(newSalon, data.ownerEmail, data.ownerId);

    this.notify();
    return newSalon;
  }

  // Renew Subscription / Upgrade Plan
  public async renewSubscription(
    salonId: string,
    plan: SubscriptionPlanType,
    cycle: 'monthly' | '6_months' | '1_year'
  ): Promise<Salon | null> {
    const salon = this.allSalonsCache.find(s => s.id === salonId);
    if (!salon) return null;

    const daysToAdd = cycle === '1_year' ? 365 : cycle === '6_months' ? 180 : 30;
    const now = new Date();
    const currentExpiry = salon.subscription_expires_at ? new Date(salon.subscription_expires_at) : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    salon.subscription_status = 'active';
    salon.subscription_plan = plan;
    salon.billing_cycle = cycle;
    salon.subscription_expires_at = newExpiry;

    if (supabase) {
      try {
        await supabase.from('salons').update({
          subscription_status: 'active',
          subscription_plan: plan,
          billing_cycle: cycle,
          subscription_expires_at: newExpiry
        }).eq('id', salonId);
      } catch (err) {
        console.warn('Supabase renewSubscription error:', err);
      }
    }

    this.notify();
    return salon;
  }

  // Payment Screenshot Verification Flows
  public async verifyPayment(appointmentId: string, staffId?: string): Promise<boolean> {
    let found = false;
    let targetSalonId: string | null = null;
    for (const [sId, store] of this.tenantData.entries()) {
      const appt = store.appointments.find(a => a.id === appointmentId);
      if (appt) {
        appt.payment_status = 'completed';
        appt.status = 'confirmed';
        appt.payment_verified_at = new Date().toISOString();
        if (staffId) appt.payment_verified_by = staffId;

        const tok = store.tokens.find(t => t.appointment_id === appointmentId || t.id === appointmentId);
        if (tok) {
          tok.is_verified = true;
          tok.status = 'waiting';
        }
        targetSalonId = sId;
        this.persistTenantDataLocally(sId);
        found = true;
        break;
      }
    }

    if (supabase) {
      try {
        await supabase.from('appointments').update({
          payment_status: 'completed',
          status: 'confirmed',
          payment_verified_at: new Date().toISOString()
        }).eq('id', appointmentId);
      } catch (err) {
        console.warn('Supabase verifyPayment error:', err);
      }
    }

    try {
      localStorage.setItem('wbs_last_booking_event', JSON.stringify({
        action: 'verified',
        apptId: appointmentId,
        salonId: targetSalonId,
        timestamp: Date.now()
      }));
      window.dispatchEvent(new CustomEvent('wbs_appointment_updated'));
    } catch {}

    this.notify();
    return found;
  }

  public async rejectPayment(appointmentId: string, reason: string): Promise<boolean> {
    let found = false;
    let targetSalonId: string | null = null;
    for (const [sId, store] of this.tenantData.entries()) {
      const appt = store.appointments.find(a => a.id === appointmentId);
      if (appt) {
        appt.payment_status = 'failed';
        appt.status = 'cancelled';
        appt.rejection_reason = reason;

        const tok = store.tokens.find(t => t.appointment_id === appointmentId || t.id === appointmentId);
        if (tok) {
          tok.status = 'skipped';
        }
        targetSalonId = sId;
        this.persistTenantDataLocally(sId);
        found = true;
        break;
      }
    }

    if (supabase) {
      try {
        await supabase.from('appointments').update({
          payment_status: 'failed',
          status: 'cancelled',
          rejection_reason: reason
        }).eq('id', appointmentId);
      } catch (err) {
        console.warn('Supabase rejectPayment error:', err);
      }
    }

    try {
      localStorage.setItem('wbs_last_booking_event', JSON.stringify({
        action: 'rejected',
        apptId: appointmentId,
        salonId: targetSalonId,
        timestamp: Date.now()
      }));
      window.dispatchEvent(new CustomEvent('wbs_appointment_updated'));
    } catch {}

    this.notify();
    return found;
  }

  // Asynchronously query Supabase and sync local store for pending bookings
  public async fetchPendingVerifications(salonId?: string): Promise<Appointment[]> {
    const id = salonId || this.activeSalonId;
    const store = this.getStore(id);

    // 1. Reload any localStorage updates from other tabs
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedStore = localStorage.getItem('wbs_tenant_data_' + id);
        if (savedStore) {
          const parsed = JSON.parse(savedStore);
          if (parsed && Array.isArray(parsed.appointments)) {
            parsed.appointments.forEach((localAppt: Appointment) => {
              const idx = store.appointments.findIndex(a => a.id === localAppt.id);
              if (idx >= 0) {
                store.appointments[idx] = { ...store.appointments[idx], ...localAppt };
              } else {
                store.appointments.unshift(localAppt);
              }
            });
          }
        }
      }
    } catch {}

    // 2. Query live Supabase appointments table
    if (supabase) {
      try {
        const { data: remoteAppts, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('salon_id', id)
          .or('payment_status.eq.pending,status.eq.pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase fetchPendingVerifications query error:', error);
        } else if (remoteAppts) {
          const salon = this.allSalonsCache.find(s => s.id === id) || this.getActiveSalon();
          remoteAppts.forEach((remote: any) => {
            let parsedNotes: any = {};
            try {
              if (remote.notes && typeof remote.notes === 'string') {
                parsedNotes = JSON.parse(remote.notes);
              }
            } catch {}

            const fullPrice = remote.full_service_price || parsedNotes.full_service_price || Math.round((remote.amount || 0) * 10);
            const tokenFee = remote.token_fee || parsedNotes.token_fee || remote.amount || Math.round(fullPrice * 0.10);
            const balanceDue = remote.balance_due || parsedNotes.balance_due || Math.max(0, fullPrice - tokenFee);

            const mapped: Appointment = {
              id: remote.id,
              salon_id: remote.salon_id,
              salon_name: salon.name,
              customer_id: remote.customer_id,
              customer_name: remote.customer_name || parsedNotes.customer_name || 'Valued Customer',
              customer_phone: remote.customer_phone || parsedNotes.customer_phone || '',
              customer_email: remote.customer_email || parsedNotes.customer_email || '',
              staff_id: remote.staff_id,
              staff_name: remote.staff_name || parsedNotes.staff_name || 'Selected Stylist',
              service_id: remote.service_id,
              service_name: remote.service_name || parsedNotes.service_name || 'Hair & Grooming Service',
              service_type: remote.service_type || 'in_salon',
              booking_channel: remote.booking_channel || 'web',
              appointment_date: remote.appointment_date,
              time_slot: remote.time_slot,
              status: remote.status,
              amount: tokenFee,
              full_service_price: fullPrice,
              token_fee: tokenFee,
              balance_due: balanceDue,
              payment_status: remote.payment_status,
              payment_gateway: remote.payment_gateway || 'upi',
              payment_screenshot_url: remote.payment_screenshot_url || parsedNotes.payment_screenshot_url || remote.transaction_ref || null,
              token_code: remote.token_code || parsedNotes.token_code || `WBS-${remote.id.slice(0, 4).toUpperCase()}`,
              token_number: remote.token_number || parsedNotes.token_number || 1,
              notes: remote.notes,
              created_at: remote.created_at
            };

            const existingIdx = store.appointments.findIndex(a => a.id === mapped.id);
            if (existingIdx >= 0) {
              const existing = store.appointments[existingIdx];
              // Don't overwrite if local state is already confirmed, completed, or cancelled
              if (existing.status === 'confirmed' || existing.status === 'completed' || existing.status === 'cancelled' || existing.payment_status === 'completed') {
                return;
              }
              store.appointments[existingIdx] = mapped;
            } else {
              store.appointments.unshift(mapped);
            }
          });
          this.persistTenantDataLocally(id);
        }
      } catch (err) {
        console.warn('Exception in fetchPendingVerifications:', err);
      }
    }

    return store.appointments.filter(a => 
      (a.payment_status === 'pending' || a.status === 'pending') &&
      a.status !== 'confirmed' &&
      a.payment_status !== 'completed' &&
      a.status !== 'cancelled'
    );
  }

  public getPendingVerifications(salonId?: string): Appointment[] {
    const id = salonId || this.activeSalonId;
    const store = this.getStore(id);
    return store.appointments.filter(a => 
      (a.payment_status === 'pending' || a.status === 'pending') &&
      a.status !== 'confirmed' &&
      a.payment_status !== 'completed' &&
      a.status !== 'cancelled'
    );
  }

  // Upload payment screenshot to private Supabase Storage bucket 'payment-receipts'
  public async uploadPaymentReceipt(
    fileOrBlob: File | Blob,
    salonId: string,
    fileName = 'receipt.png'
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    if (!supabase) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ success: true, path: reader.result as string });
        reader.onerror = () => resolve({ success: false, error: 'Could not read file.' });
        reader.readAsDataURL(fileOrBlob);
      });
    }

    try {
      const ext = (fileOrBlob as File).name?.split('.').pop() || 'png';
      const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniquePath = `${salonId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt || 'png'}`;

      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .upload(uniquePath, fileOrBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: (fileOrBlob as File).type || 'image/png'
        });

      if (error) {
        console.warn('Supabase storage upload failed, falling back to base64 Data URL:', error.message);
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ success: true, path: reader.result as string });
          reader.onerror = () => resolve({ success: false, error: error.message });
          reader.readAsDataURL(fileOrBlob);
        });
      }

      return { success: true, path: data.path };
    } catch (err: any) {
      console.warn('Storage upload exception, falling back:', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ success: true, path: reader.result as string });
        reader.onerror = () => resolve({ success: false, error: err.message });
        reader.readAsDataURL(fileOrBlob);
      });
    }
  }

  // Generate short-lived signed URL for a receipt storage path
  public async getReceiptSignedUrl(pathOrUrl?: string, expiresInSeconds = 300): Promise<string | null> {
    if (!pathOrUrl) return null;
    if (pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }

    if (!supabase) return null;

    try {
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(pathOrUrl, expiresInSeconds);

      if (error || !data?.signedUrl) {
        console.warn('Could not generate signed URL for receipt:', error?.message);
        return null;
      }
      return data.signedUrl;
    } catch (err) {
      console.warn('Signed URL exception:', err);
      return null;
    }
  }

  // Haversine Distance Calculation (km)
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((R * c) * 10) / 10;
  }

  // Admin Audit Logging
  private auditLogs: AdminAuditLog[] = [
    {
      id: 'log-seed-1',
      admin_email: 'saifaliansari983790@gmail.com',
      action: 'PLATFORM_BOOTSTRAP',
      target_salon_name: 'Platform',
      details: { message: 'Multi-tenant cloud initialized with 2 seeded salons' },
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  public async logAdminAction(adminEmail: string, action: string, targetSalonId?: string, details?: any): Promise<void> {
    const salon = targetSalonId ? this.allSalonsCache.find(s => s.id === targetSalonId) : undefined;
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      admin_email: adminEmail,
      action,
      target_salon_id: targetSalonId,
      target_salon_name: salon?.name,
      details: details || {},
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);

    if (supabase) {
      try {
        await supabase.from('admin_audit_logs').insert({
          id: newLog.id,
          admin_email: adminEmail,
          action,
          target_salon_id: targetSalonId,
          details: newLog.details,
          created_at: newLog.created_at
        });
      } catch (err) {
        console.warn('Supabase logAdminAction error:', err);
      }
    }
    this.notify();
  }

  public getAdminAuditLogs(): AdminAuditLog[] {
    return [...this.auditLogs];
  }

  // Tenant-Scoped Data Getters
  private getStore(salonId?: string): TenantStore {
    const id = salonId || this.activeSalonId;
    if (!this.tenantData.has(id)) {
      this.tenantData.set(id, {
        services: [],
        appointments: [],
        tokens: [],
        inventory: [],
        customers: [],
        invoices: [],
        staff: []
      });
    }
    return this.tenantData.get(id)!;
  }

  public getAllSalonsSync(): Salon[] {
    return this.allSalonsCache;
  }

  public getServices(param?: string | boolean): Service[] {
    if (typeof param === 'boolean') {
      const store = this.getStore();
      return param ? store.services.filter(s => s.is_active) : store.services;
    }
    return this.getStore(param).services;
  }

  public getStaff(salonId?: string): Profile[] {
    return this.getStore(salonId).staff;
  }

  public persistTenantDataLocally(salonId: string) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const store = this.tenantData.get(salonId);
      if (store) {
        localStorage.setItem('wbs_tenant_data_' + salonId, JSON.stringify(store));
      }
    } catch (e) {
      console.warn('Could not persist tenant data locally:', e);
    }
  }

  public async getTeamMembers(salonId?: string): Promise<Profile[]> {
    const id = salonId || this.activeSalonId;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('salon_id', id)
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          const store = this.getStore(id);
          data.forEach((remote: any) => {
            const idx = store.staff.findIndex(s => s.id === remote.id || (remote.email && s.email && s.email.toLowerCase() === remote.email.toLowerCase()));
            const mapped: Profile = {
              id: remote.id,
              salon_id: remote.salon_id,
              role: remote.role,
              full_name: remote.full_name,
              phone: remote.phone,
              email: remote.email || undefined,
              avatar_url: remote.avatar_url || undefined,
              specialties: Array.isArray(remote.specialties) ? remote.specialties : ['Haircut'],
              rating: Number(remote.rating) || 5.0,
              commission_rate: Number(remote.commission_rate) || 15,
              is_active: remote.is_active !== false
            };
            if (idx >= 0) {
              store.staff[idx] = mapped;
            } else {
              store.staff.push(mapped);
            }
          });
          return [...store.staff];
        }
      } catch (err) {
        console.warn('Supabase getTeamMembers error, using local store:', err);
      }
    }
    return [...this.getStore(id).staff];
  }

  public async addTeamMember(params: {
    salonId: string;
    fullName: string;
    phone: string;
    email?: string;
    role: 'manager' | 'staff';
    specialties?: string[];
    commissionRate?: number;
    actorEmail: string;
    actorRole: UserRole;
  }): Promise<{ success: boolean; error?: string; profile?: Profile }> {
    // 1. Role-based permission verification
    if (params.actorRole === 'manager' && params.role !== 'staff') {
      return { success: false, error: 'Managers are only permitted to add Staff members, not other Managers.' };
    }
    if (params.actorRole !== 'salon_owner' && params.actorRole !== 'manager' && params.actorRole !== 'super_admin') {
      return { success: false, error: 'Unauthorized: Only salon owners and managers can add team members.' };
    }

    // 2. Name validation
    if (!params.fullName || params.fullName.trim().length < 2) {
      return { success: false, error: 'Please enter a valid full name (at least 2 characters).' };
    }

    // 3. Phone validation
    const rawPhone = params.phone.trim();
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile phone number.' };
    }
    const standardPhone = rawPhone.startsWith('+') ? rawPhone : (digitsOnly.length === 10 ? `+91 ${digitsOnly}` : `+${digitsOnly}`);

    // 4. Email validation (crucial for Email OTP login)
    const cleanEmail = params.email ? params.email.trim().toLowerCase() : undefined;
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, error: 'Please enter a valid email address for staff login.' };
      }
    }

    // 5. Duplicate check per salon (enforce unique phone & email within same salon)
    const store = this.getStore(params.salonId);
    const existing = store.staff.find(s => {
      const sDigits = (s.phone || '').replace(/\D/g, '');
      const phoneMatch = sDigits.length >= 10 && digitsOnly.endsWith(sDigits.slice(-10));
      const emailMatch = cleanEmail && s.email && s.email.trim().toLowerCase() === cleanEmail;
      return phoneMatch || emailMatch;
    });

    if (existing) {
      const isEmailDup = cleanEmail && existing.email && existing.email.trim().toLowerCase() === cleanEmail;
      return {
        success: false,
        error: isEmailDup 
          ? `A team member with email "${cleanEmail}" already exists in this salon (${existing.full_name}).`
          : `A team member with this mobile number already exists in this salon (${existing.full_name}).`
      };
    }

    // 6. Create Profile object
    const newProfile: Profile = {
      id: generateUUID(),
      salon_id: params.salonId,
      role: params.role,
      full_name: params.fullName.trim(),
      phone: standardPhone,
      email: cleanEmail,
      specialties: params.specialties && params.specialties.length > 0 ? params.specialties : ['Haircut', 'Beard Sculpting'],
      rating: 5.0,
      commission_rate: params.commissionRate !== undefined ? Number(params.commissionRate) : (params.role === 'manager' ? 25 : 15),
      is_active: true
    };

    // Save to local tenant store
    store.staff.push(newProfile);
    this.persistTenantDataLocally(params.salonId);

    // Save to Supabase
    if (supabase) {
      try {
        await supabase.from('profiles').insert({
          id: newProfile.id,
          salon_id: newProfile.salon_id,
          role: newProfile.role,
          full_name: newProfile.full_name,
          phone: newProfile.phone,
          email: newProfile.email,
          specialties: newProfile.specialties,
          rating: newProfile.rating,
          commission_rate: newProfile.commission_rate,
          is_active: true
        });
      } catch (err) {
        console.warn('Supabase profile insertion fallback:', err);
      }
    }

    // Record audit log
    await this.logAdminAction(
      params.actorEmail,
      'STAFF_ADDED',
      params.salonId,
      {
        member_id: newProfile.id,
        full_name: newProfile.full_name,
        role: newProfile.role,
        phone: newProfile.phone,
        email: newProfile.email,
        added_by_role: params.actorRole
      }
    );

    this.notify();
    return { success: true, profile: newProfile };
  }

  public async updateTeamMember(params: {
    memberId: string;
    salonId: string;
    updates: Partial<Profile>;
    actorEmail: string;
    actorRole: UserRole;
  }): Promise<{ success: boolean; error?: string }> {
    const store = this.getStore(params.salonId);
    const target = store.staff.find(s => s.id === params.memberId);
    if (!target) {
      return { success: false, error: 'Team member not found.' };
    }

    // Manager restriction: Cannot update a Manager
    if (params.actorRole === 'manager') {
      if (target.role === 'manager') {
        return { success: false, error: 'Managers cannot modify Manager profiles.' };
      }
      if (params.updates.role && params.updates.role !== 'staff') {
        return { success: false, error: 'Managers cannot elevate a member to Manager.' };
      }
    }

    if (params.updates.full_name) target.full_name = params.updates.full_name.trim();
    if (params.updates.phone) target.phone = params.updates.phone.trim();
    if (params.updates.email !== undefined) target.email = params.updates.email ? params.updates.email.trim().toLowerCase() : undefined;
    if (params.updates.role) target.role = params.updates.role;
    if (params.updates.specialties) target.specialties = params.updates.specialties;
    if (params.updates.commission_rate !== undefined) target.commission_rate = Number(params.updates.commission_rate);
    if (params.updates.is_active !== undefined) target.is_active = params.updates.is_active;

    this.persistTenantDataLocally(params.salonId);

    if (supabase) {
      try {
        await supabase.from('profiles').update({
          full_name: target.full_name,
          phone: target.phone,
          email: target.email,
          role: target.role,
          specialties: target.specialties,
          commission_rate: target.commission_rate,
          is_active: target.is_active
        }).eq('id', params.memberId);
      } catch (err) {
        console.warn('Supabase profile update fallback:', err);
      }
    }

    await this.logAdminAction(
      params.actorEmail,
      'STAFF_UPDATED',
      params.salonId,
      {
        member_id: target.id,
        full_name: target.full_name,
        role: target.role,
        updated_by_role: params.actorRole
      }
    );

    this.notify();
    return { success: true };
  }

  public async deactivateTeamMember(params: {
    memberId: string;
    salonId: string;
    actorEmail: string;
    actorRole: UserRole;
  }): Promise<{ success: boolean; error?: string }> {
    const store = this.getStore(params.salonId);
    const target = store.staff.find(s => s.id === params.memberId);
    if (!target) {
      return { success: false, error: 'Team member not found.' };
    }

    if (params.actorRole === 'manager' && target.role === 'manager') {
      return { success: false, error: 'Managers cannot deactivate another Manager.' };
    }

    target.is_active = false;
    this.persistTenantDataLocally(params.salonId);

    if (supabase) {
      try {
        await supabase.from('profiles').update({ is_active: false }).eq('id', params.memberId);
      } catch (err) {
        console.warn('Supabase profile deactivation fallback:', err);
      }
    }

    await this.logAdminAction(
      params.actorEmail,
      'STAFF_DEACTIVATED',
      params.salonId,
      {
        member_id: target.id,
        full_name: target.full_name,
        role: target.role,
        deactivated_by_role: params.actorRole
      }
    );

    this.notify();
    return { success: true };
  }

  public async reactivateTeamMember(params: {
    memberId: string;
    salonId: string;
    actorEmail: string;
    actorRole: UserRole;
  }): Promise<{ success: boolean; error?: string }> {
    const store = this.getStore(params.salonId);
    const target = store.staff.find(s => s.id === params.memberId);
    if (!target) {
      return { success: false, error: 'Team member not found.' };
    }

    target.is_active = true;
    this.persistTenantDataLocally(params.salonId);

    if (supabase) {
      try {
        await supabase.from('profiles').update({ is_active: true }).eq('id', params.memberId);
      } catch (err) {
        console.warn('Supabase profile reactivate fallback:', err);
      }
    }

    await this.logAdminAction(
      params.actorEmail,
      'STAFF_REACTIVATED',
      params.salonId,
      {
        member_id: target.id,
        full_name: target.full_name,
        role: target.role,
        reactivated_by_role: params.actorRole
      }
    );

    this.notify();
    return { success: true };
  }

  public async findStaffProfileByAuthUserOrEmail(user: { id?: string; email?: string; phone?: string }): Promise<{ profile: Profile; salon: Salon; isDeactivated?: boolean } | null> {
    const cleanEmail = user.email ? user.email.trim().toLowerCase() : '';
    const userPhone = user.phone ? user.phone.replace(/\D/g, '') : '';

    // 1. Check Supabase
    if (supabase) {
      try {
        let query = supabase.from('profiles').select('*, salons(*)');
        if (user.id && isValidUUID(user.id)) {
          if (cleanEmail) {
            query = query.or(`auth_user_id.eq.${user.id},email.ilike.${cleanEmail}`);
          } else {
            query = query.eq('auth_user_id', user.id);
          }
        } else if (cleanEmail) {
          query = query.ilike('email', cleanEmail);
        }

        const { data } = await query.maybeSingle();
        if (data && data.salons) {
          const profile: Profile = {
            id: data.id,
            salon_id: data.salon_id,
            role: data.role,
            full_name: data.full_name,
            phone: data.phone,
            email: data.email || undefined,
            avatar_url: data.avatar_url || undefined,
            specialties: Array.isArray(data.specialties) ? data.specialties : ['Haircut'],
            rating: Number(data.rating) || 5.0,
            commission_rate: Number(data.commission_rate) || 15,
            is_active: data.is_active !== false
          };
          const salon = data.salons as unknown as Salon;

          if (!profile.is_active) {
            return { profile, salon, isDeactivated: true };
          }

          // Link auth_user_id if not linked
          if (user.id && isValidUUID(user.id) && data.auth_user_id !== user.id) {
            await supabase.from('profiles').update({ auth_user_id: user.id }).eq('id', data.id);
          }
          return { profile, salon };
        }
      } catch (err) {
        console.warn('findStaffProfileByAuthUserOrEmail Supabase fallback:', err);
      }
    }

    // 2. Check local stores across all cached salons
    for (const salon of this.allSalonsCache) {
      const store = this.getStore(salon.id);
      const matched = store.staff.find(s => {
        if (cleanEmail && s.email && s.email.trim().toLowerCase() === cleanEmail) return true;
        if (userPhone && s.phone && s.phone.replace(/\D/g, '').endsWith(userPhone.slice(-10))) return true;
        return false;
      });
      if (matched) {
        if (!matched.is_active) {
          return { profile: matched, salon, isDeactivated: true };
        }
        return { profile: matched, salon };
      }
    }

    return null;
  }

  public getAppointments(salonId?: string): Appointment[] {
    return this.getStore(salonId).appointments;
  }

  public getTokens(salonId?: string): Token[] {
    return this.getStore(salonId).tokens;
  }

  public getCurrentlyServingToken(salonId?: string): Token | undefined {
    return this.getStore(salonId).tokens.find(t => t.status === 'serving');
  }

  public getWaitingTokens(salonId?: string): Token[] {
    return this.getStore(salonId).tokens.filter(t => t.status === 'waiting');
  }

  public getInventory(salonId?: string): InventoryItem[] {
    return this.getStore(salonId).inventory;
  }

  public getCustomers(salonId?: string): Customer[] {
    return this.getStore(salonId).customers;
  }

  public getInvoices(salonId?: string): Invoice[] {
    return this.getStore(salonId).invoices;
  }

  public callNextCustomer(): Token | null {
    const store = this.getStore();
    const waiting = store.tokens.filter(t => t.status === 'waiting');
    if (waiting.length === 0) return null;
    const nextToken = waiting[0];
    nextToken.status = 'serving';
    nextToken.estimated_wait_minutes = 0;
    const appt = store.appointments.find(a => a.id === nextToken.appointment_id);
    if (appt) appt.status = 'serving';
    this.notify();
    return nextToken;
  }

  public completeToken(tokenId: string) {
    const store = this.getStore();
    const tok = store.tokens.find(t => t.id === tokenId);
    if (tok) {
      tok.status = 'completed';
      const appt = store.appointments.find(a => a.id === tok.appointment_id);
      if (appt) appt.status = 'completed';
      this.createInvoiceForAppointment(tok.appointment_id);
      this.notify();
    }
  }

  public skipToken(tokenId: string) {
    const store = this.getStore();
    const tok = store.tokens.find(t => t.id === tokenId);
    if (tok) {
      tok.status = 'skipped';
      const appt = store.appointments.find(a => a.id === tok.appointment_id);
      if (appt) appt.status = 'cancelled';
      this.notify();
    }
  }

  // Global cross-salon & live token search
  public async findTokenGlobal(searchTerm: string): Promise<{
    token: Token;
    salon: Salon;
    positionInQueue: number;
    currentlyServing?: Token;
    appointment?: Appointment;
    queueAheadCount: number;
  } | null> {
    const rawTerm = searchTerm.trim();
    if (!rawTerm) return null;

    const cleanTerm = rawTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    const digitsOnly = rawTerm.replace(/\D/g, '');

    // 1. Search in-memory across all tenant stores
    for (const [salonId, store] of this.tenantData.entries()) {
      const salon = this.allSalonsCache.find(s => s.id === salonId) || REGISTERED_SALONS[0];
      const waiting = store.tokens.filter(t => t.status === 'waiting');
      const currentlyServing = store.tokens.find(t => t.status === 'serving');

      const matchedToken = store.tokens.find(t => {
        const codeClean = t.token_code.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (codeClean === cleanTerm) return true;
        if (t.token_code.toLowerCase() === rawTerm.toLowerCase()) return true;
        if (String(t.token_number) === cleanTerm) return true;
        if (t.token_code.toLowerCase().endsWith(cleanTerm)) return true;

        // Customer name match
        if (t.customer_name.toLowerCase().includes(rawTerm.toLowerCase())) return true;

        // Customer phone match via appointments
        if (digitsOnly.length >= 4) {
          const appt = store.appointments.find(a => a.id === t.appointment_id);
          const apptPhone = (appt?.customer_phone || '').replace(/\D/g, '');
          if (apptPhone && apptPhone.endsWith(digitsOnly.slice(-10))) return true;
        }

        return false;
      });

      if (matchedToken) {
        const position = matchedToken.status === 'waiting'
          ? waiting.findIndex(w => w.id === matchedToken.id) + 1
          : 0;
        const appt = store.appointments.find(a => a.id === matchedToken.appointment_id);

        return {
          token: matchedToken,
          salon,
          positionInQueue: position,
          currentlyServing,
          appointment: appt,
          queueAheadCount: Math.max(0, position - 1)
        };
      }
    }

    // 2. Also search Supabase if live
    if (supabase) {
      try {
        const { data } = await supabase
          .from('tokens')
          .select('*, appointments(*), salons(*)')
          .or(`token_code.ilike.%${cleanTerm}%,token_code.ilike.%${rawTerm}%`)
          .limit(1);

        if (data && data.length > 0) {
          const row = data[0];
          const salon = row.salons || this.allSalonsCache[0];
          const token: Token = {
            id: row.id,
            salon_id: row.salon_id,
            appointment_id: row.appointment_id,
            token_number: row.token_number,
            token_code: row.token_code,
            customer_name: row.appointments?.customer_name || 'Valued Client',
            service_name: row.appointments?.service_name || 'Hair Service',
            staff_name: row.appointments?.staff_name || 'Stylist',
            service_type: row.appointments?.service_type || 'in_salon',
            queue_date: row.queue_date,
            status: row.status,
            estimated_wait_minutes: row.estimated_wait_minutes || 15,
            created_at: row.created_at
          };

          return {
            token,
            salon,
            positionInQueue: token.status === 'waiting' ? 1 : 0,
            appointment: row.appointments,
            queueAheadCount: 0
          };
        }
      } catch (err) {
        console.warn('Supabase findTokenGlobal fallback:', err);
      }
    }

    return null;
  }

  // Get all active tokens across all salons
  public getAllActiveTokens(): { token: Token; salon: Salon }[] {
    const list: { token: Token; salon: Salon }[] = [];
    this.tenantData.forEach((store, salonId) => {
      const salon = this.allSalonsCache.find(s => s.id === salonId) || REGISTERED_SALONS[0];
      store.tokens.forEach(token => {
        list.push({ token, salon });
      });
    });
    return list;
  }

  public addService(service: any) {
    const store = this.getStore();
    const newService: Service = {
      id: service.id || `srv-${Date.now()}`,
      salon_id: this.activeSalonId,
      name: service.name,
      category: service.category,
      description: service.description || '',
      duration_minutes: service.duration_minutes || 30,
      in_salon_price: service.in_salon_price || 200,
      home_service_price: service.home_service_price || 350,
      is_active: service.is_active ?? true
    };
    const existingIndex = store.services.findIndex(s => s.id === newService.id);
    if (existingIndex >= 0) {
      store.services[existingIndex] = newService;
    } else {
      store.services.push(newService);
    }
    this.notify();
  }

  public restockInventory(id: string, qty: number) {
    const store = this.getStore();
    const item = store.inventory.find(i => i.id === id);
    if (item) {
      item.quantity += qty;
      this.notify();
    }
  }

  public createInvoiceForAppointment(apptId: string) {
    const store = this.getStore();
    const appt = store.appointments.find(a => a.id === apptId);
    if (!appt) return;
    const invNumber = `INV-${Date.now().toString().slice(-6)}`;
    const tax = Math.round(appt.amount * 0.18);
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      salon_id: appt.salon_id,
      appointment_id: appt.id,
      customer_id: appt.customer_id,
      customer_name: appt.customer_name || 'Valued Client',
      customer_phone: appt.customer_phone || '+91 98290 00000',
      invoice_number: invNumber,
      service_name: appt.service_name || 'Salon Service',
      service_type: appt.service_type || 'in_salon',
      subtotal: appt.amount,
      tax_percent: 18,
      tax_amount: tax,
      discount_amount: 0,
      total_amount: appt.amount + tax,
      payment_status: 'completed',
      payment_method: appt.payment_gateway,
      created_at: new Date().toISOString()
    };
    store.invoices.push(invoice);
    this.notify();
  }

  public addAppointmentAndToken(data: any) {
    const store = this.getStore();
    const salon = this.getActiveSalon();
    const service = store.services.find(s => s.id === data.service_id);
    const price = service ? (data.service_type === 'home_service' ? service.home_service_price : service.in_salon_price) : 250;
    const tokenFee = Math.round(price * 0.10);
    const balanceDue = Math.max(0, price - tokenFee);

    const tokenNumber = store.tokens.length + 1;
    const prefix = salon.slug.includes('grooming') ? 'WGL' : 'WBS';
    const tokenCode = `${prefix}-${String(tokenNumber).padStart(2, '0')}`;
    const waitMinutes = (tokenNumber - 1) * 20;

    const apptId = `appt-${Date.now()}`;
    const newAppointment: Appointment = {
      id: apptId,
      salon_id: salon.id,
      salon_name: salon.name,
      customer_id: `cust-${Date.now()}`,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      staff_id: data.staff_id,
      staff_name: 'Assigned Stylist',
      service_id: data.service_id,
      service_name: service?.name || 'Custom Service',
      service_type: data.service_type,
      booking_channel: data.booking_channel || 'web',
      appointment_date: data.appointment_date,
      time_slot: data.time_slot,
      status: 'confirmed',
      amount: price,
      full_service_price: price,
      token_fee: tokenFee,
      balance_due: balanceDue,
      payment_status: data.payment_status || 'completed',
      payment_gateway: data.payment_gateway || 'mock_razorpay',
      token_number: tokenNumber,
      token_code: tokenCode,
      created_at: new Date().toISOString()
    };

    const newToken: Token = {
      id: `tok-${Date.now()}`,
      salon_id: salon.id,
      appointment_id: apptId,
      token_number: tokenNumber,
      token_code: tokenCode,
      customer_name: data.customer_name,
      service_name: service?.name || 'Custom Service',
      staff_name: 'Assigned Stylist',
      service_type: data.service_type,
      queue_date: data.appointment_date,
      status: 'waiting',
      estimated_wait_minutes: waitMinutes,
      created_at: new Date().toISOString()
    };

    store.appointments.push(newAppointment);
    store.tokens.push(newToken);
    this.notify();
    return { appointment: newAppointment, token: newToken };
  }

  // Customer Marketplace History: Fetch all visits across ANY salon on the platform
  public async fetchCustomerHistory(phone: string, email?: string): Promise<CustomerVisitRecord[]> {
    const normalizedPhone = phone.trim();
    const cleanPhone = normalizedPhone.replace(/\D/g, '').slice(-10); // last 10 digits for resilient matching

    const visitRecords: CustomerVisitRecord[] = [];

    // Check across all tenant stores
    this.tenantData.forEach((store, salonId) => {
      const salon = this.allSalonsCache.find(s => s.id === salonId) || REGISTERED_SALONS[0];
      const matchedCust = store.customers.find(c => 
        c.phone.replace(/\D/g, '').endsWith(cleanPhone) || (email && c.email === email)
      );

      store.appointments.forEach(appt => {
        const apptPhone = (appt.customer_phone || '').replace(/\D/g, '');
        if (apptPhone.endsWith(cleanPhone) || (matchedCust && appt.customer_id === matchedCust.id)) {
          visitRecords.push({
            appointmentId: appt.id,
            salonId: salon.id,
            salonName: salon.name,
            serviceName: appt.service_name || 'Salon Service',
            staffName: appt.staff_name,
            appointmentDate: appt.appointment_date,
            timeSlot: appt.time_slot,
            amount: appt.amount,
            status: appt.status,
            notes: appt.notes,
            stylistNotes: {
              hairPreference: matchedCust?.hair_preference_notes,
              allergy: matchedCust?.allergy_notes,
              behavior: matchedCust?.behavior_notes
            }
          });
        }
      });
    });

    // Also check Supabase if live
    if (supabase && cleanPhone) {
      try {
        const { data } = await supabase
          .from('appointments')
          .select('*, salons(name), customers(hair_preference_notes, allergy_notes, behavior_notes)')
          .ilike('customer_phone', `%${cleanPhone}%`);
        if (data && data.length > 0) {
          data.forEach((row: any) => {
            if (!visitRecords.some(r => r.appointmentId === row.id)) {
              visitRecords.push({
                appointmentId: row.id,
                salonId: row.salon_id,
                salonName: row.salons?.name || 'Western Salon',
                serviceName: row.service_name || 'Hair Service',
                staffName: row.staff_name,
                appointmentDate: row.appointment_date,
                timeSlot: row.time_slot,
                amount: row.amount,
                status: row.status,
                notes: row.notes,
                stylistNotes: {
                  hairPreference: row.customers?.hair_preference_notes,
                  allergy: row.customers?.allergy_notes,
                  behavior: row.customers?.behavior_notes
                }
              });
            }
          });
        }
      } catch (err) {
        console.warn('Customer history query fallback:', err);
      }
    }

    return visitRecords.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }

  // Book Appointment & Token (Customer Marketplace or In-Salon Walk-in)
  public async bookAppointmentAndToken(data: {
    salonId: string;
    serviceId: string;
    staffId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceType: 'in_salon' | 'home_service';
    bookingChannel: 'web' | 'walk_in' | 'whatsapp';
    appointmentDate: string;
    timeSlot: string;
    homeAddress?: string;
    allergyNotes?: string;
    paymentGateway: 'mock_razorpay' | 'cash' | 'upi';
    paymentScreenshotUrl?: string;
  }): Promise<{ appointment: Appointment; token: Token }> {
    const store = this.getStore(data.salonId);
    const salon = this.allSalonsCache.find(s => s.id === data.salonId) || this.getActiveSalon();
    const service = store.services.find(s => s.id === data.serviceId);
    const staff = store.staff.find(st => st.id === data.staffId) || store.staff[0];

    const fullServicePrice = service 
      ? (data.serviceType === 'home_service' ? service.home_service_price : service.in_salon_price)
      : 250;
    const tokenFee = Math.round(fullServicePrice * 0.10);
    const balanceDue = Math.max(0, fullServicePrice - tokenFee);

    // 1. Find or create customer in local memory
    let customer = store.customers.find(c => c.phone === data.customerPhone);
    if (!customer) {
      customer = {
        id: `cust-${Date.now()}`,
        salon_id: data.salonId,
        name: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail,
        allergy_notes: data.allergyNotes,
        total_visits: 1,
        total_spent: tokenFee,
        created_at: new Date().toISOString(),
      };
      store.customers.push(customer);
    } else {
      customer.total_visits += 1;
      customer.total_spent += tokenFee;
      if (data.allergyNotes) customer.allergy_notes = data.allergyNotes;
      if (data.customerEmail && !customer.email) customer.email = data.customerEmail;
    }

    // 2. Generate token code & number
    const tokenNumber = store.tokens.length + 1;
    const prefix = salon.slug.includes('grooming') ? 'WGL' : 'WBS';
    const tokenCode = `${prefix}-${String(tokenNumber).padStart(2, '0')}`;
    const waitMinutes = (tokenNumber - 1) * 20;

    const isPendingVerification = Boolean(data.paymentScreenshotUrl) || data.paymentGateway === 'upi';

    // 3. Create appointment
    const apptId = `appt-${Date.now()}`;
    const newAppointment: Appointment = {
      id: apptId,
      salon_id: data.salonId,
      salon_name: salon.name,
      customer_id: customer.id,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail,
      staff_id: staff?.id,
      staff_name: staff?.full_name || 'Selected Stylist',
      service_id: data.serviceId,
      service_name: service?.name || 'Custom Service',
      service_type: data.serviceType,
      booking_channel: data.bookingChannel,
      appointment_date: data.appointmentDate,
      time_slot: data.timeSlot,
      status: isPendingVerification ? 'pending' : 'confirmed',
      amount: tokenFee, // Strictly 10% token confirmation fee
      full_service_price: fullServicePrice,
      token_fee: tokenFee,
      balance_due: balanceDue,
      payment_status: isPendingVerification ? 'pending' : 'completed',
      payment_gateway: data.paymentGateway,
      payment_screenshot_url: data.paymentScreenshotUrl,
      home_service_address: data.homeAddress,
      token_number: tokenNumber,
      token_code: tokenCode,
      created_at: new Date().toISOString(),
    };

    // 4. Create live queue token tightly bound to salon and stylist
    const newToken: Token = {
      id: `tok-${Date.now()}`,
      salon_id: data.salonId,
      salon_name: salon.name,
      appointment_id: apptId,
      stylist_id: staff?.id,
      staff_name: staff?.full_name || 'Selected Stylist',
      token_number: tokenNumber,
      token_code: tokenCode,
      customer_name: data.customerName,
      service_name: service?.name || 'Custom Service',
      service_type: data.serviceType,
      queue_date: data.appointmentDate,
      status: 'waiting',
      is_verified: !isPendingVerification,
      estimated_wait_minutes: waitMinutes,
      created_at: new Date().toISOString(),
    };

    store.appointments.unshift(newAppointment);
    store.tokens.unshift(newToken);

    // Save to localStorage immediately for instant cross-tab visibility
    this.persistTenantDataLocally(data.salonId);

    try {
      localStorage.setItem('wbs_last_booking_event', JSON.stringify({
        action: 'created',
        salonId: data.salonId,
        apptId,
        tokenCode,
        timestamp: Date.now()
      }));
      window.dispatchEvent(new CustomEvent('wbs_appointment_created', {
        detail: { salonId: data.salonId, appointment: newAppointment, token: newToken }
      }));
    } catch {}

    // 5. Robust Supabase Live Database Sync
    if (supabase) {
      try {
        // Step A: Ensure customer exists in Supabase to get valid UUID
        let supabaseCustomerId: string | null = null;
        try {
          const { data: existingCust } = await supabase
            .from('customers')
            .select('id')
            .eq('salon_id', data.salonId)
            .eq('phone', data.customerPhone)
            .maybeSingle();

          if (existingCust?.id) {
            supabaseCustomerId = existingCust.id;
          } else {
            const { data: createdCust, error: custErr } = await supabase
              .from('customers')
              .insert({
                salon_id: data.salonId,
                name: data.customerName,
                phone: data.customerPhone,
                email: data.customerEmail || null
              })
              .select('id')
              .single();

            if (createdCust?.id) {
              supabaseCustomerId = createdCust.id;
            }
            if (custErr) {
              console.warn('Note on Supabase customer record insert:', custErr);
            }
          }
        } catch (cErr) {
          console.warn('Customer lookup/insert exception in Supabase:', cErr);
        }

        // Step B: Resolve valid service_id in Supabase
        let supabaseServiceId: string | null = null;
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.serviceId);
          if (isUuid) {
            const { data: matchedService } = await supabase
              .from('services')
              .select('id')
              .eq('id', data.serviceId)
              .maybeSingle();
            if (matchedService?.id) supabaseServiceId = matchedService.id;
          }

          if (!supabaseServiceId) {
            const { data: salonServices } = await supabase
              .from('services')
              .select('id')
              .eq('salon_id', data.salonId)
              .limit(1);
            if (salonServices && salonServices.length > 0) {
              supabaseServiceId = salonServices[0].id;
            } else {
              const { data: anyService } = await supabase.from('services').select('id').limit(1);
              if (anyService && anyService.length > 0) {
                supabaseServiceId = anyService[0].id;
              }
            }
          }
        } catch (sErr) {
          console.warn('Service resolution exception in Supabase:', sErr);
        }

        // Step C: Resolve staff_id if valid UUID
        let supabaseStaffId: string | null = null;
        if (staff?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(staff.id)) {
          try {
            const { data: matchedProfile } = await supabase.from('profiles').select('id').eq('id', staff.id).maybeSingle();
            if (matchedProfile?.id) supabaseStaffId = matchedProfile.id;
          } catch {}
        }

        // Step D: Write Appointment to Supabase
        if (supabaseCustomerId && supabaseServiceId) {
          const notesObj = {
            customer_name: data.customerName,
            customer_phone: data.customerPhone,
            customer_email: data.customerEmail,
            service_name: service?.name || 'Custom Service',
            staff_name: staff?.full_name || 'Selected Stylist',
            payment_screenshot_url: data.paymentScreenshotUrl,
            token_code: tokenCode,
            token_number: tokenNumber,
            full_service_price: fullServicePrice,
            token_fee: tokenFee,
            balance_due: balanceDue,
            allergy_notes: data.allergyNotes,
            home_address: data.homeAddress
          };

          const { data: insertedAppt, error: apptError } = await supabase
            .from('appointments')
            .insert({
              salon_id: data.salonId,
              customer_id: supabaseCustomerId,
              service_id: supabaseServiceId,
              staff_id: supabaseStaffId,
              service_type: data.serviceType,
              booking_channel: data.bookingChannel,
              appointment_date: data.appointmentDate,
              time_slot: data.timeSlot,
              status: isPendingVerification ? 'pending' : 'confirmed',
              amount: tokenFee,
              payment_status: isPendingVerification ? 'pending' : 'completed',
              payment_gateway: data.paymentGateway,
              transaction_ref: data.paymentScreenshotUrl || null,
              notes: JSON.stringify(notesObj)
            })
            .select()
            .single();

          if (apptError) {
            console.error('CRITICAL: Supabase appointments insert error:', apptError);
          } else if (insertedAppt) {
            console.log('LIVE: Booking request successfully written to Supabase:', insertedAppt.id);
            newAppointment.id = insertedAppt.id;
            newToken.appointment_id = insertedAppt.id;
            this.persistTenantDataLocally(data.salonId);
          }
        } else {
          console.warn('Supabase booking skipped: missing customerId or serviceId foreign key', {
            supabaseCustomerId,
            supabaseServiceId
          });
        }
      } catch (syncErr) {
        console.error('Supabase booking exception:', syncErr);
      }
    }

    this.notify();
    return { appointment: newAppointment, token: newToken };
  }

  // Update Customer Stylist Notes (Look, Style, Behavior, Allergy)
  public updateCustomerStylistNotes(
    customerId: string, 
    notes: { allergy?: string; hairPreference?: string; behavior?: string }
  ) {
    const store = this.getStore();
    const cust = store.customers.find(c => c.id === customerId);
    if (cust) {
      if (notes.allergy !== undefined) cust.allergy_notes = notes.allergy;
      if (notes.hairPreference !== undefined) cust.hair_preference_notes = notes.hairPreference;
      if (notes.behavior !== undefined) cust.behavior_notes = notes.behavior;
      this.notify();
    }
  }

  // Staff Portal: Advance Queue Token
  public advanceToken(tokenId: string, nextStatus: 'serving' | 'completed' | 'skipped') {
    const store = this.getStore();
    const tok = store.tokens.find(t => t.id === tokenId);
    if (tok) {
      tok.status = nextStatus;
      if (nextStatus === 'serving') tok.estimated_wait_minutes = 0;
      this.notify();
    }
  }
}

export const salonDataService = new SalonDataService();
