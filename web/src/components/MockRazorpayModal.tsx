import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Building, 
  Banknote, 
  X, 
  CheckCircle2, 
  Loader2,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MockRazorpayModalProps {
  amount: number;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  onSuccess: (paymentDetails: {
    gateway: 'mock_razorpay' | 'cash' | 'upi';
    transactionId: string;
    status: 'completed';
  }) => void;
  onClose: () => void;
}

export const MockRazorpayModal: React.FC<MockRazorpayModalProps> = ({
  amount,
  serviceName,
  customerName,
  customerPhone,
  onSuccess,
  onClose
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'cash'>('upi');
  const [upiApp, setUpiApp] = useState('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const orderId = `order_WBS_${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePay = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      setTimeout(() => {
        onSuccess({
          gateway: selectedMethod === 'cash' ? 'cash' : 'mock_razorpay',
          transactionId: `pay_${Math.random().toString(36).substring(2, 12)}`,
          status: 'completed'
        });
      }, 900);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp text-slate-100">
        
        {/* Razorpay Authentic-Style Header */}
        <div className="bg-[#0b1329] p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              <span className="font-serif text-lg">₹</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">Western Boys Salon</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded border border-blue-500/30">
                  Razorpay Secured
                </span>
              </div>
              <p className="text-xs text-slate-400">{serviceName}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">Amount to Pay</span>
            <span className="text-xl font-extrabold text-white font-mono">₹{amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Modal Body */}
        {isDone ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white font-serif">Payment Successful!</h3>
            <p className="text-xs text-slate-400">
              Transaction ID: <span className="font-mono text-amber-400">pay_wbs_{Math.floor(100000 + Math.random() * 900000)}</span>
            </p>
            <p className="text-xs text-slate-300">
              Generating your live queue token and sending WhatsApp confirmation...
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* Customer Details Pill */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Payer: </span>
                <strong className="text-white">{customerName}</strong>
              </div>
              <div className="font-mono text-slate-300">{customerPhone}</div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'netbanking', label: 'NetBanking', icon: Building },
                { id: 'cash', label: 'Pay at Salon', icon: Banknote },
              ].map(tab => {
                const Icon = tab.icon;
                const isSel = selectedMethod === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedMethod(tab.id as 'upi' | 'card' | 'netbanking' | 'cash')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                      isSel
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-panels based on payment method */}
            {selectedMethod === 'upi' && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">Select Preferred UPI App:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gpay', label: 'Google Pay' },
                    { id: 'phonepe', label: 'PhonePe' },
                    { id: 'paytm', label: 'Paytm UPI' }
                  ].map(app => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setUpiApp(app.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition text-center ${
                        upiApp === app.id
                          ? 'bg-blue-600 text-white border-blue-400 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {app.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 text-center pt-1">
                  Instant UPI intent / QR authorization simulated
                </p>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 space-y-2 text-xs">
                <input
                  type="text"
                  readOnly
                  value="4111 •••• •••• 1111"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    readOnly
                    value="12/28"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono text-center"
                  />
                  <input
                    type="text"
                    readOnly
                    value="•••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono text-center"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'cash' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300 space-y-1">
                <p className="font-bold">Pay at Salon Counter</p>
                <p className="text-amber-200/80 text-[11px]">
                  Your token will be created immediately. You can settle ₹{amount} in cash or UPI once you arrive at Western Boys Salon.
                </p>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 text-xs space-y-2">
                <span className="text-slate-400 block">Popular Banks:</span>
                <div className="grid grid-cols-2 gap-2">
                  <span className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-center font-semibold text-slate-300">HDFC Bank</span>
                  <span className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-center font-semibold text-slate-300">ICICI Bank</span>
                  <span className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-center font-semibold text-slate-300">State Bank of India</span>
                  <span className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-center font-semibold text-slate-300">Axis Bank</span>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {selectedMethod === 'cash' ? 'Confirm Booking (Pay Later)' : `Pay ₹${amount.toFixed(2)} Securely`}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-bit SSL Encrypted
                </span>
                <span className="font-mono text-[10px] text-slate-400">Order: {orderId}</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
