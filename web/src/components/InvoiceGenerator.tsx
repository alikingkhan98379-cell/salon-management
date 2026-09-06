import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  Scissors, 
  Crown, 
  Building2,
  Search,
  Eye
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';
import { Invoice } from '../types';

export const InvoiceGenerator: React.FC = () => {
  const currentSalon = salonStore.getActiveSalon();
  const invoices = salonStore.getInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = invoices.filter(i => 
    !searchQuery ||
    i.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Point of Sale &amp; Accounting</span>
          <h2 className="text-2xl font-bold font-serif text-white">GST Invoices &amp; Guest Receipts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Auto-generated tax invoices per completed appointment with GST breakdown.
          </p>
        </div>

        {selectedInvoice && (
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center space-x-2 self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF Receipt</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Invoices List (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto no-scrollbar">
            {filteredInvoices.map(inv => {
              const isSelected = selectedInvoice?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-amber-400">{inv.invoice_number}</span>
                    <span className="font-mono font-bold text-sm text-white">₹{inv.total_amount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mt-1">
                    <span>{inv.customer_name}</span>
                    <span className="text-[10px] text-slate-400">{inv.service_type === 'home_service' ? '🚗 Home' : '💈 Salon'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(inv.created_at).toLocaleDateString()} • {inv.payment_method}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoice Preview Sheet (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedInvoice ? (
            <div 
              id="printable-invoice"
              className="bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 border border-slate-200"
            >
              {/* Receipt Top Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                      <Scissors className="w-5 h-5 -rotate-45" />
                    </div>
                    <span className="font-serif font-black text-xl tracking-wide text-slate-950">
                      WESTERN BOYS SALON
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-sans">
                    {currentSalon.address}, {currentSalon.city}, {currentSalon.state}
                  </p>
                  <p className="text-xs text-slate-600 font-mono">
                    Tel: {currentSalon.phone} • GSTIN: 08AAACW1234F1Z8
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 block">TAX INVOICE</span>
                  <span className="font-mono font-black text-sm text-slate-900 block mt-0.5">
                    {selectedInvoice.invoice_number}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Date: {new Date(selectedInvoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Bill To */}
              <div className="flex items-start justify-between text-xs py-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Billed To (Guest):</span>
                  <strong className="text-sm text-slate-900">{selectedInvoice.customer_name}</strong>
                  <p className="text-slate-600 font-mono mt-0.5">{selectedInvoice.customer_phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Payment Details:</span>
                  <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] mt-0.5">
                    PAID ({selectedInvoice.payment_method})
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border-t border-b border-slate-200 py-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-2">Item / Service</th>
                      <th className="py-2 text-center">Type</th>
                      <th className="py-2 text-right">Taxable Value</th>
                      <th className="py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="py-3">
                        <strong className="text-slate-900 block">{selectedInvoice.service_name}</strong>
                        <span className="text-[11px] text-slate-500">Premium barbering service package</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-[10px] font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          {selectedInvoice.service_type === 'home_service' ? 'Doorstep' : 'In-Salon'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-slate-600">
                        ₹{selectedInvoice.subtotal.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        ₹{selectedInvoice.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Calculations Breakdown */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-1.5 font-sans">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%):</span>
                    <span className="font-mono">₹{(selectedInvoice.tax_amount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9%):</span>
                    <span className="font-mono">₹{(selectedInvoice.tax_amount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-950 border-t-2 border-slate-900 pt-2">
                    <span>Total Paid:</span>
                    <span className="font-mono">₹{selectedInvoice.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500 space-y-1 font-sans">
                <p className="font-semibold text-slate-700">Thank you for visiting Western Boys Salon!</p>
                <p>Computer generated invoice • Authorized signatory stamp on file</p>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              No invoices generated yet.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
