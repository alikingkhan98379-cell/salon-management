import React, { useState } from 'react';
import { 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  Building2,
  Lock,
  LogOut
} from 'lucide-react';
import { salonDataService } from '../lib/salonDataService';
import { Salon, SubscriptionPlanType } from '../types';

interface SubscriptionExpiredGateProps {
  salon: Salon;
  ownerEmail: string;
  onSubscriptionRenewed: (updatedSalon: Salon) => void;
  onLogout: () => void;
}

export const SubscriptionExpiredGate: React.FC<SubscriptionExpiredGateProps> = ({
  salon,
  ownerEmail,
  onSubscriptionRenewed,
  onLogout
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>('base_monthly');
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | '6_months' | '1_year'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'base_monthly' as SubscriptionPlanType,
      cycle: 'monthly' as const,
      name: 'Monthly Pro',
      price: 499,
      originalPrice: 499,
      period: 'per month',
      discount: null,
      features: [
        'Full Owner Dashboard Access',
        'Customer Marketplace Listing',
        'Live Queue Tokens & SMS / WhatsApp',
        'Dual Pricing (In-Salon & Home Visit)',
        'Unlimited Barbers & Appointments'
      ]
    },
    {
      id: 'half_yearly' as SubscriptionPlanType,
      cycle: '6_months' as const,
      name: '6-Month Plan',
      price: 2545,
      originalPrice: 2994,
      period: 'for 6 months (~₹424/mo)',
      discount: '15% OFF (Save ₹449)',
      popular: true,
      features: [
        'Everything in Monthly Pro',
        '15% Discount on Total',
        'Priority Directory Placement',
        'Multi-Staff Commission Tracking',
        'Dedicated Support'
      ]
    },
    {
      id: 'yearly' as SubscriptionPlanType,
      cycle: '1_year' as const,
      name: 'Annual VIP',
      price: 4790,
      originalPrice: 5988,
      period: 'for 12 months (~₹399/mo)',
      discount: '20% OFF (Save ₹1,198)',
      features: [
        'Everything in 6-Month Plan',
        '20% Max Savings',
        'Super Admin Verification Badge',
        'Custom SMS Sender Branding',
        'Full Multi-Salon Expansion Ready'
      ]
    }
  ];

  const handleRenew = async () => {
    setIsProcessing(true);
    try {
      const updated = await salonDataService.renewSubscription(
        salon.id,
        selectedPlan,
        selectedCycle
      );
      if (updated) {
        onSubscriptionRenewed(updated);
      }
    } catch (err) {
      console.error('Renewal error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 relative font-sans">
      <div className="max-w-4xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 space-y-8">
        
        {/* Header Alert */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Subscription Expired / Trial Ended
              </span>
              <h1 className="text-2xl font-bold font-serif text-white mt-0.5">
                {salon.name}
              </h1>
              <p className="text-xs text-slate-400">
                Your 7-day free trial has concluded. Upgrade to maintain marketplace visibility &amp; queue tokens.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out ({ownerEmail})</span>
          </button>
        </div>

        {/* Pricing Tier Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isSelected = selectedPlan === p.id && selectedCycle === p.cycle;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPlan(p.id);
                  setSelectedCycle(p.cycle);
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-950 border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.discount && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {p.discount}
                  </span>
                )}

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {p.name}
                  </span>
                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-black text-white font-mono">₹{p.price}</span>
                    <span className="text-xs text-slate-400">{p.period}</span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-900">
                  <div className={`w-full py-2 rounded-xl text-center text-xs font-bold transition ${
                    isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isSelected ? 'Selected Plan' : 'Choose Plan'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button (Razorpay Simulated Gateway) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">Total payable today:</div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              ₹{plans.find(p => p.id === selectedPlan)?.price}
            </div>
            <div className="text-[11px] text-slate-500">
              Instant activation • Razorpay payment simulation
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleRenew}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Renewing Subscription...</span>
            ) : (
              <>
                <span>Pay ₹{plans.find(p => p.id === selectedPlan)?.price} &amp; Reactivate Salon</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
export default SubscriptionExpiredGate;
