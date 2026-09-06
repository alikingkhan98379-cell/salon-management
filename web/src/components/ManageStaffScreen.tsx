import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Star, 
  Scissors, 
  Percent, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Lock, 
  Edit3, 
  Power, 
  Search,
  Sparkles,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { salonDataService } from '../lib/salonDataService';
import { Profile, Salon, UserRole } from '../types';

interface ManageStaffScreenProps {
  currentSalon: Salon;
  currentUserRole: UserRole;
  currentUserEmail: string;
}

const AVAILABLE_SPECIALTIES = [
  'Skin Fade',
  'Beard Sculpting',
  'Haircut',
  'Hair Coloring',
  'Keratin Treatment',
  'Royal Shave',
  'Facial & Clean Up',
  'Head Massage & Spa'
];

export const ManageStaffScreen: React.FC<ManageStaffScreenProps> = ({
  currentSalon,
  currentUserRole,
  currentUserEmail
}) => {
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [filterRole, setFilterRole] = useState<'all' | 'manager' | 'staff'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'staff'>('staff');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['Haircut', 'Beard Sculpting']);
  const [commissionRate, setCommissionRate] = useState<number>(15);
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'manager' | 'staff'>('staff');
  const [editSpecialties, setEditSpecialties] = useState<string[]>([]);
  const [editCommission, setEditCommission] = useState<number>(15);
  const [editError, setEditError] = useState<string | null>(null);

  // Load team members on mount or salon change
  const refreshTeam = async () => {
    const list = await salonDataService.getTeamMembers(currentSalon.id);
    setTeamMembers(list);
  };

  useEffect(() => {
    refreshTeam();
    const unsub = salonDataService.subscribe(() => {
      refreshTeam();
    });
    return unsub;
  }, [currentSalon.id]);

  const isOwner = currentUserRole === 'salon_owner' || currentUserRole === 'super_admin';
  const isManager = currentUserRole === 'manager';

  // Toggle specialty in Add Form
  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  // Toggle specialty in Edit Form
  const toggleEditSpecialty = (spec: string) => {
    setEditSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleOpenAddModal = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setRole('staff');
    setSelectedSpecialties(['Haircut', 'Beard Sculpting']);
    setCommissionRate(15);
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setIsSubmitting(true);

    try {
      const result = await salonDataService.addTeamMember({
        salonId: currentSalon.id,
        fullName,
        phone,
        email: email ? email.trim() : undefined,
        role,
        specialties: selectedSpecialties,
        commissionRate,
        actorEmail: currentUserEmail,
        actorRole: currentUserRole
      });

      if (!result.success) {
        setAddError(result.error || 'Could not add team member.');
        setIsSubmitting(false);
        return;
      }

      setIsAddModalOpen(false);
      await refreshTeam();
    } catch (err: any) {
      setAddError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (member: Profile) => {
    if (isManager && member.role === 'manager') {
      alert('Managers cannot edit another Manager.');
      return;
    }
    setEditingMember(member);
    setEditFullName(member.full_name);
    setEditPhone(member.phone);
    setEditEmail(member.email || '');
    setEditRole(member.role as 'manager' | 'staff');
    setEditSpecialties(member.specialties || []);
    setEditCommission(member.commission_rate || 15);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditError(null);

    const result = await salonDataService.updateTeamMember({
      memberId: editingMember.id,
      salonId: currentSalon.id,
      updates: {
        full_name: editFullName,
        phone: editPhone,
        email: editEmail ? editEmail.trim() : undefined,
        role: editRole,
        specialties: editSpecialties,
        commission_rate: editCommission
      },
      actorEmail: currentUserEmail,
      actorRole: currentUserRole
    });

    if (!result.success) {
      setEditError(result.error || 'Could not update team member.');
      return;
    }

    setEditingMember(null);
    await refreshTeam();
  };

  const handleToggleActive = async (member: Profile) => {
    if (isManager && member.role === 'manager') {
      alert('Managers cannot modify Manager status.');
      return;
    }

    if (member.is_active) {
      const confirmed = window.confirm(
        `Are you sure you want to deactivate ${member.full_name}?\n\nTheir login access will be revoked immediately, but their historical appointments, tokens, and records will be preserved.`
      );
      if (!confirmed) return;

      const res = await salonDataService.deactivateTeamMember({
        memberId: member.id,
        salonId: currentSalon.id,
        actorEmail: currentUserEmail,
        actorRole: currentUserRole
      });
      if (!res.success) {
        alert(res.error);
      }
    } else {
      const res = await salonDataService.reactivateTeamMember({
        memberId: member.id,
        salonId: currentSalon.id,
        actorEmail: currentUserEmail,
        actorRole: currentUserRole
      });
      if (!res.success) {
        alert(res.error);
      }
    }
    await refreshTeam();
  };

  // Filtered members list
  const filteredMembers = teamMembers.filter(m => {
    if (filterRole !== 'all' && m.role !== filterRole) return false;
    if (filterStatus === 'active' && !m.is_active) return false;
    if (filterStatus === 'inactive' && m.is_active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.full_name.toLowerCase().includes(q);
      const matchPhone = m.phone.toLowerCase().includes(q);
      const matchEmail = (m.email || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail;
    }
    return true;
  });

  const totalMembers = teamMembers.length;
  const activeStylists = teamMembers.filter(m => m.role === 'staff' && m.is_active).length;
  const totalManagers = teamMembers.filter(m => m.role === 'manager').length;
  const inactiveCount = teamMembers.filter(m => !m.is_active).length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold font-serif text-white">Salon Team &amp; Staff Management</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Add and manage your stylists, barbers, and floor managers. Team members log in independently using their registered email via Email OTP and access their scoped salon portal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4 font-bold" />
              <span>Add Team Member</span>
            </button>
          </div>
        </div>

        {/* Role Scoping Notice */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isOwner && 'Owner Mode: Full authority to provision and configure Managers and Staff.'}
              {isManager && 'Manager Mode: Authorized to add and manage Staff members. Manager profiles are managed by the Salon Owner.'}
            </span>
          </div>
          <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {currentSalon.name}
          </span>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Team</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1">{totalMembers}</p>
          <span className="text-[10px] text-slate-500">Across all salon roles</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active Stylists</span>
            <Scissors className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{activeStylists}</p>
          <span className="text-[10px] text-slate-500">Currently serving clients</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Managers</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{totalManagers}</p>
          <span className="text-[10px] text-slate-500">Floor &amp; queue oversight</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Deactivated</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">{inactiveCount}</p>
          <span className="text-[10px] text-slate-500">Login access revoked</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Role & Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterRole === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setFilterRole('staff')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterRole === 'staff' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Staff ({activeStylists})
            </button>
            <button
              onClick={() => setFilterRole('manager')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterRole === 'manager' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Managers ({totalManagers})
            </button>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStatus === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStatus === 'inactive' ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No team members match your criteria</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const isMemberManager = member.role === 'manager';
            const canManageThisMember = isOwner || (isManager && !isMemberManager);

            return (
              <div 
                key={member.id}
                className={`bg-slate-900 border rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all ${
                  member.is_active 
                    ? 'border-slate-800 hover:border-slate-700' 
                    : 'border-rose-900/40 bg-rose-950/10 opacity-75'
                }`}
              >
                <div>
                  {/* Card Header: Avatar, Name, Role Badge, Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md ${
                        isMemberManager 
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950' 
                          : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950'
                      }`}>
                        {member.full_name ? member.full_name[0].toUpperCase() : 'S'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-snug">{member.full_name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                            isMemberManager 
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {isMemberManager ? 'Manager' : 'Staff Stylist'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {member.is_active ? (
                        <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 mr-1 text-rose-400" />
                          Deactivated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono text-slate-200">{member.phone}</span>
                      </div>
                      <a 
                        href={`tel:${member.phone}`}
                        className="text-[11px] text-amber-400 hover:underline font-semibold"
                      >
                        Call
                      </a>
                    </div>
                    {member.email ? (
                      <div className="flex items-center space-x-2 text-slate-400 pt-1 border-t border-slate-900">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="truncate text-slate-300 font-mono text-[11px]">{member.email}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-900">
                        No login email set
                      </div>
                    )}
                  </div>

                  {/* Specialties & Commission */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-white">{member.rating || 5.0}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Percent className="w-3 h-3 text-amber-400" />
                        <span className="font-semibold text-slate-200">Commission: {member.commission_rate}%</span>
                      </div>
                    </div>

                    {/* Specialties Badges */}
                    {member.specialties && member.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.specialties.slice(0, 3).map((spec, idx) => (
                          <span 
                            key={idx} 
                            className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50"
                          >
                            {spec}
                          </span>
                        ))}
                        {member.specialties.length > 3 && (
                          <span className="text-[10px] text-slate-500 font-semibold px-1 py-0.5">
                            +{member.specialties.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {canManageThisMember ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(member)}
                        className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(member)}
                        className={`flex-1 flex items-center justify-center space-x-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                          member.is_active
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{member.is_active ? 'Deactivate' : 'Reactivate'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full text-center py-1 text-[11px] text-slate-500 flex items-center justify-center space-x-1">
                      <Lock className="w-3 h-3 text-amber-500/70" />
                      <span>Owner-only authorization required</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD TEAM MEMBER                                                */}
      {/* ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add New Team Member</h3>
                  <p className="text-xs text-slate-400">Account will be provisioned directly to {currentSalon.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              
              {/* Error Alert */}
              {addError && (
                <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Assigned Role <span className="text-amber-400">*</span>
                </label>
                {isOwner ? (
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      role === 'staff' 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="team_role"
                        value="staff"
                        checked={role === 'staff'}
                        onChange={() => setRole('staff')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">Staff (Stylist)</p>
                        <p className="text-[10px] text-slate-400">Personal queue &amp; chair</p>
                      </div>
                    </label>

                    <label className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      role === 'manager' 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="team_role"
                        value="manager"
                        checked={role === 'manager'}
                        onChange={() => setRole('manager')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">Manager</p>
                        <p className="text-[10px] text-slate-400">Queue &amp; payments manager</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Scissors className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Staff (Stylist / Barber)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 italic">Managers can add Staff only</span>
                  </div>
                )}
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mobile Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">10-digit Indian mobile phone number.</p>
              </div>

              {/* Email Address for Login */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Staff Email Address <span className="text-emerald-400 font-normal">(Crucial for Email OTP login)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@salon.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  When this person logs in with this email via OTP, they will automatically land in their scoped dashboard.
                </p>
              </div>

              {/* Commission Rate */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
              </div>

              {/* Specialties Select */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Specialties &amp; Services
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_SPECIALTIES.map((spec) => {
                    const isSelected = selectedSpecialties.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialty(spec)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-semibold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {spec} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Team Member'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT TEAM MEMBER                                               */}
      {/* ===================================================================== */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Team Member</h3>
                  <p className="text-xs text-slate-400">{editingMember.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              
              {editError && (
                <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Email Address (OTP Login)
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Role (Owners can switch role; Managers cannot) */}
              {isOwner && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'manager' | 'staff')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="staff">Staff (Stylist / Barber)</option>
                    <option value="manager">Manager (Floor &amp; Operations)</option>
                  </select>
                </div>
              )}

              {/* Commission */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editCommission}
                    onChange={(e) => setEditCommission(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
              </div>

              {/* Specialties Select */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Specialties
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_SPECIALTIES.map((spec) => {
                    const isSelected = editSpecialties.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleEditSpecialty(spec)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-semibold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {spec} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
export default ManageStaffScreen;
