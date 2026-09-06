import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  Scissors, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Trash2, 
  DollarSign, 
  Clock, 
  Search, 
  QrCode, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { salonDataService } from '../lib/salonDataService';
import { Salon, LocationSuggestion } from '../types';

interface RegisterSalonScreenProps {
  owner: {
    id: string;
    email: string;
    name: string;
    phone?: string;
  };
  onSalonRegistered: (newSalon: Salon) => void;
  onLogout?: () => void;
}

// Quick pre-configured top Indian hubs for instant fallback suggestions
const INDIAN_CITIES_PRESETS: LocationSuggestion[] = [
  {
    display_name: 'Vaishali Nagar, Jaipur, Rajasthan 302021',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302021',
    lat: 26.9048,
    lon: 75.7483
  },
  {
    display_name: 'Celebration Mall Complex, Bhuwana, Udaipur, Rajasthan 313001',
    city: 'Udaipur',
    state: 'Rajasthan',
    pincode: '313001',
    lat: 24.6186,
    lon: 73.7082
  },
  {
    display_name: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    lat: 12.9784,
    lon: 77.6408
  },
  {
    display_name: 'Connaught Place Inner Circle, New Delhi, Delhi 110001',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    lat: 28.6315,
    lon: 77.2167
  },
  {
    display_name: 'Bandra West, Linking Road, Mumbai, Maharashtra 400050',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    lat: 19.0596,
    lon: 72.8295
  },
  {
    display_name: 'Koregaon Park North Main Road, Pune, Maharashtra 411001',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    lat: 18.5362,
    lon: 73.8940
  },
  {
    display_name: 'Banjara Hills Road No. 12, Hyderabad, Telangana 500034',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    lat: 17.4156,
    lon: 78.4350
  }
];

