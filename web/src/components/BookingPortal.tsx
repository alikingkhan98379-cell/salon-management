import React, { useState } from 'react';
import { 
  Scissors, 
  Car, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  MapPin,
  FileText
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';
import { Service, ServiceLocation } from '../types';
import { MockRazorpayModal } from './MockRazorpayModal';

interface BookingPortalProps {
  onNavigateToTrack: (tokenCode: string) => void;
}

export const BookingPortal: React.FC<BookingPortalProps> = ({ onNavigateToTrack }) => {
  const currentSalon = salonStore.getActiveSalon();
  const services = salonStore.getServices();
  const staffMembers = salonStore.getStaff();

  // Booking Flow State
  const [serviceType, setServiceType] = useState<ServiceLocation>('in_salon');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<Service | null>(services[0] || null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('12:00 PM');

  // Customer Inputs
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [homeAddress, setHomeAddress] = useState<string>('');
  const [allergyNotes, setAllergyNotes] = useState<string>('');

  // Payment & Confirmation State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);

  const categories = ['All', 'Hair', 'Beard', 'Combo', 'Skin', 'Spa'];

  const filteredServices = services.filter(s => {
    return selectedCategory === 'All' || s.category === selectedCategory;
  });

  const timeSlots = [
    '10:30 AM', '11:15 AM', '12:00 PM', '12:45 PM', 
    '02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM', 
    '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  const currentPrice = selectedService 
    ? (serviceType === 'home_service' ? selectedService.home_service_price : selectedService.in_salon_price)
    : 0;

  const handleStartBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !customerName || !customerPhone) return;
    if (serviceType === 'home_service' && !homeAddress) return;
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentDetails: {
    gateway: 'mock_razorpay' | 'cash' | 'upi';
    transactionId: string;
    status: 'completed';
  }) => {
    setShowPaymentModal(false);

    if (!selectedService) return;

    const result = salonStore.addAppointmentAndToken({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      service_id: selectedService.id,
      service_type: serviceType,
      staff_id: selectedStaffId || undefined,
      appointment_date: selectedDate,
      time_slot: selectedSlot,
      booking_channel: 'web',
      payment_status: paymentDetails.status,
      payment_gateway: paymentDetails.gateway,
      home_service_address: serviceType === 'home_service' ? homeAddress : undefined,
      allergy_notes: allergyNotes,
    });

    setConfirmedToken(result.token.token_code);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Booking Confirmed Success Card */}
      {confirmedToken ? (
        <div className="bg-gradient-to-b from-slate-900 via-[#131a2b] to-slate-900 border-2 border-amber-500/50 rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-6 animate-scaleUp">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Appointment Confirmed</span>
            <h2 className="text-3xl font-extrabold text-white font-serif">You&apos;re Booked at Western Boys Salon!</h2>
            <p className="text-sm text-slate-300">
              A WhatsApp confirmation message with token details has been dispatched to <strong>{customerPhone}</strong>.
            </p>
          </div>

          {/* Large Token Badge */}
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 max-w-sm mx-auto shadow-inner">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">Your Live Token</span>
            <span className="text-5xl font-black font-mono text-amber-400 block my-2">
              #{confirmedToken}
            </span>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Service: <strong className="text-white">{selectedService?.name}</strong></p>
              <p>Amount: <strong className="text-emerald-400">₹{currentPrice}</strong></p>
              <p>Estimated Wait: <strong className="text-amber-400">~20 minutes</strong></p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToTrack(confirmedToken)}
              className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2"
            >
              <span>Track Live Queue Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setConfirmedToken(null);
                setCustomerName('');
                setCustomerPhone('');
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl border border-slate-700 transition"
            >
              Book Another Service
            </button>
          </div>
        </div>
      ) : (
        /* Booking Flow */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Online Guest Reservation</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white mt-1">Book Your Grooming Session</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your preferred service, choose in-salon visit or doorstep service, and confirm your slot in under 2 minutes.
            </p>
          </div>

          <form onSubmit={handleStartBooking} className="space-y-8">
            
            {/* Step 1: In-Salon vs Home Service Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                1. Choose Service Location
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setServiceType('in_salon')}
                  className={`p-5 rounded-2xl border text-left transition flex items-start space-x-4 ${
                    serviceType === 'in_salon'
                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${
                    serviceType === 'in_salon' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'
                  }`}>
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">In-Salon Visit</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Experience luxury chairs, hot towel steam, and relaxed ambiance at our flagship salon.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Standard Pricing
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceType('home_service')}
                  className={`p-5 rounded-2xl border text-left transition flex items-start space-x-4 ${
                    serviceType === 'home_service'
                      ? 'bg-purple-500/15 border-purple-400 text-white shadow-lg shadow-purple-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${
                    serviceType === 'home_service' ? 'bg-purple-500 text-white font-bold' : 'bg-slate-700 text-slate-300'
                  }`}>
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">Doorstep Home Service 🚗</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Barber visits your home with sterilized tools, disposable capes & premium kit.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      Includes Travel & Sterilization
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Category Filter & Service Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Select Grooming Service
                </label>
                {/* Category Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        selectedCategory === cat
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredServices.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  const price = serviceType === 'home_service' ? service.home_service_price : service.in_salon_price;

                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {service.category}
                          </span>
                          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> {service.duration_minutes} mins
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-2">{service.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{service.description}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block font-sans">
                            {serviceType === 'home_service' ? 'Home Rate' : 'In-Salon Rate'}
                          </span>
                          <span className="text-lg font-extrabold font-mono text-amber-400">
                            ₹{price}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-amber-400 bg-amber-500 text-slate-950 font-bold' : 'border-slate-600'
                        }`}>
                          {isSelected && <span className="text-xs">✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Date & Slot Selection + Barber Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Date & Barber */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> 3. Preferred Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" /> 4. Select Barber / Stylist
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="">Any Available Specialist</option>
                    {staffMembers.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} — ★ {st.rating} ({st.specialties[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> 5. Available Time Slots
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-2 rounded-xl border text-xs font-mono transition text-center ${
                        selectedSlot === slot
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Step 4: Customer Details & Notes */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                6. Customer Contact Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">WhatsApp Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98290 12345"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Home Address if Home Service selected */}
              {serviceType === 'home_service' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Doorstep Address (for Home Visit) *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                    <textarea
                      required
                      rows={2}
                      placeholder="House/Flat number, Landmark, Area, Jaipur..."
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              )}

              {/* Allergy / Haircut Preference Notes */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Hair Style / Skin Allergy Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Sensitive to menthol spray; keep low fade with scissor work on top"
                    value={allergyNotes}
                    onChange={(e) => setAllergyNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

            </div>

            {/* Price Summary & Checkout Action */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400">Total Payable:</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black font-mono text-white">₹{currentPrice}</span>
                  <span className="text-xs text-slate-400">
                    ({serviceType === 'home_service' ? 'Doorstep Visit' : 'In-Salon Visit'})
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Proceed to Payment & Token</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>

          {/* Razorpay Modal Trigger */}
          {showPaymentModal && selectedService && (
            <MockRazorpayModal
              amount={currentPrice}
              serviceName={selectedService.name}
              customerName={customerName}
              customerPhone={customerPhone}
              onSuccess={handlePaymentSuccess}
              onClose={() => setShowPaymentModal(false)}
            />
          )}

        </div>
      )}

    </div>
  );
};
