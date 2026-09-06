import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Car, 
  Scissors,
  ArrowRight,
  Sparkles,
  Phone,
  Building2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { salonDataService } from '../lib/salonDataService';
import { Token, Salon, Appointment } from '../types';

interface TokenTrackerProps {
  initialTokenCode?: string;
  onBookAnother: () => void;
}

export const TokenTracker: React.FC<TokenTrackerProps> = ({ initialTokenCode, onBookAnother }) => {
  const [searchInput, setSearchInput] = useState<string>(initialTokenCode || 'WBS-01');
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>(initialTokenCode || 'WBS-01');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<{
    token: Token;
    salon: Salon;
    positionInQueue: number;
    currentlyServing?: Token;
    appointment?: Appointment;
    queueAheadCount: number;
  } | null>(null);

  // Quick active tokens list
  const [activeTokensList, setActiveTokensList] = useState<{ token: Token; salon: Salon }[]>([]);

  // Update when initialTokenCode changes
  useEffect(() => {
    if (initialTokenCode) {
      setSearchInput(initialTokenCode);
      setActiveSearchTerm(initialTokenCode);
    }
  }, [initialTokenCode]);

  // Search execution
  const executeSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResult(null);
      return;
    }
    setIsSearching(true);
    try {
      const result = await salonDataService.findTokenGlobal(term);
      setSearchResult(result);
    } catch (e) {
      console.error('Error finding token:', e);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    executeSearch(activeSearchTerm);
    setActiveTokensList(salonDataService.getAllActiveTokens());

    // Listen to queue changes in real-time
    const unsubscribe = salonDataService.subscribe(() => {
      executeSearch(activeSearchTerm);
      setActiveTokensList(salonDataService.getAllActiveTokens());
    });
    return () => {
      unsubscribe();
    };
  }, [activeSearchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchTerm(searchInput.trim());
  };

  const handleQuickSelect = (tokenCode: string) => {
    setSearchInput(tokenCode);
    setActiveSearchTerm(tokenCode);
  };

  const token = searchResult?.token;
  const salon = searchResult?.salon;
  const position = searchResult?.positionInQueue ?? 0;
  const queueAhead = searchResult?.queueAheadCount ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Search Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Live Customer Queue Tracker
          </span>
          <button
            type="button"
            onClick={() => executeSearch(activeSearchTerm)}
            className="text-slate-400 hover:text-amber-400 text-xs flex items-center gap-1 font-mono transition-colors"
            title="Refresh Live Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Live Sync</span>
          </button>
        </div>

        <h2 className="text-2xl font-bold font-serif text-white mt-1">Check Your Token Status</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter your <strong>Token Code</strong> (e.g. <code>WBS-01</code>, <code>WBS-02</code>, <code>WGL-01</code>) or your <strong>Mobile Phone Number</strong> to track live progress and estimated chair time.
        </p>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              placeholder="e.g. WBS-01 or 9829011223"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-3 py-3 text-sm text-amber-300 font-mono tracking-wider focus:outline-none focus:border-amber-400 transition-colors placeholder:text-slate-600 uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchInput.trim()}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-2xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isSearching ? 'Tracking...' : 'Track Token'}
          </button>
        </form>

        {/* Quick Click Tokens Pills */}
        {activeTokensList.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Quick Select Active Tokens:</span>
            <div className="flex flex-wrap gap-1.5">
              {activeTokensList.map(({ token: t, salon: s }) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleQuickSelect(t.token_code)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    activeSearchTerm.toLowerCase() === t.token_code.toLowerCase()
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-white'
                  }`}
                >
                  <span>#{t.token_code}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({s.city})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Card */}
      {token && salon ? (
        <div className="bg-gradient-to-b from-slate-900 via-[#121828] to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
          
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex flex-col items-center justify-center font-mono font-black shadow-lg shrink-0">
                <span className="text-[9px] tracking-widest uppercase text-slate-900 font-bold">TOKEN</span>
                <span className="text-xl font-black">#{token.token_code}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{token.customer_name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                    {salon.name}
                  </span>
                </div>
                <p className="text-xs text-amber-300 font-medium mt-0.5">{token.service_name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {token.service_type === 'home_service' ? (
                    <span className="bg-purple-500/20 text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-500/30">
                      <Car className="w-3 h-3" /> Doorstep Home Visit
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
                      <Scissors className="w-3 h-3" /> In-Salon Visit
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Barber: <strong className="text-slate-200">{token.staff_name || 'Expert Stylist'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Status Pill */}
            <div className="sm:text-right shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                token.is_verified === false
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : token.status === 'serving'
                  ? 'bg-amber-500 text-slate-950 animate-pulse font-extrabold shadow-lg shadow-amber-500/30'
                  : token.status === 'waiting'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : token.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {token.is_verified === false ? '⏳ Verification Pending' : token.status === 'serving' ? '● Now Serving in Chair!' : token.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Payment Verification Pending Notice */}
          {token.is_verified === false && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-left">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                  Payment Verification In Progress
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Your UPI payment screenshot was submitted and is awaiting confirmation by {salon.name}.
                  Once verified, your token position will be activated in the live queue.
                </p>
                {searchResult?.appointment?.payment_screenshot_url && (
                  <a
                    href={searchResult.appointment.payment_screenshot_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[11px] text-amber-400 underline mt-1.5 font-medium"
                  >
                    View Uploaded Receipt Screenshot ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Stepper Progress Bar */}
          <div className="py-2">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              
              {/* Step 1: Booked */}
              <div className="space-y-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center mx-auto text-xs shadow-md shadow-emerald-500/20">
                  ✓
                </div>
                <span className="text-[10px] font-semibold text-slate-300 block">Token Issued</span>
              </div>

              {/* Step 2: In Queue */}
              <div className="space-y-1">
                <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                  token.status === 'waiting' || token.status === 'serving' || token.status === 'completed'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  2
                </div>
                <span className="text-[10px] font-semibold text-slate-300 block">In Line</span>
              </div>

              {/* Step 3: In Chair */}
              <div className="space-y-1">
                <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                  token.status === 'serving'
                    ? 'bg-amber-500 text-slate-950 animate-bounce shadow-lg shadow-amber-500/40'
                    : token.status === 'completed'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  3
                </div>
                <span className="text-[10px] font-semibold text-slate-300 block">In Chair</span>
              </div>

              {/* Step 4: Finished */}
              <div className="space-y-1">
                <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                  token.status === 'completed'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  4
                </div>
                <span className="text-[10px] font-semibold text-slate-300 block">Completed</span>
              </div>

            </div>
          </div>

          {/* Queue Estimation Box (If Waiting) */}
          {token.status === 'waiting' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Estimated Wait Time</span>
                  <span className="text-2xl font-mono font-black text-white">
                    ~{token.estimated_wait_minutes} Minutes
                  </span>
                </div>
              </div>

              <div className="text-center sm:text-right bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl">
                <span className="text-[11px] text-slate-400 block uppercase font-medium">Your Position</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  #{position > 0 ? position : 1}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  ({queueAhead} clients ahead of you)
                </span>
              </div>
            </div>
          )}

          {/* Now Serving Alert */}
          {token.status === 'serving' && (
            <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 border border-amber-500/50 rounded-2xl p-5 text-center space-y-2 animate-pulse">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">YOUR TURN HAS ARRIVED!</span>
              <p className="text-base font-bold text-white">
                Please proceed to Chair #1 for your service with {token.staff_name || 'your barber'}.
              </p>
            </div>
          )}

          {/* Completed Message */}
          {token.status === 'completed' && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-5 text-center text-emerald-300 text-xs">
              <CheckCircle2 className="w-7 h-7 mx-auto mb-1 text-emerald-400" />
              <p className="font-bold text-base text-white">Service Completed!</p>
              <p className="mt-1">Thank you for grooming at {salon.name}. We look forward to your next visit!</p>
            </div>
          )}

          {/* Salon Contact & Location */}
          <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{salon.address}, {salon.city}</span>
            </div>
            <div className="flex items-center space-x-2 font-mono text-slate-300">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{salon.phone}</span>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
            <AlertCircle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Token &quot;{activeSearchTerm}&quot; Not Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Please check your token code (e.g. <code>WBS-01</code>, <code>WBS-02</code>, <code>WGL-01</code>) or try searching with your 10-digit mobile number.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onBookAnother}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg inline-flex items-center gap-1.5"
            >
              <span>Book an Appointment / Get Token</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
export default TokenTracker;
