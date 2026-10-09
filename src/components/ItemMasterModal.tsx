import React, { useState } from 'react';
import { ItemMaster } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Database, 
  Check, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface ItemMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemMaster[];
  onSaveItem: (item: Partial<ItemMaster>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onSeedDefaults: () => Promise<void>;
}

export const ItemMasterModal: React.FC<ItemMasterModalProps> = ({
  isOpen,
  onClose,
  items,
  onSaveItem,
  onDeleteItem,
  onSeedDefaults
}) => {
  const { isAdmin, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [unit, setUnit] = useState('Pcs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = items.filter(
    (it) =>
      it &&
      (String(it.itemId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       String(it.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (it.category && String(it.category).toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const startNewItem = () => {
    setIsEditing(true);
    setCurrentItemId(null);
    setItemId(`INST-SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setItemName('');
    setCategory('Groceries');
    setUnit('Pcs');
    setError(null);
  };

  const startEdit = (item: ItemMaster) => {
    setIsEditing(true);
    setCurrentItemId(item.id);
    setItemId(item.itemId);
    setItemName(item.itemName);
    setCategory(item.category || 'Groceries');
    setUnit(item.unit || 'Pcs');
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Only Admin can add or edit items in the master catalog.');
      return;
    }
    if (!itemId.trim() || !itemName.trim()) {
      setError('Item ID and Item Name are mandatory.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSaveItem({
        id: currentItemId || undefined,
        itemId: itemId.trim().toUpperCase(),
        itemName: itemName.trim(),
        category: category.trim(),
        unit: unit.trim(),
        updatedBy: `${userProfile?.displayName} (${userProfile?.employeeId})`,
      });
      setIsEditing(false);
      setCurrentItemId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
      alert('Only Admin can delete items.');
      return;
    }
    if (confirm(`Are you sure you want to delete SKU: "${name}"?`)) {
      setLoading(true);
      try {
        await onDeleteItem(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 transition-all flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl">
                Item Master SKU Catalog (Admin)
              </h3>
              <p className="text-xs text-purple-200">
                Manage Item IDs & Item Names for Auto-Lookup across POs & DNs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isEditing ? (
            /* Edit / Create Form */
            <form onSubmit={handleSave} className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">
                  {currentItemId ? 'Edit Master SKU' : 'Add New Master SKU'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Item ID (SKU Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="INST-SKU-1001"
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="Dairy, Staples, Beverages..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Item Name <span className="text-rose-500">* (Auto populated when Item ID is selected)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amul Taaza Homogenised Toned Milk 1L"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Unit of Measurement (UOM)
                  </label>
                  <input
                    type="text"
                    placeholder="Pcs, Pack, Bottle, Box..."
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition"
                >
                  <Check className="w-3.5 h-3.5" /> Save SKU
                </button>
              </div>
            </form>
          ) : (
            /* List View */
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Item ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                {items.length === 0 && (
                  <button
                    type="button"
                    onClick={onSeedDefaults}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 hover:bg-amber-100 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Seed Default SKUs
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={startNewItem}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New SKU
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Table of SKUs */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
                <tr>
                  <th className="py-2.5 px-3">Item ID (SKU)</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Unit</th>
                  {isAdmin && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                      No SKUs found. Click "Add New SKU" or "Seed Default SKUs".
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-700 dark:text-purple-300">
                        {it.itemId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 dark:text-zinc-100 font-semibold">
                        {it.itemName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400">
                        {it.category || 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400">
                        {it.unit || 'Pcs'}
                      </td>
                      {isAdmin && (
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(it)}
                              className="p-1 text-slate-400 hover:text-purple-600 rounded"
                              title="Edit item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(it.id, it.itemName)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
