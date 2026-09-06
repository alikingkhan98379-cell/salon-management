import React from 'react';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

interface InactivityModalProps {
  secondsRemaining: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export const InactivityModal: React.FC<InactivityModalProps> = ({
  secondsRemaining,
  onStayLoggedIn,
  onLogout,
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative text-center">
        
        {/* Animated Warning Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg relative">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold font-serif text-white">
            Session Inactivity Warning
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            For security, operational sessions are automatically closed after 30 minutes of inactivity.
          </p>
        </div>

        {/* Big Countdown Timer */}
        <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-inner">
          <div className="text-xs uppercase tracking-widest font-bold text-amber-400 mb-1 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Auto-Logout In
          </div>
          <div className="text-5xl font-mono font-black text-white tracking-wider">
            00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Click below to keep your session active and continue working.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition order-2 sm:order-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Now</span>
          </button>

          <button
            type="button"
            onClick={onStayLoggedIn}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition order-1 sm:order-2 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Stay Logged In</span>
          </button>
        </div>

      </div>
    </div>
  );
};
