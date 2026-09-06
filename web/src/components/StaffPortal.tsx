import React, { useState } from 'react';
import { 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Car, 
  Scissors, 
  AlertCircle,
  Star,
  Lock
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';
import { Appointment } from '../types';

export const StaffPortal: React.FC = () => {
  const staffMembers = salonStore.getStaff();
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffMembers[0]?.id || '');

  const appointments = salonStore.getAppointments();
  const currentStaff = staffMembers.find(s => s.id === selectedStaffId) || staffMembers[0];

  // RLS Staff Scoping: only show appointments where staff_id matches current staff
  const staffAppointments = appointments.filter(a => a.staff_id === currentStaff?.id);

  const handleStartService = (appt: Appointment) => {
    appt.status = 'serving';
    // Update token
    const tok = salonStore.getTokens().find(t => t.appointment_id === appt.id);
    if (tok) {
      tok.status = 'serving';
      tok.started_at = new Date().toISOString();
    }
    salonStore.subscribe(() => {})();
  };

  const handleCompleteService = (appt: Appointment) => {
    appt.status = 'completed';
    const tok = salonStore.getTokens().find(t => t.appointment_id === appt.id);
    if (tok) {
      salonStore.completeToken(tok.id);
    } else {
      salonStore.createInvoiceForAppointment(appt.id);
    }
  };

  const handleNoShow = (appt: Appointment) => {
    appt.status = 'no_show';
    const tok = salonStore.getTokens().find(t => t.appointment_id === appt.id);
    if (tok) salonStore.skipToken(tok.id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Barber Identity & Privacy Shield Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold text-2xl shadow-lg">
              {currentStaff?.full_name ? currentStaff.full_name[0] : 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold font-serif text-white">{currentStaff?.full_name}</h2>
                <span className="flex items-center text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Star className="w-3 h-3 fill-amber-400 mr-1" /> {currentStaff?.rating}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Specialties: <span className="text-slate-200">{currentStaff?.specialties.join(', ')}</span>
              </p>
              <div className="flex items-center space-x-1.5 mt-1.5 text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Staff RLS View: Financials &amp; salon-wide revenues hidden</span>
              </div>
            </div>
          </div>

          {/* Barber Switcher dropdown to simulate different barbers */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold">Switch Barber:</span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-400 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {staffMembers.map(st => (
                <option key={st.id} value={st.id}>{st.full_name} ({st.specialties[0]})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Today's Barber Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" /> Today&apos;s Assigned Clients ({staffAppointments.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {staffAppointments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
            <p className="font-semibold text-sm">No clients assigned yet for today.</p>
            <p className="text-xs mt-1">New appointments will appear here as soon as clients book.</p>
          </div>
        ) : (
          staffAppointments.map((appt) => {
            const isServing = appt.status === 'serving';
            const isCompleted = appt.status === 'completed';
            const isConfirmed = appt.status === 'confirmed' || appt.status === 'pending';

            return (
              <div
                key={appt.id}
                className={`bg-slate-900 border rounded-2xl p-5 transition-all shadow-md ${
                  isServing
                    ? 'border-amber-500/60 bg-amber-950/20 shadow-amber-500/10'
                    : isCompleted
                    ? 'border-slate-800/60 opacity-60'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left Client Info */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-mono font-bold text-amber-400 shadow-sm">
                      <span className="text-xs">{appt.token_code || '--'}</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-bold text-white">{appt.customer_name}</h4>
                        <span className="text-xs text-slate-400 font-mono">({appt.time_slot})</span>
                        {appt.service_type === 'home_service' ? (
                          <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-purple-500/30">
                            <Car className="w-3 h-3" /> Home Visit
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/30">
                            <Scissors className="w-3 h-3" /> In-Salon
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 font-medium mt-0.5">{appt.service_name}</p>

                      {/* Client Hair Preferences / Allergy Notes */}
                      {appt.home_service_address && (
                        <p className="text-[11px] text-purple-300 mt-1 bg-purple-950/30 px-2 py-1 rounded border border-purple-800/40">
                          📍 Address: {appt.home_service_address}
                        </p>
                      )}

                      {appt.notes && (
                        <p className="text-[11px] text-amber-300/90 mt-1 bg-amber-950/20 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" /> Note: {appt.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for Barber */}
                  <div className="flex items-center space-x-2 sm:self-center">
                    {isConfirmed && (
                      <button
                        onClick={() => handleStartService(appt)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Service</span>
                      </button>
                    )}

                    {isServing && (
                      <button
                        onClick={() => handleCompleteService(appt)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Done / Complete</span>
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    )}

                    {!isCompleted && (
                      <button
                        onClick={() => handleNoShow(appt)}
                        className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition"
                        title="Client No Show"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
