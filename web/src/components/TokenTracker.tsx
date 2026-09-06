import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Car, 
  Scissors,
  ArrowRight
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';

interface TokenTrackerProps {
  initialTokenCode?: string;
  onBookAnother: () => void;
}

export const TokenTracker: React.FC<TokenTrackerProps> = ({ initialTokenCode, onBookAnother }) => {
  const [tokenInput, setTokenInput] = useState(initialTokenCode || 'WBS-02');
  const [searchCode, setSearchCode] = useState(initialTokenCode || 'WBS-02');

  const currentSalon = salonStore.getActiveSalon();
  const allTokens = salonStore.getTokens();
  const currentlyServing = salonStore.getCurrentlyServingToken();
  const waitingTokens = salonStore.getWaitingTokens();

  // Find token
  const matchedToken = allTokens.find(
    t => t.token_code.toLowerCase() === searchCode.trim().toLowerCase()
  );

  // Position calculation
  const positionInQueue = matchedToken && matchedToken.status === 'waiting'
    ? waitingTokens.findIndex(t => t.id === matchedToken.id) + 1
    : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchCode(tokenInput.trim());
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Search Bar Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Live Customer Queue Tracker</span>
        <h2 className="text-2xl font-bold font-serif text-white mt-1">Check Your Token Status</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter your token number (e.g. WBS-01, WBS-02) or phone to see live progress and estimated chair time.
        </p>

        <form onSubmit={handleSearch} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="e.g. WBS-02"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm text-white font-mono uppercase tracking-wider focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20"
          >
            Track Status
          </button>
        </form>
      </div>

      {/* Result Card */}
      {matchedToken ? (
        <div className="bg-gradient-to-b from-slate-900 via-[#121828] to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex flex-col items-center justify-center font-mono font-black shadow-lg">
                <span className="text-[10px] tracking-widest uppercase text-slate-900">TOKEN</span>
                <span className="text-2xl font-black">#{matchedToken.token_code}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{matchedToken.customer_name}</h3>
                <p className="text-xs text-amber-400 font-medium">{matchedToken.service_name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {matchedToken.service_type === 'home_service' ? (
                    <span className="bg-purple-500/20 text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 border border-purple-500/30">
                      <Car className="w-3 h-3" /> Doorstep Home Visit
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/30">
                      <Scissors className="w-3 h-3" /> In-Salon Visit
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Barber: <strong className="text-slate-200">{matchedToken.staff_name || 'Expert Stylist'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Status Pill */}
            <div className="sm:text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                matchedToken.status === 'serving'
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : matchedToken.status === 'waiting'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : matchedToken.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {matchedToken.status === 'serving' ? '● Serving Right Now!' : matchedToken.status}
              </span>
            </div>
          </div>

          {/* Stepper Visualization */}
          <div className="py-2">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              
              {/* Step 1: Booked */}
              <div className="space-y-1">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center mx-auto text-xs">
                  ✓
                </div>
                <span className="text-[10px] font-semibold text-slate-300 block">Token Issued</span>
              </div>

              {/* Step 2: In Queue */}
              <div className="space-y-1">
                <div className={`w-7 h-7 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                  matchedToken.status === 'waiting' || matchedToken.status === 'serving' || matchedToken.status === 'completed'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  2
                </div>
                <span className="text-[10px] font-semibold text-slate-300 block">In Queue</span>
              </div>

              {/* Step 3: Now in Chair */}
              <div className="space-y-1">
                <div className={`w-7 h-7 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                  matchedToken.status === 'serving'
                    ? 'bg-amber-500 text-slate-950 animate-bounce'
                    : matchedToken.status === 'completed'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  3
                </div>
                <span className="text-[10px] font-semibold text-slate-300 block">In Chair</span>
              </div>

              {/* Step 4: Finished */}
              <div className="space-y-1">
                <div className={`w-7 h-7 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                  matchedToken.status === 'completed'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  4
                </div>
                <span className="text-[10px] font-semibold text-slate-300 block">Finished</span>
              </div>

            </div>
          </div>

          {/* Queue Estimation Highlight Box */}
          {matchedToken.status === 'waiting' && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Estimated Wait Time</span>
                  <span className="text-xl font-mono font-black text-white">
                    ~{matchedToken.estimated_wait_minutes} Minutes
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Your Position in Line</span>
                <span className="text-lg font-bold text-amber-400">
                  #{positionInQueue} (ahead: {Math.max(0, positionInQueue - 1)})
                </span>
              </div>
            </div>
          )}

          {matchedToken.status === 'serving' && (
            <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-5 text-center space-y-2 animate-pulse">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">YOUR TURN HAS ARRIVED!</span>
              <p className="text-base font-bold text-white">
                Please proceed to Chair #1 for your service with {matchedToken.staff_name}.
              </p>
            </div>
          )}

          {matchedToken.status === 'completed' && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-5 text-center text-emerald-300 text-xs">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
              <p className="font-bold text-sm text-white">Service Completed!</p>
              <p className="mt-0.5">Thank you for visiting Western Boys Salon. See you again soon!</p>
            </div>
          )}

          {/* Current Salon Info */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{currentSalon.address}, {currentSalon.city}</span>
            </div>
            <div>
              <span className="font-mono">{currentSalon.phone}</span>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400">
          <p className="font-bold text-white text-base">Token &quot;{searchCode}&quot; Not Found</p>
          <p className="text-xs mt-1">Please ensure you entered the exact token code like WBS-01 or WBS-02.</p>
          <button
            onClick={onBookAnother}
            className="mt-4 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 inline-flex items-center gap-1.5"
          >
            <span>Book New Appointment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
