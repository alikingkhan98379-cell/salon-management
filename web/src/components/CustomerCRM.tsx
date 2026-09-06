import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Star, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  Scissors, 
  Edit2, 
  Check, 
  X,
  Phone,
  Mail,
  Sparkles
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';
import { Customer } from '../types';

export const CustomerCRM: React.FC = () => {
  const customers = salonStore.getCustomers();
  const appointments = salonStore.getAppointments();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [editingNotes, setEditingNotes] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [hairInput, setHairInput] = useState('');

  const filteredCustomers = customers.filter(c => 
    !searchQuery || 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const customerVisits = selectedCustomer
    ? appointments.filter(a => a.customer_id === selectedCustomer.id || a.customer_phone === selectedCustomer.phone)
    : [];

  const handleStartEditNotes = () => {
    if (selectedCustomer) {
      setAllergyInput(selectedCustomer.allergy_notes || '');
      setHairInput(selectedCustomer.hair_preference_notes || '');
      setEditingNotes(true);
    }
  };

  const handleSaveNotes = () => {
    if (selectedCustomer) {
      salonStore.updateCustomerNotes(selectedCustomer.id, allergyInput, hairInput);
      setEditingNotes(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Client Relationship Management</span>
        <h2 className="text-2xl font-bold font-serif text-white">Customer Records &amp; Hair Profiles</h2>
        <p className="text-xs text-slate-400 mt-1">
          Track visit history, hair &amp; beard styling preferences, skin allergies, and lifetime value.
        </p>
      </div>

      {/* CRM Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customer Directory (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto no-scrollbar">
            {filteredCustomers.map(cust => {
              const isSelected = cust.id === selectedCustomerId;
              return (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomerId(cust.id);
                    setEditingNotes(false);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white">{cust.name}</h4>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {cust.total_visits} visits
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{cust.phone}</p>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                    <span>Lifetime Spend:</span>
                    <strong className="text-emerald-400 font-mono">₹{cust.total_spent}</strong>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Customer Details & Visit History (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCustomer ? (
            <>
              {/* Profile Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold text-2xl flex items-center justify-center shadow-lg">
                      {selectedCustomer.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-serif text-white">{selectedCustomer.name}</h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-amber-400" /> {selectedCustomer.phone}
                        </span>
                        {selectedCustomer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-amber-400" /> {selectedCustomer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Metrics */}
                  <div className="flex items-center space-x-3 sm:text-right">
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Visits</span>
                      <strong className="text-lg font-mono text-white">{selectedCustomer.total_visits}</strong>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Spend</span>
                      <strong className="text-lg font-mono text-emerald-400">₹{selectedCustomer.total_spent}</strong>
                    </div>
                  </div>
                </div>

                {/* Preferences & Allergies Notes */}
                <div className="pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-amber-400" /> Stylist Preferences &amp; Allergies
                    </span>
                    {!editingNotes ? (
                      <button
                        onClick={handleStartEditNotes}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Preferences</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveNotes}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition shadow-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingNotes(false)}
                          className="px-2.5 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingNotes ? (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Hair &amp; Beard Styling Notes</label>
                        <textarea
                          rows={2}
                          value={hairInput}
                          onChange={(e) => setHairInput(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Skin Sensitivity / Allergies</label>
                        <input
                          type="text"
                          value={allergyInput}
                          onChange={(e) => setAllergyInput(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-400">Hair &amp; Beard Preference:</span>
                        <p className="text-slate-200">
                          {selectedCustomer.hair_preference_notes || 'No custom styling instructions saved yet.'}
                        </p>
                      </div>

                      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Skin Allergies / Sensitivities:
                        </span>
                        <p className="text-slate-200">
                          {selectedCustomer.allergy_notes || 'None recorded.'}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Visit History Log */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-base font-bold font-serif text-white mb-3">Service Visit History</h4>
                {customerVisits.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No recorded visits for this guest yet.</p>
                ) : (
                  <div className="space-y-2">
                    {customerVisits.map(visit => (
                      <div key={visit.id} className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white block">{visit.service_name}</span>
                          <span className="text-[10px] text-slate-400">
                            {visit.appointment_date} • {visit.time_slot} • Stylist: {visit.staff_name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400 block">₹{visit.amount}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">{visit.payment_status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              Select a customer to view records
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
