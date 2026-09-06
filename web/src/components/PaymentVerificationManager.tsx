import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Eye, 
  User, 
  Phone, 
  Scissors, 
  Calendar, 
  ShieldCheck, 
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { salonDataService } from '../lib/salonDataService';
import { Appointment } from '../types';

interface PaymentVerificationManagerProps {
  salonId?: string;
  salonName?: string;
}

export const PaymentVerificationManager: React.FC<PaymentVerificationManagerProps> = ({
  salonId,
  salonName
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadPending = () => {
    const list = salonDataService.getPendingVerifications(salonId);
    setAppointments(list);
  };

  useEffect(() => {
    loadPending();
    const unsub = salonDataService.subscribe(loadPending);
    return () => unsub();
  }, [salonId]);

  const handleConfirm = async (appointmentId: string) => {
    setIsProcessing(true);
    try {
      await salonDataService.verifyPayment(appointmentId);
      loadPending();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionTargetId) return;
    setIsProcessing(true);
    try {
      await salonDataService.rejectPayment(rejectionTargetId, rejectionReason || 'Payment verification failed');
      setRejectionTargetId(null);
      setRejectionReason('');
      loadPending();
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = appointments.filter(a =>
    !searchQuery ||
    a.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.customer_phone?.includes(searchQuery) ||
    a.token_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn font-sans">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <QrCode className="w-3 h-3" /> Manual UPI Verification
            </span>
            <span className="text-slate-400 text-xs">• Pending Owner/Manager Approval</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-white flex items-center gap-2">
            Payment Screenshot Verifications
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
              {appointments.length} Pending
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review customer UPI screenshots, verify the payment amount, and activate official tokens for the queue.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPending}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter by customer name, mobile number, or token..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
        />
      </div>

      {/* List of Pending Appointments */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">All Payments Verified!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no customer bookings waiting for payment verification. New UPI payment submissions will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((appt) => (
            <div
              key={appt.id}
              className="bg-slate-900 border-2 border-amber-500/30 hover:border-amber-400 rounded-3xl p-6 shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Customer & Service Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-mono font-black flex items-center justify-center text-sm shrink-0 shadow-md">
                  #{appt.token_code || 'TKN'}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">{appt.customer_name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                      ₹{appt.amount}
                    </span>
                    <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 font-semibold">
                      Payment Pending
                    </span>
                  </div>

                  <div className="text-xs text-amber-300 font-medium">
                    {appt.service_name}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" /> {appt.customer_phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-slate-500" /> Stylist: <strong className="text-slate-300">{appt.staff_name || 'Assigned'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" /> {appt.appointment_date} at {appt.time_slot}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Proof Thumbnail & Action Buttons */}
              <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                
                {/* Screenshot Preview */}
                {appt.payment_screenshot_url ? (
                  <button
                    type="button"
                    onClick={() => setSelectedScreenshot(appt.payment_screenshot_url || null)}
                    className="relative group rounded-xl overflow-hidden border border-slate-700 w-16 h-16 bg-slate-950 shrink-0"
                    title="Click to view payment proof"
                  >
                    <img
                      src={appt.payment_screenshot_url}
                      alt="Payment Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Eye className="w-4 h-4" />
                    </div>
                  </button>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 text-[9px] text-center p-1">
                    <QrCode className="w-4 h-4 mb-0.5 text-amber-400" />
                    <span>UPI Direct</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleConfirm(appt.id)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Issue Token</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setRejectionTargetId(appt.id)}
                    className="px-3 py-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 text-xs font-semibold rounded-xl border border-slate-700 hover:border-rose-500/30 flex items-center gap-1.5 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Screenshot Zoom Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 relative space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                Customer Payment Proof Screenshot
              </h3>
              <button
                type="button"
                onClick={() => setSelectedScreenshot(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-black flex items-center justify-center">
              <img
                src={selectedScreenshot}
                alt="Payment Screenshot Zoom"
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setSelectedScreenshot(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectionTargetId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleReject}
            className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-fadeIn"
          >
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Reject Payment &amp; Cancel Token</h3>
            </div>

            <p className="text-xs text-slate-300">
              Please enter the reason for rejecting this payment screenshot (e.g. amount mismatch, illegible receipt, uncredited transaction):
            </p>

            <textarea
              required
              rows={3}
              placeholder="e.g. Transaction amount does not match booking cost..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectionTargetId(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isProcessing || !rejectionReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
export default PaymentVerificationManager;
