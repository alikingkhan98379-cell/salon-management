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
  CustomerVisitRecord
} from '../types';

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
    currency: 'INR',
    currency_symbol: '₹',
    subscription_plan: 'base_monthly',
    billing_cycle: 'monthly',
    subscription_status: 'active',
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
    currency: 'INR',
    currency_symbol: '₹',
    subscription_plan: 'yearly',
    billing_cycle: '1_year',
    subscription_status: 'active',
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
    id: 's1111111-1111-1111-1111-111111111111',
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
    id: 's2222222-2222-2222-2222-222222222222',
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
    id: 's3333333-3333-3333-3333-333333333333',
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
    id: 'u1111111-1111-1111-1111-111111111111',
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
    id: 'u2222222-2222-2222-2222-222222222222',
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
  }

  private async checkSupabaseConnection() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('salons').select('*').limit(5);
      if (!error && data && data.length > 0) {
        this.isConnectedToSupabase = true;
        this.allSalonsCache = data;
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

  // Load Salons for User according to role
  public async fetchUserSalons(user: { id: string; role: UserRole; ownedSalonIds?: string[]; assignedSalonId?: string }): Promise<Salon[]> {
    if (supabase) {
      try {
        if (user.role === 'super_admin') {
          const { data } = await supabase.from('salons').select('*');
          if (data && data.length > 0) {
            this.allSalonsCache = data;
            return data;
          }
        } else if (user.role === 'salon_owner') {
          const { data } = await supabase
            .from('salon_owners')
            .select('salon_id, salons(*)')
            .eq('user_id', user.id);
          if (data && data.length > 0) {
            const mapped = data.map((item: any) => item.salons).filter(Boolean);
            if (mapped.length > 0) return mapped;
          }
        } else if (user.role === 'manager' || user.role === 'staff') {
          const { data } = await supabase
            .from('profiles')
            .select('salon_id, salons(*)')
            .eq('auth_user_id', user.id)
            .single();
          if (data && data.salons) {
            return [data.salons as unknown as Salon];
          }
        }
      } catch (err) {
        console.warn('Supabase fetchUserSalons fallback:', err);
      }
    }

    // Role-based local resolution fallback
    if (user.role === 'super_admin') {
      return [...this.allSalonsCache];
    } else if (user.role === 'salon_owner') {
      if (user.ownedSalonIds && user.ownedSalonIds.length > 0) {
        return this.getSalonsByIds(user.ownedSalonIds);
      }
      return [this.allSalonsCache[0]];
    } else if (user.assignedSalonId) {
      return this.getSalonsByIds([user.assignedSalonId]);
    }
    return [this.allSalonsCache[0]];
  }

  // Marketplace: Get all active salons for customers
  public async getAllSalons(): Promise<Salon[]> {
    if (supabase) {
      try {
        const { data } = await supabase.from('salons').select('*').eq('subscription_status', 'active');
        if (data && data.length > 0) {
          this.allSalonsCache = data;
          return data;
        }
      } catch {}
    }
    return this.allSalonsCache;
  }

  public getSalonsByIds(ids: string[]): Salon[] {
    return this.allSalonsCache.filter(s => ids.includes(s.id));
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
  }): Promise<{ appointment: Appointment; token: Token }> {
    const store = this.getStore(data.salonId);
    const salon = this.allSalonsCache.find(s => s.id === data.salonId) || this.getActiveSalon();
    const service = store.services.find(s => s.id === data.serviceId);
    const staff = store.staff.find(st => st.id === data.staffId);

    const price = service 
      ? (data.serviceType === 'home_service' ? service.home_service_price : service.in_salon_price)
      : 250;

    // 1. Find or create customer
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
        total_spent: price,
        created_at: new Date().toISOString(),
      };
      store.customers.push(customer);
    } else {
      customer.total_visits += 1;
      customer.total_spent += price;
      if (data.allergyNotes) customer.allergy_notes = data.allergyNotes;
      if (data.customerEmail && !customer.email) customer.email = data.customerEmail;
    }

    // 2. Generate token code & number
    const tokenNumber = store.tokens.length + 1;
    const prefix = salon.slug.includes('grooming') ? 'WGL' : 'WBS';
    const tokenCode = `${prefix}-${String(tokenNumber).padStart(2, '0')}`;
    const waitMinutes = (tokenNumber - 1) * 20;

    // 3. Create appointment
    const apptId = `appt-${Date.now()}`;
    const newAppointment: Appointment = {
      id: apptId,
      salon_id: data.salonId,
      salon_name: salon.name,
      customer_id: customer.id,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      staff_id: staff?.id,
      staff_name: staff?.full_name || 'First Available Stylist',
      service_id: data.serviceId,
      service_name: service?.name || 'Custom Service',
      service_type: data.serviceType,
      booking_channel: data.bookingChannel,
      appointment_date: data.appointmentDate,
      time_slot: data.timeSlot,
      status: 'confirmed',
      amount: price,
      payment_status: 'completed',
      payment_gateway: data.paymentGateway,
      home_service_address: data.homeAddress,
      token_number: tokenNumber,
      token_code: tokenCode,
      created_at: new Date().toISOString(),
    };

    // 4. Create live queue token
    const newToken: Token = {
      id: `tok-${Date.now()}`,
      salon_id: data.salonId,
      appointment_id: apptId,
      token_number: tokenNumber,
      token_code: tokenCode,
      customer_name: data.customerName,
      service_name: service?.name || 'Custom Service',
      staff_name: staff?.full_name || 'First Available Stylist',
      service_type: data.serviceType,
      queue_date: data.appointmentDate,
      status: 'waiting',
      estimated_wait_minutes: waitMinutes,
      created_at: new Date().toISOString(),
    };

    store.appointments.push(newAppointment);
    store.tokens.push(newToken);

    // Try live Supabase sync
    if (supabase) {
      Promise.resolve(
        supabase.from('appointments').insert({
          salon_id: data.salonId,
          customer_id: customer.id,
          staff_id: staff?.id,
          service_id: data.serviceId,
          service_type: data.serviceType,
          booking_channel: data.bookingChannel,
          appointment_date: data.appointmentDate,
          time_slot: data.timeSlot,
          status: 'confirmed',
          amount: price,
          payment_status: 'completed',
          payment_gateway: data.paymentGateway,
          home_service_address: data.homeAddress
        })
      ).catch((err: any) => console.warn('Supabase appt insert fallback:', err));
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
