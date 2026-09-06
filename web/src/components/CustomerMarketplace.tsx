import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  MapPin, 
  Search, 
  Star, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Car, 
  DollarSign, 
  ChevronRight, 
  Crown,
  History,
  Building2,
  AlertCircle,
  FileText,
  LogOut
} from 'lucide-react';
import { salonDataService, REGISTERED_SALONS } from '../lib/salonDataService';
import { Salon, Service, Profile, CustomerVisitRecord, ServiceLocation } from '../types';
import { MockRazorpayModal } from './MockRazorpayModal';

interface CustomerMarketplaceProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  onNavigateToTrack: (tokenCode: string) => void;
  onLogout: () => void;
}

export const CustomerMarketplace: React.FC<CustomerMarketplaceProps> = ({
  customer,
  onNavigateToTrack,
  onLogout
}) => {
  const [salons, setSalons] = useState<Salon[]>(REGISTERED_SALONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'history'>('marketplace');

  // Selected Salon Modal / Detail
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);

  // Booking Flow State within chosen Salon
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceLocation, setServiceLocation] = useState<ServiceLocation>('in_salon');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('12:00 PM');
  
  // Compulsory Phone & Details
  const [bookingPhone, setBookingPhone] = useState<string>(customer.phone || '');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [homeAddress, setHomeAddress] = useState<string>('');
  
  // Payment & Live Token Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [confirmedToken, setConfirmedToken] = useState<{ tokenCode: string; waitMinutes: number; salonName: string } | null>(null);

  // Customer Cross-Salon History
  const [visitHistory, setVisitHistory] = useState<CustomerVisitRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    salonDataService.getAllSalons().then(res => setSalons(res));
  }, []);

  // Fetch visit history whenever customer or tab changes
  useEffect(() => {
    if (customer.phone || customer.email) {
      setIsLoadingHistory(true);
      salonDataService.fetchCustomerHistory(customer.phone || bookingPhone, customer.email)
        .then(history => {
          setVisitHistory(history);
          setIsLoadingHistory(false);
        })
        .catch(() => setIsLoadingHistory(false));
    }
  }, [customer.phone, customer.email, bookingPhone, activeTab]);

  const cities = ['All', 'Jaipur', 'Udaipur'];

  const filteredSalons = salons.filter(s => {
    const matchesCity = selectedCity === 'All' || s.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesQuery = !searchQuery || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesQuery;
  });

  const timeSlots = [
    '10:30 AM', '11:15 AM', '12:00 PM', '12:45 PM', 
    '02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM', 
    '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  // Salon-specific items
  const salonServices = selectedSalon ? salonDataService.getServices(selectedSalon.id) : [];
  const salonStaff = selectedSalon ? salonDataService.getStaff(selectedSalon.id) : [];

  const handleOpenSalon = (salon: Salon) => {
    setSelectedSalon(salon);
    const services = salonDataService.getServices(salon.id);
    setSelectedService(services[0] || null);
    setSelectedStaffId('');
  };

  const handleStartBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPhone) {
      alert('Phone number is compulsory for all bookings and visit history tracking.');
      return;
    }
    if (!selectedService) return;
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (paymentDetails: {
    gateway: 'mock_razorpay' | 'cash' | 'upi';
    transactionId: string;
    status: 'completed';
  }) => {
    setIsPaymentModalOpen(false);
    if (!selectedSalon || !selectedService) return;

    const { appointment, token } = await salonDataService.bookAppointmentAndToken({
      salonId: selectedSalon.id,
      serviceId: selectedService.id,
      staffId: selectedStaffId || undefined,
      customerName: customer.name,
      customerPhone: bookingPhone,
      customerEmail: customer.email,
      serviceType: serviceLocation,
      bookingChannel: 'web',
      appointmentDate: selectedDate,
      timeSlot: selectedSlot,
      homeAddress: serviceLocation === 'home_service' ? homeAddress : undefined,
      allergyNotes: customerNotes,
      paymentGateway: paymentDetails.gateway
    });

    setConfirmedToken({
      tokenCode: token.token_code,
      waitMinutes: token.estimated_wait_minutes,
      salonName: selectedSalon.name
    });

    // Refresh history
    salonDataService.fetchCustomerHistory(bookingPhone, customer.email).then(setVisitHistory);
  };

  const currentPrice = selectedService
    ? (serviceLocation === 'home_service' ? selectedService.home_service_price : selectedService.in_salon_price)
    : 0;

  // Aggregate styling profile from visits
  const latestStylistNotes = visitHistory.find(v => v.stylistNotes?.hairPreference || v.stylistNotes?.allergy || v.stylistNotes?.behavior)?.stylistNotes;

  return (
    <div className="space-y-6">

      {/* Top Customer Marketplace Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Customer Marketplace
            </span>
            <span className="text-slate-500 text-xs">• Verified via Email OTP</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-white flex items-center gap-2">
            Explore &amp; Book Salons
            <Crown className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse verified salons in Rajasthan, compare stylist ratings &amp; dual pricing, and track your cross-salon hair history.
          </p>
        </div>

        {/* Customer Identifier Card */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-xs">
            <div className="font-bold text-white flex items-center gap-1">
              {customer.name}
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-slate-400 font-mono text-[11px]">{customer.phone || bookingPhone || 'Phone compulsory for booking'}</div>
            <div className="text-slate-500 text-[10px]">{customer.email}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Sign Out"
            className="ml-2 p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs: Marketplace vs Visit History */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('marketplace');
            setSelectedSalon(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'marketplace'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Browse Salons ({filteredSalons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>My Hair Profile &amp; Visit History ({visitHistory.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MARKETPLACE BROWSER                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'marketplace' && !selectedSalon && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search salons by name, area (Vaishali Nagar, Mall, etc.)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {cities.map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedCity === city
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Salons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSalons.map(salon => {
              const services = salonDataService.getServices(salon.id);
              const staff = salonDataService.getStaff(salon.id);
              const minPrice = services.length > 0 
                ? Math.min(...services.map(s => s.in_salon_price)) 
                : 250;

              return (
                <div 
                  key={salon.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase border border-amber-500/20">
                            {salon.city}
                          </span>
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" /> 4.9 (120+ reviews)
                          </span>
                        </div>
                        <h3 className="text-lg font-bold font-serif text-white group-hover:text-amber-400 transition-colors">
                          {salon.name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {salon.address}
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Scissors className="w-6 h-6 text-amber-400 -rotate-45" />
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-center my-4">
                      <div className="bg-slate-950/50 p-2 rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase">Stylists</div>
                        <div className="text-xs font-bold text-white mt-0.5">{staff.length} Barbers</div>
                      </div>
                      <div className="bg-slate-950/50 p-2 rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase">Services</div>
                        <div className="text-xs font-bold text-white mt-0.5">{services.length} Options</div>
                      </div>
                      <div className="bg-slate-950/50 p-2 rounded-xl">
                        <div className="text-[10px] text-slate-500 uppercase">Starts From</div>
                        <div className="text-xs font-bold text-amber-400 mt-0.5">₹{minPrice}</div>
                      </div>
                    </div>

                    {/* Available Stylists preview */}
                    <div className="mb-4">
                      <span className="text-[11px] font-medium text-slate-400 block mb-2">Featured Stylists on Duty:</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {staff.slice(0, 3).map(st => (
                          <span 
                            key={st.id} 
                            className="bg-slate-800 border border-slate-700/60 rounded-xl px-2.5 py-1 text-[11px] text-slate-300 flex items-center gap-1.5"
                          >
                            <User className="w-3 h-3 text-amber-400" />
                            {st.full_name} ({st.specialties[0] || 'Stylist'})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenSalon(salon)}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md shadow-amber-500/10 transition-all"
                    >
                      <span>Explore Services &amp; Book</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1 (INNER): SPECIFIC SALON VIEW & BOOKING MODAL                         */}
      {/* ========================================================================= */}
      {activeTab === 'marketplace' && selectedSalon && (
        <div className="space-y-6">
          {/* Back button & Salon Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative">
            <button
              type="button"
              onClick={() => setSelectedSalon(null)}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 mb-3"
            >
              ← Back to All Salons
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase">
                  {selectedSalon.city} Branch
                </span>
                <h2 className="text-2xl font-bold font-serif text-white mt-1">
                  {selectedSalon.name}
                </h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedSalon.address} • Contact: {selectedSalon.phone}
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Queue Waiting</span>
                <span className="text-lg font-bold text-amber-400">
                  {salonDataService.getTokens(selectedSalon.id).filter(t => t.status === 'waiting').length} in line
                </span>
              </div>
            </div>
          </div>

          {/* Dual Column: Services Menu on Left, Booking Form on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 cols: Services Menu & Stylists */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Service Location Toggle */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Service Location:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceLocation('in_salon')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      serviceLocation === 'in_salon'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" /> In-Salon
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceLocation('home_service')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      serviceLocation === 'home_service'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" /> Home Service
                  </button>
                </div>
              </div>

              {/* Services List */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  Select Service ({salonServices.length} available)
                </h3>

                <div className="space-y-2">
                  {salonServices.map(srv => {
                    const isSelected = selectedService?.id === srv.id;
                    const price = serviceLocation === 'home_service' ? srv.home_service_price : srv.in_salon_price;

                    return (
                      <div
                        key={srv.id}
                        onClick={() => setSelectedService(srv)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">{srv.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {srv.duration_minutes} mins
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-md">{srv.description}</p>
                        </div>

                        <div className="text-right shrink-0 ml-4">
                          <div className="text-sm font-bold text-amber-400 font-mono">₹{price}</div>
                          <div className="text-[10px] text-slate-500">
                            {serviceLocation === 'home_service' ? 'Home Visit' : 'In Salon'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stylists Available */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  Choose Stylist (Optional)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedStaffId('')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedStaffId === ''
                        ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">First Available Stylist</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Fastest token assignment</div>
                  </button>

                  {salonStaff.map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStaffId(st.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedStaffId === st.id
                          ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{st.full_name}</span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                          ★ {st.rating}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {st.specialties.join(', ')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right 5 cols: Booking Details & Checkout */}
            <div className="lg:col-span-5">
              <form onSubmit={handleStartBooking} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 sticky top-6 shadow-xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Checkout &amp; Live Token</span>
                  <h3 className="text-lg font-bold text-white mt-0.5 font-serif">Complete Reservation</h3>
                </div>

                {/* Date & Slot */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Time Slot</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Compulsory Phone Number */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-300">
                      Mobile Phone <span className="text-rose-400">* Compulsory Identifier</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98290 11223"
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-amber-500/30 rounded-xl pl-8 pr-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Used to recognize your haircut history across all salons &amp; send WhatsApp token alerts.
                  </span>
                </div>

                {/* Home Address if Home Service */}
                {serviceLocation === 'home_service' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Home Address <span className="text-rose-400">* Required for Barber Dispatch</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Enter flat/apartment, street, landmark..."
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                )}

                {/* Hair / Allergy Notes */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Styling or Skin Allergy Notes (Saved to your profile)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Skin fade, sensitive neck, no strong aftershave"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* Price Breakdown */}
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Service:</span>
                    <span className="text-white font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Type:</span>
                    <span className="capitalize">{serviceLocation.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-amber-400 pt-1.5 border-t border-slate-800">
                    <span>Total Payable:</span>
                    <span>₹{currentPrice}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!selectedService || !bookingPhone}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  <span>Pay &amp; Get Live Token</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY HAIR PROFILE & CROSS-SALON VISIT HISTORY                         */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          
          {/* Profile Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Cross-Platform Identity</span>
                <h2 className="text-xl font-bold font-serif text-white mt-0.5">
                  Hair Profile &amp; Permanent Stylist Records
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Your hair profile is recognized at any salon on the Western Boys network via your verified email &amp; phone number.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 uppercase block">Total Visits</span>
                  <span className="text-base font-bold text-white">{visitHistory.length}</span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 uppercase block">Total Spent</span>
                  <span className="text-base font-bold text-amber-400 font-mono">
                    ₹{visitHistory.reduce((acc, curr) => acc + (curr.amount || 0), 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stylist Notes Card (Hair, Allergy, Behavior) */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs mb-1">
                  <Scissors className="w-3.5 h-3.5" /> Hair &amp; Beard Preference
                </div>
                <p className="text-xs text-slate-300">
                  {latestStylistNotes?.hairPreference || 'No specific hair preferences recorded yet. Barbers update this after your visit.'}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs mb-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Skin &amp; Allergy Notes
                </div>
                <p className="text-xs text-slate-300">
                  {latestStylistNotes?.allergy || 'No known allergies reported.'}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs mb-1">
                  <User className="w-3.5 h-3.5" /> Stylist Behavioral Notes
                </div>
                <p className="text-xs text-slate-300">
                  {latestStylistNotes?.behavior || 'Always courteous & punctual client.'}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline of Visits Across All Salons */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 font-serif">
              <History className="w-4 h-4 text-amber-400" />
              Visit Timeline Across Platform ({visitHistory.length} Recorded Visits)
            </h3>

            {isLoadingHistory ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading visit history...</div>
            ) : visitHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <p>No past appointments found for {bookingPhone || customer.email}.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('marketplace')}
                  className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl"
                >
                  Book Your First Haircut
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {visitHistory.map((rec, idx) => (
                  <div
                    key={rec.appointmentId || idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rec.serviceName}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          {rec.salonName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          rec.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {rec.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" /> {rec.appointmentDate} at {rec.timeSlot}
                        </span>
                        {rec.staffName && (
                          <span className="flex items-center gap-1">
                            <Scissors className="w-3 h-3 text-amber-400" /> Barber: {rec.staffName}
                          </span>
                        )}
                      </div>

                      {rec.notes && (
                        <p className="text-[11px] text-slate-400 italic">"{rec.notes}"</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-amber-400 font-mono">₹{rec.amount}</span>
                      <span className="text-[10px] text-slate-500 block">Verified &amp; Paid</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Payment Gateway Modal (Mock Razorpay) */}
      {isPaymentModalOpen && selectedService && selectedSalon && (
        <MockRazorpayModal
          amount={currentPrice}
          serviceName={`${selectedSalon.name} - ${selectedService.name}`}
          customerName={customer.name}
          customerPhone={bookingPhone}
          onSuccess={handlePaymentSuccess}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Confirmed Token Dialog */}
      {confirmedToken && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Booking Confirmed!</span>
              <h3 className="text-xl font-bold font-serif text-white mt-1">Live Queue Token Issued</h3>
              <p className="text-xs text-slate-400 mt-1">{confirmedToken.salonName}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-500 uppercase font-semibold">Your Token Number</div>
              <div className="text-4xl font-extrabold text-amber-400 font-mono tracking-wider my-1">
                {confirmedToken.tokenCode}
              </div>
              <div className="text-xs text-slate-400">
                Estimated Wait: <strong className="text-white">{confirmedToken.waitMinutes} mins</strong>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const code = confirmedToken.tokenCode;
                  setConfirmedToken(null);
                  onNavigateToTrack(code);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <span>Track Live Queue Status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setConfirmedToken(null)}
                className="w-full py-2 text-xs text-slate-400 hover:text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default CustomerMarketplace;
