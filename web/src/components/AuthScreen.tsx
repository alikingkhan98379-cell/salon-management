import React, { useState } from 'react';
import { 
  Scissors, 
  Crown, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Users,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types';

interface AuthScreenProps {
  onTestLogin: (testUser: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    ownedSalonIds?: string[];
    assignedSalonId?: string;
  }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onTestLogin }) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'google'>('email');
  
  // Email Form State
  const [email, setEmail] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');

  // Phone Form State
  const [phone, setPhone] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Send Email OTP
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
        setSuccessMessage(`OTP sent to ${email}. Please check your inbox or spam.`);
      } else {
        // Fallback simulation
        setEmailOtpSent(true);
        setSuccessMessage(`OTP sent to ${email} (Use code: 123456 to verify)`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Failed to send OTP. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify Email OTP
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabase) {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: emailOtp,
          type: 'email'
        });
        if (error) throw error;
      } else {
        // Mock verification
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
      setErrorMessage(msg || 'Invalid OTP code. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Send Phone OTP
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone.startsWith('+') ? phone : `+91${phone}`,
          options: { shouldCreateUser: true }
        });
        if (error) throw error;
        setPhoneOtpSent(true);
        setSuccessMessage(`SMS OTP sent to ${phone}.`);
      } else {
        setPhoneOtpSent(true);
        setSuccessMessage(`SMS OTP sent to ${phone} (Use code: 123456)`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Failed to send Phone OTP. Ensure phone provider is configured in Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Verify Phone OTP
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtp) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabase) {
        const { error } = await supabase.auth.verifyOtp({
          phone: phone.startsWith('+') ? phone : `+91${phone}`,
          token: phoneOtp,
          type: 'sms'
        });
        if (error) throw error;
      } else {
        onTestLogin({
          id: `user-${Date.now()}`,
          email: `${phone}@phone.auth`,
          role: 'salon_owner',
          name: `Client ${phone.slice(-4)}`,
          ownedSalonIds: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d']
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Invalid SMS OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Sign in with Google OAuth
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
      setErrorMessage(msg || 'Google OAuth failed. Verify redirect URI in Google Cloud Console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-center items-center p-4 sm:p-6 select-none selection:bg-amber-500 selection:text-black">
      
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/25 mx-auto border border-amber-300">
          <Scissors className="w-9 h-9 -rotate-45" />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-wider text-white">
            WESTERN BOYS SALON
          </h1>
          <Crown className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          Multi-Tenant Cloud SaaS Platform • Authentication &amp; Tenant Gateway
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
              authMethod === 'email'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
              authMethod === 'phone'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('google');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
              authMethod === 'google'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Google</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. EMAIL OTP TAB */}
        {authMethod === 'email' && (
          <div>
            {!emailOtpSent ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. owner@westernboyssalon.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send One-Time Password</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Enter 6-Digit Email Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-center text-lg font-mono tracking-widest text-amber-400 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify Code &amp; Sign In</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setEmailOtpSent(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-white"
                >
                  Change email address
                </button>
              </form>
            )}
          </div>
        )}

        {/* 2. PHONE OTP TAB */}
        {authMethod === 'phone' && (
          <div>
            {!phoneOtpSent ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send SMS OTP</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Enter SMS OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-center text-lg font-mono tracking-widest text-amber-400 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify SMS &amp; Sign In</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setPhoneOtpSent(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-white"
                >
                  Change phone number
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. GOOGLE OAUTH TAB */}
        {authMethod === 'google' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-400">
              Sign in securely with your Google account through Supabase OAuth provider.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs tracking-wide shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {/* Role-Based Test Account Quick-Login (For Evaluation & Verification) */}
      <div className="max-w-md w-full mt-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
            ⚡ Evaluation &amp; Role Verification Bar
          </span>
          <span className="text-[10px] text-slate-400">Click any role to test its isolated data</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          
          {/* 1. Multi-Salon Owner */}
          <button
            type="button"
            onClick={() => onTestLogin({
              id: '11111111-1111-1111-1111-111111111111',
              email: 'kabir@westernboyssalon.com',
              role: 'salon_owner',
              name: 'Kabir Khan (Owner of 2 Salons)',
              ownedSalonIds: [
                'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
                'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e'
              ]
            })}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400 mb-1" />
            <strong className="text-white block text-[11px]">Multi-Salon Owner</strong>
            <span className="text-[9px] text-slate-400 block">Tests Salon Picker</span>
          </button>

          {/* 2. Single-Salon Owner */}
          <button
            type="button"
            onClick={() => onTestLogin({
              id: '66666666-6666-6666-6666-666666666666',
              email: 'rishi@udaipurlounge.com',
              role: 'salon_owner',
              name: 'Rishi Mehra (Udaipur Owner)',
              ownedSalonIds: ['b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e']
            })}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition"
          >
            <Building2 className="w-3.5 h-3.5 text-purple-400 mb-1" />
            <strong className="text-white block text-[11px]">Single Owner</strong>
            <span className="text-[9px] text-slate-400 block">Udaipur Salon only</span>
          </button>

          {/* 3. Salon Manager */}
          <button
            type="button"
            onClick={() => onTestLogin({
              id: '22222222-2222-2222-2222-222222222222',
              email: 'aman@westernboyssalon.com',
              role: 'manager',
              name: 'Aman Sharma (Manager)',
              assignedSalonId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
            })}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400 mb-1" />
            <strong className="text-white block text-[11px]">Salon Manager</strong>
            <span className="text-[9px] text-slate-400 block">No billing access</span>
          </button>

          {/* 4. Staff Barber */}
          <button
            type="button"
            onClick={() => onTestLogin({
              id: '33333333-3333-3333-3333-333333333333',
              email: 'farhan@westernboyssalon.com',
              role: 'staff',
              name: 'Farhan Akhtar (Barber)',
              assignedSalonId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
            })}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition"
          >
            <Scissors className="w-3.5 h-3.5 text-emerald-400 mb-1" />
            <strong className="text-white block text-[11px]">Staff Barber</strong>
            <span className="text-[9px] text-slate-400 block">Assigned queue only</span>
          </button>

          {/* 5. Super Admin */}
          <button
            type="button"
            onClick={() => onTestLogin({
              id: '00000000-0000-0000-0000-000000000001',
              email: 'admin@westernboyssaas.com',
              role: 'super_admin',
              name: 'Super Admin (Platform)',
            })}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition col-span-2 sm:col-span-1"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 mb-1" />
            <strong className="text-white block text-[11px]">Super Admin</strong>
            <span className="text-[9px] text-slate-400 block">All platform tenants</span>
          </button>

        </div>
      </div>

    </div>
  );
};
