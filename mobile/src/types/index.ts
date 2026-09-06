export type UserRole = 'super_admin' | 'salon_owner' | 'manager' | 'staff' | 'customer';
export type ServiceLocation = 'in_salon' | 'home_service';
export type BookingChannel = 'whatsapp' | 'web' | 'walk_in';
export type AppointmentStatus = 'pending' | 'confirmed' | 'serving' | 'completed' | 'cancelled' | 'no_show';
export type TokenStatus = 'waiting' | 'serving' | 'completed' | 'skipped';

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  category: string;
  duration_minutes: number;
  in_salon_price: number;
  home_service_price: number;
}

export interface Token {
  id: string;
  token_number: number;
  token_code: string;
  customer_name: string;
  service_name: string;
  staff_name?: string;
  status: TokenStatus;
  estimated_wait_minutes: number;
}

export interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  service_type: ServiceLocation;
  time_slot: string;
  status: AppointmentStatus;
  amount: number;
}
