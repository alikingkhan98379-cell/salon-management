import React, { useState } from 'react';
import { 
  Scissors, 
  Crown, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Users,
  UserCheck,
  ShoppingBag,
  Sparkles,
  Clock,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types';
import { TokenTracker } from './TokenTracker';

interface AuthScreenProps {
  onTestLogin: (testUser: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    phone?: string;
    ownedSalonIds?: string[];
    assignedSalonId?: string;
  }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onTestLogin }) => {
  // Two required login options: Email OTP and Google OAuth
  const [authMethod, setAuthMethod] = useState<'email' | 'google' | 'customer'>('email');
  const [showGuestTracker, setShowGuestTracker] = useState(false);
  
  // Email Form State
  const [email, setEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');

  // Customer Marketplace Entry Form State (Lightweight Email OTP + Compulsory Phone)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerOtpSent, setCustomerOtpSent] = useState(false);
  const [customerOtp, setCustomerOtp] = useState('');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Send Email OTP (Owner / Manager / Staff)
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true }
        });
        if (error) throw error;
        setEmailOtpSent(true);
        setSuccessMessage(`OTP verification code sent to ${email}. Please check your inbox or spam.`);
      } else {
        setEmailOtpSent(true);
        setSuccessMessage(`OTP sent to ${email} (Demo Verification Code: 123456)`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Failed to send OTP code. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify Email OTP (Owner / Manager / Staff)
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabase) {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: emailOtp.trim(),
          type: 'email'
        });
        if (error) throw error;
      } else {
        // Fallback demo login
        onTestLogin({
          id: `user-${Date.now()}`,
          email,
          role: 'salon_owner',
          name: email.split('@')[0],
          ownedSalonIds: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d']
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Invalid OTP code. Please check and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Customer Email OTP Send (Compulsory Phone Number)
  const handleCustomerSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail || !customerPhone) {
      setErrorMessage('Please enter both Email and your compulsory Phone number.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOtp({
          email: customerEmail,
          options: { shouldCreateUser: true }
        });
        if (error) throw error;
        setCustomerOtpSent(true);
        setSuccessMessage(`Customer OTP sent to ${customerEmail}.`);
      } else {
        setCustomerOtpSent(true);
        setSuccessMessage(`Customer verification OTP sent to ${customerEmail} (Demo Code: 123456)`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Failed to send customer OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Customer Email OTP Verify
  const handleCustomerVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerOtp) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabase) {
        const { error } = await supabase.auth.verifyOtp({
          email: customerEmail,
          token: customerOtp.trim(),
          type: 'email'
        });
        if (error) throw error;
      }
      // Log in customer
      onTestLogin({
        id: `cust-${Date.now()}`,
        email: customerEmail,
        role: 'customer',
        name: customerName || customerEmail.split('@')[0],
        phone: customerPhone
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Invalid OTP verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Sign in with Google OAuth (Supabase Auth)
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
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
        onTestLogin({
          id: 'google-user-1',
          email: 'google.guest@example.com',
          role: 'salon_owner',
          name: 'Google Verified User',
          ownedSalonIds: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d']
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Google OAuth failed. Verify redirect URI in Supabase and Google Cloud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="max-w-md w-full text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 mb-4 shadow-xl shadow-amber-500/5">
          <Scissors className="w-8 h-8 text-amber-400 -rotate-45" />
        </div>
        <h1 className="text-3xl font-extrabold font-serif tracking-tight text-white flex items-center justify-center gap-2">
          Western Boys Salon
          <Crown className="w-5 h-5 text-amber-400 inline" />
        </h1>
        <p className="text-sm text-slate-400 mt-1.5 font-medium">
          Multi-Tenant Cloud Platform &amp; Customer Marketplace
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative z-10">
        
        {/* Auth Method Navigation */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl mb-6 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMethod === 'email' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('google');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMethod === 'google' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('customer');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMethod === 'customer' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-400 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-400 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Email OTP Form (Owner / Manager / Staff) */}
        {authMethod === 'email' && (
          <div className="space-y-4">
            <div className="mb-2">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">Business Portal Access</span>
              <p className="text-xs text-slate-400 mt-0.5">Salon Owner, Manager, or Staff login with Email OTP</p>
            </div>

            {!emailOtpSent ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email Address (Gmail)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="owner@westernboyssalon.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Enter OTP Code for {email}
                    </label>
                    <button
                      type="button"
                      onClick={() => setEmailOtpSent(false)}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      Change Email
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Enter OTP code"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-center tracking-[0.3em] text-lg font-mono text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || emailOtp.trim().length < 6}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify &amp; Enter Dashboard</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 2. Google OAuth */}
        {authMethod === 'google' && (
          <div className="space-y-4">
            <div className="text-center py-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-white">Google OAuth Authentication</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Direct single sign-on via Supabase Auth. Seamlessly connects verified Google accounts.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all text-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        {/* 3. Customer Marketplace Entry (Compulsory Phone Number + Email OTP) */}
        {authMethod === 'customer' && (
          <div className="space-y-4">
            <div className="mb-2">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" /> Customer Marketplace Access
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse multiple salons, check stylists &amp; prices, and track your haircut history.
              </p>
            </div>

            {!customerOtpSent ? (
              <form onSubmit={handleCustomerSendOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Sameer Khan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Mobile Phone Number <span className="text-rose-400 font-bold">* Compulsory</span>
                    </label>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98290 11223"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/30 rounded-2xl px-3.5 py-2 text-xs text-amber-300 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Used as your unique cross-salon profile ID and for WhatsApp token alerts.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address <span className="text-emerald-400">* Verified via OTP</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sameer@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !customerEmail || !customerPhone}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification OTP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCustomerVerifyOtp} className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      OTP sent to {customerEmail}
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomerOtpSent(false)}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      Edit Details
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Enter OTP code"
                    value={customerOtp}
                    onChange={(e) => setCustomerOtp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-center tracking-[0.3em] text-base font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || customerOtp.trim().length < 6}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Enter Customer Marketplace</span>}
                </button>
              </form>
            )}
          </div>
        )}

      </div>

      {/* Direct Live Queue Token Tracker for Clients */}
      <div className="max-w-md w-full mt-4 relative z-10">
        <button
          type="button"
          onClick={() => setShowGuestTracker(true)}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#131b2e] to-slate-900 border border-amber-500/40 hover:border-amber-400 hover:bg-slate-800 transition-all flex items-center justify-between group shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Track Live Queue Token</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  No Login Required
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Check wait time, live chair status &amp; queue position
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>
      </div>

      {/* Role QA Quick Switcher: For instant evaluation of all 4 roles + Customer */}
      <div className="max-w-md w-full mt-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 relative z-10">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Role QA Switcher (Instant Test)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">1-Click Test</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
          
          {/* Multi-Salon Owner */}
          <button
            type="button"
            onClick={() => {
              onTestLogin({
                id: '11111111-1111-1111-1111-111111111111',
                email: 'kabir@westernboyssalon.com',
                role: 'salon_owner',
                name: 'Kabir Khan',
                ownedSalonIds: [
                  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
                  'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e'
                ]
              });
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-left transition-all group"
          >
            <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
              <Crown className="w-3 h-3" /> Kabir Khan
            </div>
            <div className="text-[10px] text-slate-400">Multi-Salon Owner (2 Salons)</div>
          </button>

          {/* Single-Salon Owner */}
          <button
            type="button"
            onClick={() => {
              onTestLogin({
                id: '66666666-6666-6666-6666-666666666666',
                email: 'rishi@udaipurlounge.com',
                role: 'salon_owner',
                name: 'Rishi Mehra',
                ownedSalonIds: ['b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e']
              });
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-left transition-all"
          >
            <div className="flex items-center gap-1 text-amber-300 font-bold text-[11px]">
              <Building2 className="w-3 h-3" /> Rishi Mehra
            </div>
            <div className="text-[10px] text-slate-400">Single-Salon Owner (Udaipur)</div>
          </button>

          {/* Super Admin */}
          <button
            type="button"
            onClick={() => {
              onTestLogin({
                id: '00000000-0000-0000-0000-000000000001',
                email: 'saifaliansari983790@gmail.com',
                role: 'super_admin',
                name: 'Platform Super Admin',
                ownedSalonIds: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e']
              });
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800 text-left transition-all"
          >
            <div className="flex items-center gap-1 text-purple-400 font-bold text-[11px]">
              <ShieldCheck className="w-3 h-3" /> Super Admin
            </div>
            <div className="text-[10px] text-slate-400">All Tenancy Oversight</div>
          </button>

          {/* Staff Barber */}
          <button
            type="button"
            onClick={() => {
              onTestLogin({
                id: '33333333-3333-3333-3333-333333333333',
                email: 'farhan@westernboyssalon.com',
                role: 'staff',
                name: 'Farhan Akhtar (Barber)',
                assignedSalonId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
              });
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 text-left transition-all"
          >
            <div className="flex items-center gap-1 text-blue-400 font-bold text-[11px]">
              <Scissors className="w-3 h-3" /> Farhan Akhtar
            </div>
            <div className="text-[10px] text-slate-400">Staff (Jaipur Flagship)</div>
          </button>

          {/* Manager */}
          <button
            type="button"
            onClick={() => {
              onTestLogin({
                id: '22222222-2222-2222-2222-222222222222',
                email: 'aman@westernboyssalon.com',
                role: 'manager',
                name: 'Aman Sharma',
                assignedSalonId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
              });
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 text-left transition-all"
          >
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
              <UserCheck className="w-3 h-3" /> Aman Sharma
            </div>
            <div className="text-[10px] text-slate-400">Manager (Jaipur)</div>
          </button>

          {/* Customer */}
          <button
            type="button"
            onClick={() => {
              onTestLogin({
                id: 'c1111111-1111-1111-1111-111111111111',
                email: 'sameer@gmail.com',
                role: 'customer',
                name: 'Sameer Khan',
                phone: '+91 98290 11223'
              });
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-800 text-left transition-all"
          >
            <div className="flex items-center gap-1 text-amber-300 font-bold text-[11px]">
              <ShoppingBag className="w-3 h-3" /> Sameer Khan
            </div>
            <div className="text-[10px] text-slate-400">Verified Customer (History)</div>
          </button>

        </div>
      </div>

      {/* Guest Live Queue Token Tracker Modal */}
      {showGuestTracker && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="max-w-2xl w-full my-8 relative">
            <button
              type="button"
              onClick={() => setShowGuestTracker(false)}
              className="absolute -top-3 -right-3 z-20 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 shadow-xl"
              title="Close Tracker"
            >
              <X className="w-4 h-4" />
            </button>
            <TokenTracker
              initialTokenCode="WBS-01"
              onBookAnother={() => setShowGuestTracker(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
export default AuthScreen;
