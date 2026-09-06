export type UserRole = 'super_admin' | 'salon_owner' | 'manager' | 'staff' | 'customer';

export type ServiceLocation = 'in_salon' | 'home_service';

export type BookingChannel = 'whatsapp' | 'web' | 'walk_in';

export type AppointmentStatus = 'pending' | 'confirmed' | 'serving' | 'completed' | 'cancelled' | 'no_show';

export type TokenStatus = 'waiting' | 'serving' | 'completed' | 'skipped';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentGateway = 'mock_razorpay' | 'razorpay' | 'cash' | 'upi';

export type SubscriptionPlanType = 'base_monthly' | 'half_yearly' | 'yearly';

export type SubscriptionStatusType = 'trial' | 'active' | 'past_due' | 'expired';

export interface Salon {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  logo_url?: string;
  currency: string;
  currency_symbol: string;
  subscription_plan: SubscriptionPlanType;
  billing_cycle: 'monthly' | '6_months' | '1_year';
  subscription_status: SubscriptionStatusType;
  subscription_expires_at?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  salon_id: string;
  role: UserRole;
  full_name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  specialties: string[];
  working_hours?: {
    start: string;
    end: string;
    days: string[];
  };
  rating: number;
  commission_rate: number;
  is_active: boolean;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  category: 'Hair' | 'Beard' | 'Combo' | 'Skin' | 'Spa';
  description: string;
  duration_minutes: number;
  in_salon_price: number;
  home_service_price: number;
  image_url?: string;
  is_active: boolean;
}

export interface Customer {
  id: string;
  salon_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  allergy_notes?: string;
  hair_preference_notes?: string;
  behavior_notes?: string;
  preferred_staff_id?: string;
  total_visits: number;
  total_spent: number;
  last_visited_at?: string;
  created_at: string;
}

export interface CustomerVisitRecord {
  appointmentId: string;
  salonId: string;
  salonName: string;
  serviceName: string;
  staffName?: string;
  appointmentDate: string;
  timeSlot: string;
  amount: number;
  status: AppointmentStatus;
  notes?: string;
  stylistNotes?: {
    hairPreference?: string;
    allergy?: string;
    behavior?: string;
  };
}

export interface Appointment {
  id: string;
  salon_id: string;
  salon_name?: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  staff_id?: string;
  staff_name?: string;
  service_id: string;
  service_name?: string;
  service_type: ServiceLocation;
  booking_channel: BookingChannel;
  appointment_date: string;
  time_slot: string;
  status: AppointmentStatus;
  amount: number;
  payment_status: PaymentStatus;
  payment_gateway: PaymentGateway;
  transaction_ref?: string;
  notes?: string;
  home_service_address?: string;
  token_number?: number;
  token_code?: string;
  created_at: string;
}

export interface Token {
  id: string;
  salon_id: string;
  appointment_id: string;
  token_number: number;
  token_code: string; // e.g. 'WBS-01'
  customer_name: string;
  service_name: string;
  staff_name?: string;
  service_type: ServiceLocation;
  queue_date: string;
  status: TokenStatus;
  estimated_wait_minutes: number;
  called_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  salon_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
  unit_cost: number;
  supplier_info?: string;
  last_restocked_at?: string;
}

export interface Invoice {
  id: string;
  salon_id: string;
  appointment_id?: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  invoice_number: string;
  service_name: string;
  service_type: ServiceLocation;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  salon_id: string;
  recipient_phone: string;
  recipient_name: string;
  notification_type: 'booking_confirmation' | 'call_next' | 'reminder' | 'waitlist_alert';
  message_content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  created_at: string;
}
