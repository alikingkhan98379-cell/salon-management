import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  X, 
  Loader2, 
  ShieldCheck, 
  Clock,
  RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export interface CustomerAuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer';
}

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: CustomerAuthUser) => void;
  initialEmail?: string;
  salonName?: string;
  serviceName?: string;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  initialEmail = '',
  salonName,
  serviceName
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<'enter_email' | 'enter_otp'>('enter_email');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    let timer: any = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  if (!isOpen) return null;

  // 1. Send Email OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Save intent so any auth triggers understand this is a customer
    sessionStorage.setItem('wbs_login_intent', 'customer');
    localStorage.setItem('wbs_login_intent', 'customer');
    localStorage.setItem(`wbs_user_role_${cleanEmail}`, 'customer');

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true
          }
        });
        if (error) throw error;
        setStep('enter_otp');
        setResendCooldown(30);
        setSuccessMessage(`Verification code sent to ${cleanEmail}. Please check your inbox or spam.`);
      } else {
        // Fallback for offline or local preview
        setStep('enter_otp');
        setResendCooldown(30);
        setSuccessMessage(`Demo Mode: Verification code is 123456`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify Email OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const code = otpCode.trim();

    if (!code) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: code,
          type: 'email'
        });
        if (error) throw error;

        const authUserId = data?.user?.id || `cust-${Date.now()}`;
        const userName = data?.user?.user_metadata?.full_name || cleanEmail.split('@')[0] || 'Customer';

        const customerUser: CustomerAuthUser = {
          id: authUserId,
          email: cleanEmail,
          name: userName,
          role: 'customer'
        };

        // Persist customer role
        localStorage.setItem(`wbs_user_role_${cleanEmail}`, 'customer');
        sessionStorage.setItem('wbs_login_intent', 'customer');

        onAuthenticated(customerUser);
        onClose();
      } else {
        // Fallback preview
        const customerUser: CustomerAuthUser = {
          id: `cust-${Date.now()}`,
          email: cleanEmail,
          name: cleanEmail.split('@')[0] || 'Customer',
          role: 'customer'
        };

        localStorage.setItem(`wbs_user_role_${cleanEmail}`, 'customer');
        sessionStorage.setItem('wbs_login_intent', 'customer');

        onAuthenticated(customerUser);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Invalid verification code. Please check and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Google 1-Tap Alternative
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const cleanEmail = email.trim().toLowerCase();
    sessionStorage.setItem('wbs_login_intent', 'customer');
    localStorage.setItem('wbs_login_intent', 'customer');
    if (cleanEmail) {
      localStorage.setItem(`wbs_user_role_${cleanEmail}`, 'customer');
    }

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
      } else {
        const customerUser: CustomerAuthUser = {
          id: `cust-google-${Date.now()}`,
          email: 'google.customer@example.com',
          name: 'Google Customer',
          role: 'customer'
        };
        onAuthenticated(customerUser);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl relative animate-fadeIn">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Quick Customer Sign-In
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            {step === 'enter_email' ? 'Confirm Your Booking' : 'Verify Email Code'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {salonName && serviceName ? (
              <span>
                Booking <strong>{serviceName}</strong> at <strong>{salonName}</strong>. Enter your email to receive your live queue token.
              </span>
            ) : (
              <span>Enter your email to receive appointment confirmations and your live queue token.</span>
            )}
          </p>
        </div>

        {/* Feedback messages */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 'enter_email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address (Gmail / Any Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                No password required. We'll send an instant verification code.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider">or</span>
            </div>

            {/* Google Alternative */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-2xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z" />
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP Code */}
        {step === 'enter_otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Enter 6-Digit Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('enter_email');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Change Email
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 123456"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-2xl pl-10 pr-4 py-2.5 text-center text-sm font-mono tracking-widest text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                <span>Sent to: <strong className="text-slate-300">{email}</strong></span>
                {resendCooldown > 0 ? (
                  <span className="text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Resend Code
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !otpCode.trim()}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify &amp; Continue to Booking</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Trust Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Strict Customer Privacy • Zero Default Salon Linking</span>
        </div>
      </div>
    </div>
  );
};
