import React, { useState } from 'react';
import { PurchaseOrder } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  CheckCircle, 
  FileCheck, 
  AlertTriangle, 
  Package, 
  Calendar, 
  Building,
  Save,
  FileText
} from 'lucide-react';

interface GrnModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder;
  onConfirmGrn: (poId: string, grnData: { grnNumber: string; grnDate: string; hasDN: boolean; comment: string }) => Promise<void>;
  onOpenDnForPo: (po: PurchaseOrder) => void;
}

export const GrnModal: React.FC<GrnModalProps> = ({
  isOpen,
  onClose,
  po,
  onConfirmGrn,
  onOpenDnForPo
}) => {
  const { userProfile, isActive } = useAuth();
  const [grnNumber, setGrnNumber] = useState(`GRN-INST-${Math.floor(10000 + Math.random() * 90000)}`);
  const [grnDate, setGrnDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasDN, setHasDN] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive) {
      alert('Your account is currently inactive.');
      return;
    }
    setSaving(true);
    try {
      await onConfirmGrn(po.id, {
        grnNumber,
        grnDate,
        hasDN,
        comment: remarks,
      });
      onClose();
      if (hasDN) {
        onOpenDnForPo(po);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete GRN Inwarding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">
                Warehouse Inward & GRN Generation
              </h3>
              <p className="text-xs text-emerald-100">
                PO: {po.poNumber} • {po.warehouseName}
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

        <form onSubmit={handleInwardSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Total Items in PO:</span>
              <strong className="text-slate-800 dark:text-zinc-200">{po.items?.length || 1} SKU(s)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Total Units Expected:</span>
              <strong className="text-slate-800 dark:text-zinc-200">{po.totalQty} units</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Declared Box Count:</span>
              <strong className="text-slate-800 dark:text-zinc-200">{po.noOfBoxes} boxes ({po.boxDimensions})</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                GRN Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={grnNumber}
                onChange={(e) => setGrnNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                GRN Inward Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={grnDate}
                onChange={(e) => setGrnDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* DN Checkbox */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasDN}
                onChange={(e) => setHasDN(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                  Discrepancy Detected? Flag Debit Note (DN)
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300">
                  Check this if any physical items are damaged, short, or excess. System will directly open the Instamart DN Tracker to register discrepancy.
                </span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Inward Verification Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Physical condition, box seal verification notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Processing...' : 'Complete Inward & Generate GRN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