export const RegisterSalonScreen: React.FC<RegisterSalonScreenProps> = ({
  owner,
  onSalonRegistered,
  onLogout
}) => {
  // 1. Basic Details
  const [salonName, setSalonName] = useState('');
  const [salonPhone, setSalonPhone] = useState(owner.phone || '+91 ');
  const [salonEmail, setSalonEmail] = useState(owner.email || '');
  const [upiId, setUpiId] = useState('');

  // 2. Structured Location & Autocomplete
  const [addressSearch, setAddressSearch] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [stateName, setStateName] = useState('Rajasthan');
  const [pincode, setPincode] = useState('302021');
  const [latitude, setLatitude] = useState<number>(26.9124);
  const [longitude, setLongitude] = useState<number>(75.7873);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // 3. Initial Services Config
  const [services, setServices] = useState<Array<{
    name: string;
    category: 'Hair' | 'Beard' | 'Combo' | 'Skin' | 'Spa';
    duration_minutes: number;
    in_salon_price: number;
    home_service_price: number;
  }>>([
    {
      name: 'Signature Haircut & Wash',
      category: 'Hair',
      duration_minutes: 30,
      in_salon_price: 250,
      home_service_price: 450
    },
    {
      name: 'Royal Hot Towel Beard Sculpt',
      category: 'Beard',
      duration_minutes: 20,
      in_salon_price: 180,
      home_service_price: 320
    },
    {
      name: 'Gentlemen Grooming Combo (Hair + Beard)',
      category: 'Combo',
      duration_minutes: 50,
      in_salon_price: 380,
      home_service_price: 650
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Debounced Indian Location Autocomplete
  useEffect(() => {
    if (!addressSearch || addressSearch.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        // First check preset matches
        const localMatches = INDIAN_CITIES_PRESETS.filter(p =>
          p.display_name.toLowerCase().includes(addressSearch.toLowerCase()) ||
          p.city.toLowerCase().includes(addressSearch.toLowerCase())
        );

        // Try OpenStreetMap Nominatim API for full India locations
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(addressSearch)}&addressdetails=1&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );

        if (res.ok) {
          const data = await res.json();
          const apiSuggestions: LocationSuggestion[] = data.map((item: any) => {
            const addr = item.address || {};
            const itemCity = addr.city || addr.town || addr.municipality || addr.state_district || 'City';
            const itemState = addr.state || 'State';
            const itemPin = addr.postcode || '';
            return {
              display_name: item.display_name,
              city: itemCity,
              state: itemState,
              pincode: itemPin,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon)
            };
          });

          const merged = [...apiSuggestions, ...localMatches].filter(
            (item, index, self) => index === self.findIndex(t => t.display_name === item.display_name)
          );

          setLocationSuggestions(merged.length > 0 ? merged : localMatches);
        } else {
          setLocationSuggestions(localMatches);
        }
      } catch {
        // Fallback to presets
        const fallback = INDIAN_CITIES_PRESETS.filter(p =>
          p.display_name.toLowerCase().includes(addressSearch.toLowerCase()) ||
          p.city.toLowerCase().includes(addressSearch.toLowerCase())
        );
        setLocationSuggestions(fallback);
      } finally {
        setIsSearchingLocation(false);
        setShowLocationDropdown(true);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [addressSearch]);

  const handleSelectLocation = (loc: LocationSuggestion) => {
    setAddressSearch(loc.display_name);
    setAddressLine(loc.display_name.split(',')[0] || loc.display_name);
    setCity(loc.city);
    setStateName(loc.state);
    if (loc.pincode) setPincode(loc.pincode);
    setLatitude(loc.lat);
    setLongitude(loc.lon);
    setShowLocationDropdown(false);
  };

  // Service list management
  const handleUpdateService = (index: number, field: string, value: any) => {
    setServices(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddService = () => {
    setServices(prev => [
      ...prev,
      {
        name: 'New Salon Service',
        category: 'Hair',
        duration_minutes: 30,
        in_salon_price: 200,
        home_service_price: 350
      }
    ]);
  };

  const handleRemoveService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!salonName.trim()) {
      setErrorMsg('Please enter your Salon Name.');
      return;
    }
    if (!city.trim() || !addressLine.trim()) {
      setErrorMsg('Please enter your Salon Address and City.');
      return;
    }
    if (!salonPhone.trim()) {
      setErrorMsg('Please enter a Contact Phone number for the salon.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newSalon = await salonDataService.registerSalon({
        name: salonName.trim(),
        phone: salonPhone.trim(),
        email: salonEmail.trim(),
        address: addressLine.trim() || addressSearch.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        latitude,
        longitude,
        upi_id: upiId.trim() || undefined,
        ownerId: owner.id,
        ownerName: owner.name,
        ownerEmail: owner.email,
        initialServices: services
      });

      // Log admin audit
      await salonDataService.logAdminAction(
        owner.email,
        'SALON_REGISTERED_TRIAL',
        newSalon.id,
        {
          name: newSalon.name,
          city: newSalon.city,
          trial_ends_at: newSalon.trial_ends_at
        }
      );

      onSalonRegistered(newSalon);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMsg(err.message || 'Failed to register salon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#141d33] to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 7-Day Free Trial Included
              </span>
              <span className="text-slate-400 text-xs">• No credit card required</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-white flex items-center gap-2.5">
              Register Your Salon
              <Building2 className="w-6 h-6 text-amber-400 inline" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Launch your salon on the Western Boys SaaS platform. Get your custom booking page, live queue tokens, and dual pricing across India.
            </p>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-rose-400 underline self-start sm:self-center"
            >
              Sign Out ({owner.email})
            </button>
          )}
        </div>

        {/* 7-Day Free Trial Perks Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Instant Access to Full Owner Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Live Tokens &amp; Customer Marketplace Listing</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>₹499/month after trial (Cancel Anytime)</span>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-400 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SECTION 1: Salon Identity & Contact */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">1. Salon Details &amp; Direct UPI</h3>
              <p className="text-xs text-slate-400">Your brand name and customer payment destination</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Salon Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Crown Barbershop"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Salon Phone (WhatsApp Support) *
              </label>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={salonPhone}
                onChange={(e) => setSalonPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Salon Email
              </label>
              <input
                type="email"
                placeholder="contact@mysalon.com"
                value={salonEmail}
                onChange={(e) => setSalonEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Salon UPI ID (For Direct Customer Payments)</span>
                <span className="text-[10px] text-amber-400">QR / Screenshot Verification</span>
              </label>
              <div className="relative">
                <QrCode className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. salonname@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Customers will send booking payments directly to this UPI ID and upload screenshots.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: India-Wide Structured Location with Autocomplete */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">2. India Location &amp; Coordinates</h3>
              <p className="text-xs text-slate-400">
                Type address to search and auto-populate City, State, Pincode, and GPS coordinates
              </p>
            </div>
          </div>

          {/* Autocomplete Search Bar */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Search Location Across India (Autocomplete)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Type neighborhood, mall, road, or city (e.g. Vaishali Nagar, Jaipur, Indiranagar)..."
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                onFocus={() => {
                  if (locationSuggestions.length > 0) setShowLocationDropdown(true);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
              {isSearchingLocation && (
                <div className="absolute right-3.5 top-3 text-[10px] text-amber-400 font-mono animate-pulse">
                  Searching...
                </div>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {showLocationDropdown && locationSuggestions.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800">
                {locationSuggestions.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full text-left p-3 hover:bg-slate-900 transition flex items-start gap-2.5 text-xs group"
                  >
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-white group-hover:text-amber-300">
                        {loc.display_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {loc.city}, {loc.state} • PIN: {loc.pincode || 'N/A'} • Lat: {loc.lat.toFixed(4)}, Lng: {loc.lon.toFixed(4)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Structured Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Address Line / Shop No. &amp; Landmark *
              </label>
              <input
                type="text"
                required
                placeholder="Shop 14, Royal Heritage Arcade"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="Jaipur"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">State *</label>
              <input
                type="text"
                required
                placeholder="Rajasthan"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Pincode</label>
              <input
                type="text"
                placeholder="302021"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Latitude (GPS)</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Longitude (GPS)</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono"
              />
            </div>

            <div className="flex items-end">
              <span className="text-[10px] text-emerald-400 pb-2">
                ✓ Used for customer distance &amp; radius sorting
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Initial Services & Dual Pricing Setup */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-serif">3. Services &amp; Dual Pricing</h3>
                <p className="text-xs text-slate-400">Configure prices for In-Salon vs Home Doorstep visits</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddService}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service</span>
            </button>
          </div>

          <div className="space-y-3">
            {services.map((srv, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-5">
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Service Name</label>
                  <input
                    type="text"
                    required
                    value={srv.name}
                    onChange={(e) => handleUpdateService(idx, 'name', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Duration</label>
                  <input
                    type="number"
                    min={5}
                    value={srv.duration_minutes}
                    onChange={(e) => handleUpdateService(idx, 'duration_minutes', parseInt(e.target.value) || 30)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-amber-400 uppercase font-semibold mb-0.5">In-Salon (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={srv.in_salon_price}
                    onChange={(e) => handleUpdateService(idx, 'in_salon_price', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-purple-400 uppercase font-semibold mb-0.5">Doorstep (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={srv.home_service_price}
                    onChange={(e) => handleUpdateService(idx, 'home_service_price', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-purple-300 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-1 text-right sm:text-center pt-2 sm:pt-0">
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveService(idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                      title="Delete Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: 7-Day Free Trial & Future Subscription Terms */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">SaaS Subscription Terms (Automatic 7-Day Trial)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            By clicking <strong>&quot;Start 7-Day Free Trial &amp; Register Salon&quot;</strong>, your salon will be instantly visible in the public directory and marketplace with live queue tokens enabled. After 7 days, your subscription will be ₹499/month (or ₹2,545 for 6 months, ₹4,790 for 12 months with discounts). You can cancel or pause anytime from your settings.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span>Registering &amp; Starting Free Trial...</span>
          ) : (
            <>
              <span>Start 7-Day Free Trial &amp; Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

      </form>

    </div>
  );
};
export default RegisterSalonScreen;
