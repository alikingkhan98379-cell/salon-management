import { salonDataService, REGISTERED_SALONS } from './salonDataService';
import { Salon, Profile, Service, Customer, Appointment, Token, InventoryItem, Invoice, NotificationLog } from '../types';

// Web Audio Chime generator for "Now Serving" alerts
export const playCallChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.25); // E5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.55); // G5

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.9);
  } catch (e) {
    console.warn('Audio chime could not play:', e);
  }
};

class StoreBridge {
  public subscribe(listener: () => void): () => void {
    return salonDataService.subscribe(listener);
  }

  public getActiveSalon(): Salon {
    return salonDataService.getActiveSalon();
  }

  public getAllSalons(): Salon[] {
    return salonDataService.getAllSalonsSync();
  }

  public setActiveSalon(salonId: string) {
    salonDataService.setActiveSalonId(salonId);
  }

  public getServices(activeOnly = true): Service[] {
    return salonDataService.getServices(activeOnly);
  }

  public getStaff(): Profile[] {
    return salonDataService.getStaff();
  }

  public getProfiles(): Profile[] {
    return salonDataService.getStaff();
  }

  public getAppointments(): Appointment[] {
    return salonDataService.getAppointments();
  }

  public getTokens(): Token[] {
    return salonDataService.getTokens();
  }

  public getCurrentlyServingToken(): Token | undefined {
    return salonDataService.getCurrentlyServingToken();
  }

  public getWaitingTokens(): Token[] {
    return salonDataService.getWaitingTokens();
  }

  public getInventory(): InventoryItem[] {
    return salonDataService.getInventory();
  }

  public getCustomers(): Customer[] {
    return salonDataService.getCustomers();
  }

  public getInvoices(): Invoice[] {
    return salonDataService.getInvoices();
  }

  public getNotifications(): NotificationLog[] {
    return [];
  }

  public callNextCustomer(): Token | null {
    playCallChime();
    return salonDataService.callNextCustomer();
  }

  public completeToken(tokenId: string) {
    salonDataService.completeToken(tokenId);
  }

  public skipToken(tokenId: string) {
    salonDataService.completeToken(tokenId);
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
    return salonDataService.addAppointmentAndToken(data);
  }

  public updateService(service: Service) {
    // update
    salonDataService.addService(service);
  }

  public addService(service: Omit<Service, 'id' | 'salon_id'>) {
    salonDataService.addService(service);
  }

  public toggleServiceActive(serviceId: string) {
    const s = salonDataService.getServices(false).find(item => item.id === serviceId);
    if (s) s.is_active = !s.is_active;
  }

  public restockInventory(id: string, qty: number) {
    salonDataService.restockInventory(id, qty);
  }

  public updateCustomerNotes(id: string, allergyNotes: string, hairNotes: string) {
    const c = salonDataService.getCustomers().find(cust => cust.id === id);
    if (c) {
      c.allergy_notes = allergyNotes;
      c.hair_preference_notes = hairNotes;
    }
  }

  public createInvoiceForAppointment(apptId: string) {
    return null;
  }

  public updateSalonSubscription(salonId: string, plan: Salon['subscription_plan'], cycle: Salon['billing_cycle']) {
    const s = REGISTERED_SALONS.find(item => item.id === salonId);
    if (s) {
      s.subscription_plan = plan;
      s.billing_cycle = cycle;
    }
  }

  public addNewSalon(name: string, city: string, phone: string) {
    const newSalon: Salon = {
      id: `salon-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      phone,
      email: `contact@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
      address: `Branch Address, ${city}`,
      city,
      state: 'Rajasthan',
      currency: 'INR',
      currency_symbol: '₹',
      subscription_plan: 'base_monthly',
      billing_cycle: 'monthly',
      subscription_status: 'trial',
      created_at: new Date().toISOString(),
    };
    REGISTERED_SALONS.push(newSalon);
    return newSalon;
  }
}

export const salonStore = new StoreBridge();
