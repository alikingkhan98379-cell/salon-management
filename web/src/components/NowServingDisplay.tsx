import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Crown, 
  Clock, 
  Volume2, 
  Maximize, 
  Minimize, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { salonStore, playCallChime } from '../lib/mockStore';

interface NowServingDisplayProps {
  onBack: () => void;
}

export const NowServingDisplay: React.FC<NowServingDisplayProps> = ({ onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  const currentSalon = salonStore.getActiveSalon();
  const currentlyServing = salonStore.getCurrentlyServingToken();
  const waitingTokens = salonStore.getWaitingTokens();

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060911] text-white flex flex-col p-6 sm:p-10 select-none overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/30">
            <Scissors className="w-8 h-8 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-wide text-white">
                WESTERN BOYS SALON
              </h1>
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-xs sm:text-sm text-amber-400/90 font-medium tracking-wider uppercase">
              {currentSalon.address}, {currentSalon.city}
            </p>
          </div>
        </div>

        {/* Live Clock & Fullscreen Toggle */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-2.5 font-mono text-xl font-bold text-amber-400 shadow-inner">
            <Clock className="w-5 h-5 text-slate-400" />
            <span>{currentTime}</span>
          </div>

          <button
            onClick={playCallChime}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-2xl border border-slate-800 transition"
            title="Test Chime Sound"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-2xl border border-slate-800 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Exit Display</span>
          </button>
        </div>

      </div>

      {/* Centerpiece: Massive "NOW SERVING" Display Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-center">
        
        {/* Massive Current Token Hero (7 Cols) */}
        <div className="lg:col-span-7 h-full flex flex-col justify-center">
          <div className="relative bg-gradient-to-b from-slate-900/90 via-[#101726]/90 to-slate-900/90 border-2 border-amber-500/40 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden text-center flex flex-col items-center justify-center min-h-[380px]">
            
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none"></div>

            <div className="flex items-center space-x-2 bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full border border-amber-500/40 uppercase tracking-widest text-xs sm:text-sm font-bold mb-4 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span>NOW SERVING</span>
            </div>

            {currentlyServing ? (
              <>
                <div className="my-2">
                  <span className="text-7xl sm:text-9xl font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 drop-shadow-[0_10px_20px_rgba(229,169,60,0.3)]">
                    {currentlyServing.token_code}
                  </span>
                </div>

                <div className="space-y-1 mt-2">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-serif tracking-wide">
                    {currentlyServing.customer_name}
                  </h2>
                  <p className="text-lg sm:text-xl text-amber-300/90 font-medium">
                    {currentlyServing.service_name}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800/80 w-full flex items-center justify-center space-x-6 text-sm sm:text-base text-slate-300">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block">Assigned Chair</span>
                    <strong className="text-amber-400 font-mono">Chair #1</strong>
                  </div>
                  <span className="text-slate-700 text-2xl">|</span>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block">Master Barber</span>
                    <strong className="text-white">{currentlyServing.staff_name || 'Senior Stylist'}</strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12">
                <p className="text-4xl sm:text-5xl font-mono font-bold text-slate-600">--</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-400 mt-4">Welcome to Western Boys Salon</h2>
                <p className="text-sm text-slate-500 mt-2">Next customer will be called shortly</p>
              </div>
            )}

          </div>
        </div>

        {/* Up Next in Line Cards (5 Cols) */}
        <div className="lg:col-span-5 h-full flex flex-col justify-center space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> UPCOMING QUEUE
            </span>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 font-bold">
              {waitingTokens.length} Waiting
            </span>
          </div>

          <div className="space-y-3">
            {waitingTokens.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                <p className="font-semibold text-sm">No customers currently waiting</p>
                <p className="text-xs mt-1">Walk-ins and WhatsApp bookings welcome!</p>
              </div>
            ) : (
              waitingTokens.slice(0, 4).map((tok, idx) => (
                <div
                  key={tok.id}
                  className={`border rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all ${
                    idx === 0
                      ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-lg ${
                      idx === 0 
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-800 text-amber-400 border border-slate-700'
                    }`}>
                      #{tok.token_code}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-white">{tok.customer_name}</span>
                        {idx === 0 && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Next Up
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{tok.service_name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-amber-400 block">
                      ~{tok.estimated_wait_minutes} min
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Wait</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Bottom Ticker Bar */}
      <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-3">
          <span className="text-amber-400 font-semibold">★ Notice:</span>
          <span>Book appointments anytime via WhatsApp: <strong>+91 98765 43210</strong> or scan QR at front desk</span>
        </div>
        <div>
          <span>Live Reception Display • Western Boys Salon Cloud SaaS</span>
        </div>
      </div>

    </div>
  );
};
