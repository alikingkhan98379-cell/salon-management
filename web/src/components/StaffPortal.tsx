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
  Lock, 
  Edit3, 
  Save, 
  MessageSquare,
  TrendingUp,
  Percent,
  Calendar,
  Sparkles
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';
import { salonDataService } from '../lib/salonDataService';
import { Appointment, UserRole } from '../types';

interface StaffPortalProps {
  currentUser?: {
    id: string;
    email?: string;
    role?: UserRole;
    name?: string;
    assignedSalonId?: string;
  } | null;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({ currentUser }) => {
  const staffMembers = salonStore.getStaff();
  
  // If user is logged in as staff, lock to their profile
  const userMatchedStaff = currentUser?.role === 'staff'
    ? staffMembers.find(s => 
        (currentUser.email && s.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        s.id === currentUser.id
      )
    : null;

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    userMatchedStaff?.id || staffMembers[0]?.id || ''
  );
  
  // Note editing state for completed visits
  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [hairNote, setHairNote] = useState('');
  const [behaviorNote, setBehaviorNote] = useState('');

  const appointments = salonStore.getAppointments();
  const currentStaff = userMatchedStaff || staffMembers.find(s => s.id === selectedStaffId) || staffMembers[0];

  // RLS Staff Scoping: only show appointments where staff_id matches current staff
  const staffAppointments = appointments.filter(a => a.staff_id === currentStaff?.id);

  // Performance metrics for current stylist
  const completedAppointments = staffAppointments.filter(a => a.status === 'completed');
  const servingAppointment = staffAppointments.find(a => a.status === 'serving');
  const commissionRate = currentStaff?.commission_rate || 15;
  const completedRevenue = completedAppointments.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const estimatedCommission = Math.round((completedRevenue * commissionRate) / 100);

  const handleStartService = (appt: Appointment) => {
    appt.status = 'serving';
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
    // Prompt for stylist notes
    setEditingApptId(appt.id);
  };

  const handleSaveNotes = (appt: Appointment) => {
    if (appt.customer_id) {
      salonDataService.updateCustomerStylistNotes(appt.customer_id, {
        hairPreference: hairNote,
        behavior: behaviorNote
      });
    }
    setEditingApptId(null);
    setHairNote('');
    setBehaviorNote('');
    alert('Customer styling & behavioral notes saved to client profile!');
  };

  const handleNoShow = (appt: Appointment) => {
    appt.status = 'no_show';
    const tok = salonStore.getTokens().find(t => t.appointment_id === appt.id);
    if (tok) salonStore.skipToken(tok.id);
  };

  const isStaffRole = currentUser?.role === 'staff';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Barber Identity & Performance Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold text-2xl shadow-lg shadow-amber-500/20 border border-amber-400/40">
              {currentStaff?.full_name ? currentStaff.full_name[0] : 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold font-serif text-white">{currentStaff?.full_name}</h2>
                <span className="flex items-center text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Star className="w-3 h-3 fill-amber-400 mr-1" /> {currentStaff?.rating || 5.0}
                </span>
                {isStaffRole && (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    My Chair
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Specialties: <span className="text-slate-200">{currentStaff?.specialties.join(', ') || 'Stylist'}</span>
              </p>
              <div className="flex items-center space-x-1.5 mt-1.5 text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>
                  {isStaffRole 
                    ? 'Staff Scoped Portal: Personal queue & performance' 
                    : 'Management Station View: Viewing Barber Station'}
                </span>
              </div>
            </div>
          </div>

          {/* If Owner/Manager: show Barber Switcher dropdown; if Staff: hide switcher */}
          {!isStaffRole ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold">Switch Chair:</span>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-400 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {staffMembers.map(st => (
                  <option key={st.id} value={st.id}>{st.full_name} ({st.specialties[0] || 'Stylist'})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-2xl flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-mono">Commission Rate</p>
                <p className="text-sm font-bold text-amber-400 font-mono">{commissionRate}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Personal Performance Dashboard Metrics */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Today's Clients</span>
            <span className="text-lg font-bold text-white font-mono">{staffAppointments.length}</span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Clients Served</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{completedAppointments.length}</span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Est. Earnings</span>
            <span className="text-lg font-bold text-amber-400 font-mono">₹{estimatedCommission}</span>
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
            const isEditingNotes = editingApptId === appt.id;

            return (
              <div
                key={appt.id}
                className={`bg-slate-900 border rounded-2xl p-5 transition-all shadow-md ${
                  isServing
                    ? 'border-amber-500/60 bg-amber-950/20 shadow-amber-500/10'
                    : isCompleted
                    ? 'border-slate-800/60'
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Completed
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingApptId(isEditingNotes ? null : appt.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Stylist Notes</span>
                        </button>
                      </div>
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

                {/* Stylist Notes Drawer for Customer */}
                {isEditingNotes && (
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-3 bg-slate-950/60 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Record Styling Notes for {appt.customer_name} (Recognized Across All Salons)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Look / Hair &amp; Beard Preference</label>
                        <input
                          type="text"
                          placeholder="e.g. Skin taper fade #1 on sides, scissor trimmed top"
                          value={hairNote}
                          onChange={(e) => setHairNote(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Behavior &amp; Service Quirks</label>
                        <input
                          type="text"
                          placeholder="e.g. Sensitive scalp, quiet client, likes herbal aftershave"
                          value={behaviorNote}
                          onChange={(e) => setBehaviorNote(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingApptId(null)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(appt)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save to Client Profile</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
export default StaffPortal;
