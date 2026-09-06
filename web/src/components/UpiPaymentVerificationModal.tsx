import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Upload, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  FileText,
  Sparkles,
  Scissors
} from 'lucide-react';
import { Salon, Service } from '../types';

interface UpiPaymentVerificationModalProps {
  salon: Salon;
  service: Service;
  serviceType: 'in_salon' | 'home_service';
  amount: number;
  stylistName: string;
  customerName: string;
  customerPhone: string;
  onSuccess: (paymentDetails: {
    gateway: 'upi';
    paymentScreenshotUrl: string;
  }) => void;
  onClose: () => void;
}

export const UpiPaymentVerificationModal: React.FC<UpiPaymentVerificationModalProps> = ({
  salon,
  service,
  serviceType,
  amount,
  stylistName,
  customerName,
  customerPhone,
  onSuccess,
  onClose
}) => {
  const upiId = salon.upi_id || 'westernboys@okhdfcbank';
  const [copied, setCopied] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Demo receipt generator for instant seamless testing
  const handleUseDemoReceipt = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillText('UPI Payment Successful', 24, 45);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(`Paid to: ${salon.name}`, 24, 85);
      ctx.fillText(`UPI ID: ${upiId}`, 24, 115);
      ctx.fillText(`Amount: INR ${amount}.00`, 24, 145);
      ctx.fillText(`Txn Ref: UPI/${Date.now().toString().slice(-10)}`, 24, 175);
      ctx.fillText(`Customer: ${customerName} (${customerPhone})`, 24, 205);
      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText(new Date().toLocaleString(), 24, 255);
    }
    setScreenshotPreview(canvas.toDataURL('image/png'));
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotPreview) {
      setErrorMsg('Please upload your payment screenshot as proof of transaction.');
      return;
    }

    setIsSubmitting(true);
    onSuccess({
      gateway: 'upi',
      paymentScreenshotUrl: screenshotPreview
    });
  };

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(salon.name)}&am=${amount}&cu=INR`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 relative space-y-5 shadow-2xl my-6">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <QrCode className="w-3 h-3" /> Step 2: Direct UPI Payment
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-white">{salon.name}</h2>
          <p className="text-xs text-slate-400">
            Pay directly to the salon owner and upload proof for instant queue token verification.
          </p>
        </div>

        {/* Amount & Service Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>Service:</span>
            <strong className="text-white">{service.name} ({serviceType.replace('_', ' ')})</strong>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Stylist:</span>
            <strong className="text-amber-300 flex items-center gap-1">
              <Scissors className="w-3 h-3" /> {stylistName}
            </strong>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">Amount Due:</span>
            <span className="text-2xl font-black text-amber-400 font-mono">₹{amount}</span>
          </div>
        </div>

        {/* UPI QR & Pay Link Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 text-center space-y-3">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">
            Scan &amp; Pay Using Any UPI App (GPay, PhonePe, Paytm)
          </div>

          {/* QR Code Placeholder / Representation */}
          <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-2xl shadow-lg flex flex-col items-center justify-center relative group">
            <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-2 text-slate-900">
              <QrCode className="w-16 h-16 text-slate-900" />
              <span className="text-[9px] font-bold tracking-wider mt-1">BHIM UPI QR</span>
            </div>
          </div>

          {/* UPI ID Copy Bar */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <div className="text-left font-mono">
              <span className="text-[10px] text-slate-500 block">Salon UPI ID</span>
              <span className="text-amber-300 font-bold">{upiId}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold rounded-lg border border-amber-500/30 flex items-center gap-1 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <a
            href={upiDeepLink}
            className="inline-block text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
          >
            Or tap here to open UPI app directly
          </a>
        </div>

        {/* Screenshot Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-200">
                Upload Payment Proof Screenshot *
              </label>
              <button
                type="button"
                onClick={handleUseDemoReceipt}
                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                title="Generate sample payment screenshot for instant test"
              >
                <Sparkles className="w-3 h-3" /> Quick Demo Receipt
              </button>
            </div>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 cursor-pointer bg-slate-950 border border-slate-800 rounded-2xl p-2"
              />
            </div>

            {screenshotPreview && (
              <div className="mt-2.5 p-2 bg-slate-950 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                <img
                  src={screenshotPreview}
                  alt="Receipt Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                />
                <div className="text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Screenshot Attached
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Ready for salon owner review
                  </span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !screenshotPreview}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting Booking...</span>
            ) : (
              <>
                <span>Submit Proof &amp; Request Token</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-500 text-center">
            Your booking will be in &quot;Pending Verification&quot; state until the salon owner/manager approves your screenshot.
          </p>
        </form>

      </div>
    </div>
  );
};
export default UpiPaymentVerificationModal;
