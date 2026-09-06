import React, { useState } from 'react';
import { 
  Plus, 
  Layers, 
  Clock, 
  Car, 
  Scissors, 
  Edit3, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';
import { Service } from '../types';

export const ServicesManager: React.FC = () => {
  const services = salonStore.getServices(false); // include inactive

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Service Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'Hair' | 'Beard' | 'Combo' | 'Skin' | 'Spa'>('Hair');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newInSalonPrice, setNewInSalonPrice] = useState<number>(250);
  const [newHomePrice, setNewHomePrice] = useState<number>(450);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    salonStore.updateService(editingService);
    setEditingService(null);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    salonStore.addService({
      name: newName,
      category: newCategory,
      description: newDescription,
      duration_minutes: newDuration,
      in_salon_price: newInSalonPrice,
      home_service_price: newHomePrice,
      is_active: true,
    });

    setNewName('');
    setNewDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Owner Catalog Configuration</span>
          <h2 className="text-2xl font-bold font-serif text-white">Services &amp; Dual-Pricing</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure in-salon rates and premium doorstep home visit rates independently per service.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition ${
              service.is_active ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  {service.category}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {service.duration_minutes}m
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-2.5">{service.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{service.description}</p>
            </div>

            {/* Pricing Breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                  <div className="flex items-center space-x-1 text-slate-400 text-[10px] uppercase font-bold">
                    <Scissors className="w-3 h-3 text-amber-400" />
                    <span>In-Salon</span>
                  </div>
                  <div className="text-base font-black font-mono text-white mt-0.5">
                    ₹{service.in_salon_price}
                  </div>
                </div>

                <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
                  <div className="flex items-center space-x-1 text-slate-400 text-[10px] uppercase font-bold">
                    <Car className="w-3 h-3 text-purple-400" />
                    <span>Home Visit</span>
                  </div>
                  <div className="text-base font-black font-mono text-purple-300 mt-0.5">
                    ₹{service.home_service_price}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => salonStore.toggleServiceActive(service.id)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                    service.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {service.is_active ? 'Active' : 'Disabled'}
                </button>

                <button
                  onClick={() => setEditingService({ ...service })}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700 transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Pricing</span>
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* EDIT SERVICE MODAL */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" /> Edit Service &amp; Rates
              </h3>
              <button onClick={() => setEditingService(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Title</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={editingService.duration_minutes}
                    onChange={(e) => setEditingService({ ...editingService, duration_minutes: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={editingService.category}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value as Service['category'] })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Hair">Hair</option>
                    <option value="Beard">Beard</option>
                    <option value="Combo">Combo</option>
                    <option value="Skin">Skin</option>
                    <option value="Spa">Spa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-400 font-semibold mb-1">In-Salon Price (₹)</label>
                  <input
                    type="number"
                    value={editingService.in_salon_price}
                    onChange={(e) => setEditingService({ ...editingService, in_salon_price: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-amber-500/40 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-400 font-semibold mb-1">Home Service Price (₹)</label>
                  <input
                    type="number"
                    value={editingService.home_service_price}
                    onChange={(e) => setEditingService({ ...editingService, home_service_price: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Description</label>
                <textarea
                  rows={2}
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SERVICE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> Add New Grooming Service
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Keratin Hair Spa & Treatment"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Service['category'])}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Hair">Hair</option>
                    <option value="Beard">Beard</option>
                    <option value="Combo">Combo</option>
                    <option value="Skin">Skin</option>
                    <option value="Spa">Spa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-400 font-semibold mb-1">In-Salon Price (₹)</label>
                  <input
                    type="number"
                    value={newInSalonPrice}
                    onChange={(e) => setNewInSalonPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-amber-500/40 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-400 font-semibold mb-1">Home Visit Price (₹)</label>
                  <input
                    type="number"
                    value={newHomePrice}
                    onChange={(e) => setNewHomePrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding steps, products used, and benefits..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
