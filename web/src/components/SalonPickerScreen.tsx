import React from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  ArrowRight, 
  Crown, 
  LogOut, 
  Plus,
  Scissors
} from 'lucide-react';
import { Salon } from '../types';

interface SalonPickerScreenProps {
  ownerName: string;
  salons: Salon[];
  onSelectSalon: (salon: Salon) => void;
  onLogout: () => void;
}

export const SalonPickerScreen: React.FC<SalonPickerScreenProps> = ({
  ownerName,
  salons,
  onSelectSalon,
  onLogout
}) => {
  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-center items-center p-4 sm:p-8 select-none">
      
      {/* Top Bar with Logout */}
      <div className="max-w-3xl w-full flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg text-slate-950 font-bold">
            <Scissors className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <h2 className="text-base font-extrabold font-serif text-white flex items-center gap-1.5">
              WESTERN BOYS SALON <Crown className="w-4 h-4 text-amber-400 inline" />
            </h2>
            <p className="text-xs text-slate-400">Multi-Salon Owner Portal</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 text-xs font-semibold transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl w-full space-y-6">
        
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Welcome back, {ownerName}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-white">
            Select a Salon to Manage
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            You own {salons.length} salon locations. Choose which branch dashboard you want to access today.
          </p>
        </div>

        {/* Salon Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {salons.map((salon) => (
            <div
              key={salon.id}
              className="bg-slate-900/90 border-2 border-slate-800 hover:border-amber-500/60 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-amber-500/5 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {salon.city} Branch
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    {salon.subscription_status}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-serif text-white mt-4 group-hover:text-amber-400 transition">
                  {salon.name}
                </h3>

                <div className="space-y-1.5 mt-3 text-xs text-slate-400">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{salon.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono">
                    <Phone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>{salon.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Plan: <strong className="text-slate-200 capitalize font-mono">{salon.subscription_plan.replace('_', ' ')}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => onSelectSalon(salon)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Manage Salon</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
