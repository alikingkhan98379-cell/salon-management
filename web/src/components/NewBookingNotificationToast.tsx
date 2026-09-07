import React, { useEffect } from 'react';
import { Bell, ArrowRight, X, Sparkles, Volume2, ShieldAlert } from 'lucide-react';
import { playNewBookingChime } from '../lib/soundUtils';

export interface BookingAlertData {
  id: string;
  salonId: string;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  tokenCode: string;
  tokenFee: number;
  balanceDue: number;
  timeSlot?: string;
  appointmentDate?: string;
  receivedAt: number;
}

interface NewBookingNotificationToastProps {
  notification: BookingAlertData | null;
  onReview: (appointmentId: string) => void;
  onDismiss: () => void;
}

export const NewBookingNotificationToast: React.FC<NewBookingNotificationToastProps> = ({
  notification,
  onReview,
  onDismiss,
}) => {
  useEffect(() => {
    if (notification) {
      // Auto-dismiss after 20 seconds if unattended
      const timer = setTimeout(() => {
        onDismiss();
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-amber-500/20 text-white backdrop-blur-xl">
        
        {/* Header with pulsing alert indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div className="flex items-center space-x-1.5">
              <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="font-bold text-sm tracking-wide text-amber-300 uppercase">
                New Booking Alert
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => playNewBookingChime()}
              className="p-1 text-slate-400 hover:text-amber-400 transition rounded-lg"
              title="Replay Alert Chime"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-white transition rounded-lg"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-base text-white flex items-center gap-1.5">
                {notification.customerName}
                {notification.customerPhone && (
                  <span className="text-xs font-normal text-slate-400">
                    ({notification.customerPhone})
                  </span>
                )}
              </h4>
              <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                {notification.serviceName}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold whitespace-nowrap shadow-sm">
              {notification.tokenCode}
            </span>
          </div>

          {/* Pricing & Advance Details */}
          <div className="flex items-center justify-between text-xs bg-slate-950/70 rounded-xl px-3 py-2 border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                10% Token Fee Paid
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                ₹{notification.tokenFee}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                Balance at Salon
              </span>
              <span className="text-amber-300 font-bold text-sm">
                ₹{notification.balanceDue}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex items-center space-x-2">
          <button
            onClick={() => onReview(notification.id)}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/25 active:scale-[0.99]"
          >
            <span>Review &amp; Verify Screenshot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
