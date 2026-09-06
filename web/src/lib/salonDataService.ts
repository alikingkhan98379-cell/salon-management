import { supabase } from './supabaseClient';
import { Salon, Profile, Service, Customer, Appointment, Token, InventoryItem, Invoice, NotificationLog } from '../types';

// Tenant-isolated in-memory cache for live state and fallback
interface TenantStore {
  services: Service[];
  appointments: Appointment[];
  tokens: Token[];
  inventory: InventoryItem[];
  customers: Customer[];
  invoices: Invoice[];
  staff: Profile[];
}

// Master list of all registered salons on platform
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

// Seed templates for testing isolation
const JAIPUR_SERVICES: Service[] = [
  {
    id: 's-jpr-1',
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
    id: 's-jpr-2',
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
    id: 's-jpr-3',
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

const UDAIPUR_SERVICES: Service[] = [
  {
    id: 's-udr-1',
    salon_id: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    name: 'Lake City Royal Haircut & Spa',
    category: 'Hair',
    description: 'Udaipur premium haircut with almond oil conditioning.',
    duration_minutes: 35,
    in_salon_price: 300,
    home_service_price: 500,
    is_active: true,
  },
  {
    id: 's-udr-2',
    salon_id: 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    name: 'Maharaja Sandalwood Beard Detailing',
    category: 'Beard',
    description: 'Traditional razor shave with pure sandalwood balm.',
    duration_minutes: 30,
    in_salon_price: 220,
    home_service_price: 380,
    is_active: true,
  }
];

class SalonDataService {
  private tenantData: Map<string, TenantStore> = new Map();
  private listeners: Set<() => void> = new Set();
  private activeSalonId: string = REGISTERED_SALONS[0].id;

  constructor() {
    this.initTenantStores();
  }

  private initTenantStores() {
    // Tenant A (Jaipur)
    this.tenantData.set(REGISTERED_SALONS[0].id, {
      services: JAIPUR_SERVICES,
      appointments: [
        {
          id: 'appt-jpr-1',
          salon_id: REGISTERED_SALONS[0].id,
          customer_id: 'cust-1',
          customer_name: 'Rahul Sharma',
          customer_phone: '+91 98290 12345',
          staff_id: '33333333-3333-3333-3333-333333333333',
          staff_name: 'Farhan Akhtar',
          service_id: 's-jpr-3',
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
          customer_id: 'cust-2',
          customer_name: 'Aditya Rathore',
          customer_phone: '+91 98290 67890',
          staff_id: '44444444-4444-4444-4444-444444444444',
          staff_name: 'Vikram Singh',
          service_id: 's-jpr-1',
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
          customer_name: 'Aditya Rathore',
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
          quantity: 3, // LOW STOCK
          unit: 'packs',
          low_stock_threshold: 5,
          unit_cost: 120,
        }
      ],
      customers: [
        {
          id: 'cust-1',
          salon_id: REGISTERED_SALONS[0].id,
          name: 'Rahul Sharma',
          phone: '+91 98290 12345',
          email: 'rahul@gmail.com',
          allergy_notes: 'Allergic to menthol',
          hair_preference_notes: 'Low taper fade, matte finish',
          total_visits: 5,
          total_spent: 1900,
          created_at: '2026-01-10T10:00:00Z',
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
          specialties: ['Hair Coloring', 'Scissor Work'],
          rating: 4.8,
          commission_rate: 20,
          is_active: true,
        }
      ]
    });

    // Tenant B (Udaipur) - Completely different isolated data
    this.tenantData.set(REGISTERED_SALONS[1].id, {
      services: UDAIPUR_SERVICES,
      appointments: [
        {
          id: 'appt-udr-1',
          salon_id: REGISTERED_SALONS[1].id,
          customer_id: 'cust-udr-1',
          customer_name: 'Shyam Sundar',
          customer_phone: '+91 98290 99911',
          staff_id: '77777777-7777-7777-7777-777777777777',
          staff_name: 'Devendra Rajput',
          service_id: 's-udr-1',
          service_name: 'Lake City Royal Haircut & Spa',
          service_type: 'in_salon',
          booking_channel: 'walk_in',
          appointment_date: new Date().toISOString().split('T')[0],
          time_slot: '02:00 PM',
          status: 'serving',
          amount: 300,
          payment_status: 'completed',
          payment_gateway: 'cash',
          token_number: 1,
          token_code: 'UDR-01',
          created_at: new Date().toISOString(),
        }
      ],
      tokens: [
        {
          id: 'tok-udr-1',
          salon_id: REGISTERED_SALONS[1].id,
          appointment_id: 'appt-udr-1',
          token_number: 1,
          token_code: 'UDR-01',
          customer_name: 'Shyam Sundar',
          service_name: 'Lake City Royal Haircut & Spa',
          staff_name: 'Devendra Rajput',
          service_type: 'in_salon',
          queue_date: new Date().toISOString().split('T')[0],
          status: 'serving',
          estimated_wait_minutes: 0,
          created_at: new Date().toISOString(),
        }
      ],
      inventory: [
        {
          id: 'inv-udr-1',
          salon_id: REGISTERED_SALONS[1].id,
          item_name: 'Sandalwood Shaving Cream',
          category: 'Beard',
          quantity: 8,
          unit: 'tubs',
          low_stock_threshold: 3,
          unit_cost: 250,
        }
      ],
      customers: [
        {
          id: 'cust-udr-1',
          salon_id: REGISTERED_SALONS[1].id,
          name: 'Shyam Sundar',
          phone: '+91 98290 99911',
          total_visits: 1,
          total_spent: 300,
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
          specialties: ['Royal Shave', 'Beard Trim'],
          rating: 4.9,
          commission_rate: 20,
          is_active: true,
        }
      ]
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public setActiveSalonId(salonId: string) {
    this.activeSalonId = salonId;
    this.notify();
  }

  public getActiveSalon(): Salon {
    return REGISTERED_SALONS.find(s => s.id === this.activeSalonId) || REGISTERED_SALONS[0];
  }

  public getSalonsByIds(salonIds: string[]): Salon[] {
    return REGISTERED_SALONS.filter(s => salonIds.includes(s.id));
  }

  public getAllSalons(): Salon[] {
    return REGISTERED_SALONS;
  }

  private getStore(): TenantStore {
    let store = this.tenantData.get(this.activeSalonId);
    if (!store) {
      store = {
        services: [],
        appointments: [],
        tokens: [],
        inventory: [],
        customers: [],
        invoices: [],
        staff: []
      };
      this.tenantData.set(this.activeSalonId, store);
    }
    return store;
  }

  // Scoped Data Queries
  public getServices(activeOnly = true): Service[] {
    const services = this.getStore().services;
    return activeOnly ? services.filter(s => s.is_active) : services;
  }

  public getStaff(): Profile[] {
    return this.getStore().staff;
  }

  public getAppointments(): Appointment[] {
    return this.getStore().appointments;
  }

  public getTokens(): Token[] {
    return this.getStore().tokens;
  }

  public getCurrentlyServingToken(): Token | undefined {
    return this.getTokens().find(t => t.status === 'serving');
  }

  public getWaitingTokens(): Token[] {
    return this.getTokens().filter(t => t.status === 'waiting').sort((a, b) => a.token_number - b.token_number);
  }

  public getInventory(): InventoryItem[] {
    return this.getStore().inventory;
  }

  public getCustomers(): Customer[] {
    return this.getStore().customers;
  }

  public getInvoices(): Invoice[] {
    return this.getStore().invoices;
  }

  // Mutations (Scoped strictly to active salon)
  public callNextCustomer(): Token | null {
    const store = this.getStore();
    const current = store.tokens.find(t => t.status === 'serving');
    if (current) {
      current.status = 'completed';
      const appt = store.appointments.find(a => a.id === current.appointment_id);
      if (appt) appt.status = 'completed';
    }

    const next = store.tokens.find(t => t.status === 'waiting');
    if (next) {
      next.status = 'serving';
      next.estimated_wait_minutes = 0;
      const appt = store.appointments.find(a => a.id === next.appointment_id);
      if (appt) appt.status = 'serving';
    }

    this.notify();
    return next || null;
  }

  public completeToken(tokenId: string) {
    const store = this.getStore();
    const token = store.tokens.find(t => t.id === tokenId);
    if (token) {
      token.status = 'completed';
      const appt = store.appointments.find(a => a.id === token.appointment_id);
      if (appt) appt.status = 'completed';
      this.notify();
    }
  }

  public addAppointmentAndToken(data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    service_id: string;
    service_type: 'in_salon' | 'home_service';
    staff_id?: string;
    appointment_date: string;
    time_slot: string;
    booking_channel: 'whatsapp' | 'web' | 'walk_in';
    payment_status: 'completed' | 'pending';
    payment_gateway: 'mock_razorpay' | 'razorpay' | 'cash' | 'upi';
    home_service_address?: string;
    allergy_notes?: string;
    hair_preference_notes?: string;
  }) {
    const store = this.getStore();
    const service = store.services.find(s => s.id === data.service_id);
    const amount = service 
      ? (data.service_type === 'home_service' ? service.home_service_price : service.in_salon_price)
      : 250;
    const staff = store.staff.find(p => p.id === data.staff_id);

    const prefix = this.getActiveSalon().city === 'Udaipur' ? 'UDR' : 'WBS';
    const nextNum = store.tokens.length + 1;
    const tokenCode = `${prefix}-${String(nextNum).padStart(2, '0')}`;

    const apptId = `appt-${Date.now()}`;
    const newAppt: Appointment = {
      id: apptId,
      salon_id: this.activeSalonId,
      customer_id: `cust-${Date.now()}`,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      staff_id: data.staff_id,
      staff_name: staff?.full_name || 'Available Stylist',
      service_id: data.service_id,
      service_name: service?.name || 'Grooming Service',
      service_type: data.service_type,
      booking_channel: data.booking_channel,
      appointment_date: data.appointment_date,
      time_slot: data.time_slot,
      status: 'confirmed',
      amount,
      payment_status: data.payment_status,
      payment_gateway: data.payment_gateway,
      token_number: nextNum,
      token_code: tokenCode,
      created_at: new Date().toISOString(),
    };
    store.appointments.unshift(newAppt);

    const newToken: Token = {
      id: `tok-${Date.now()}`,
      salon_id: this.activeSalonId,
      appointment_id: apptId,
      token_number: nextNum,
      token_code: tokenCode,
      customer_name: data.customer_name,
      service_name: service?.name || 'Grooming Service',
      staff_name: staff?.full_name || 'Available Stylist',
      service_type: data.service_type,
      queue_date: data.appointment_date,
      status: 'waiting',
      estimated_wait_minutes: 20,
      created_at: new Date().toISOString(),
    };
    store.tokens.push(newToken);

    this.notify();
    return { appointment: newAppt, token: newToken };
  }

  public addService(service: Omit<Service, 'id' | 'salon_id'>) {
    const store = this.getStore();
    store.services.push({
      ...service,
      id: `s-${Date.now()}`,
      salon_id: this.activeSalonId,
    });
    this.notify();
  }

  public restockInventory(id: string, qty: number) {
    const item = this.getStore().inventory.find(i => i.id === id);
    if (item) {
      item.quantity += qty;
      this.notify();
    }
  }
}

export const salonDataService = new SalonDataService();
