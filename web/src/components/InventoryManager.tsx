import React, { useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Check, 
  RotateCcw, 
  Search,
  X,
  Sparkles
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';
import { InventoryItem } from '../types';

export const InventoryManager: React.FC = () => {
  const inventory = salonStore.getInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newCategory, setNewCategory] = useState('Styling');
  const [newQty, setNewQty] = useState(10);
  const [newUnit, setNewUnit] = useState('bottles');
  const [newThreshold, setNewThreshold] = useState(5);
  const [newUnitCost, setNewUnitCost] = useState(200);
  const [newSupplier, setNewSupplier] = useState('');

  const filteredItems = inventory.filter(i => 
    !searchQuery || 
    i.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = inventory.filter(i => i.quantity <= i.low_stock_threshold).length;

  const handleRestock = (id: string, count: number) => {
    salonStore.restockInventory(id, count);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    const currentInv = salonStore.getInventory();
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      salon_id: salonStore.getActiveSalon().id,
      item_name: newItemName,
      category: newCategory,
      quantity: newQty,
      unit: newUnit,
      low_stock_threshold: newThreshold,
      unit_cost: newUnitCost,
      supplier_info: newSupplier,
      last_restocked_at: new Date().toISOString(),
    };

    currentInv.push(newItem);
    salonStore.subscribe(() => {})();
    setShowAddModal(false);
    setNewItemName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Back-Bar &amp; Retail Supplies</span>
          <h2 className="text-2xl font-bold font-serif text-white">Salon Inventory &amp; Stock Alerts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track salon consumables, blades, hair waxes, shampoos, and automated replenishment alerts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 flex items-center justify-between text-amber-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Action Needed: {lowStockCount} Items Below Threshold</h4>
              <p className="text-xs text-amber-300/80">
                Replenish required to avoid interruptions during weekend grooming rushes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search products or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/80">
                <th className="py-3.5 px-4">Item Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Stock on Hand</th>
                <th className="py-3.5 px-4">Alert Threshold</th>
                <th className="py-3.5 px-4">Unit Cost</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredItems.map(item => {
                const isLow = item.quantity <= item.low_stock_threshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{item.item_name}</span>
                        {isLow && (
                          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold animate-pulse">
                            LOW STOCK
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">Unit: {item.unit}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-mono font-bold text-sm ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      ≤ {item.low_stock_threshold} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      ₹{item.unit_cost}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {item.supplier_info || 'Local Vendor'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleRestock(item.id, 5)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-bold border border-slate-700 transition"
                      >
                        +5 {item.unit.split(' ')[0]}
                      </button>
                      <button
                        onClick={() => handleRestock(item.id, 10)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-bold border border-slate-700 transition"
                      >
                        +10
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> New Inventory Item
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Item / Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Keratin Hair Serum (100ml)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Styling">Styling</option>
                    <option value="Beard">Beard Care</option>
                    <option value="Tools">Blades &amp; Tools</option>
                    <option value="Hair Care">Hair Care</option>
                    <option value="Skin">Skin &amp; Facial</option>
                    <option value="Sanitation">Sanitation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="bottles, tubs, packs"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Qty</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 font-semibold mb-1">Low Alert Qty</label>
                  <input
                    type="number"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-amber-500/40 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Supplier Info</label>
                <input
                  type="text"
                  placeholder="e.g. Barber Supplies Hub, Mumbai"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
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
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
