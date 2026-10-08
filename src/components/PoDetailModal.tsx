import React from 'react';
import { PurchaseOrder } from '../types';
import { 
  X, 
  Package, 
  Truck, 
  Building, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  User, 
  ShieldCheck, 
  Printer, 
  AlertCircle 
} from 'lucide-react';

interface PoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder;
  onEdit?: () => void;
  canEdit?: boolean;
}

export const PoDetailModal: React.FC<PoDetailModalProps> = ({
  isOpen,
  onClose,
  po,
  onEdit,
  canEdit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 transition-all flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl">
                  {po.poNumber}
                </h3>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                  po.status === 'In Transit'
                    ? 'bg-blue-500 text-white'
                    : po.status === 'GRN Completed'
                    ? 'bg-emerald-500 text-white'
                    : po.status === 'Inwarded'
                    ? 'bg-teal-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {po.status}
                </span>
              </div>
              <p className="text-xs text-orange-100">
                {po.warehouseName} • Ordered: {po.orderDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1"
              title="Print PO Summary"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Top key indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Pickup Status</span>
              <span className={`text-sm font-black ${po.pickupStatus === 'YES' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                {po.pickupStatus === 'YES' ? '✓ YES (Dispatched)' : '✕ NO (Pending)'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Total Quantity</span>
              <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                {po.totalQty} Units
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Boxes & Dimensions</span>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {po.noOfBoxes} boxes • {po.boxDimensions || 'N/A'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Logistics Portal</span>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {po.logisticsPortal || 'N/A'}
              </span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden">
            <div className="bg-slate-100 dark:bg-zinc-800 px-3 py-2 font-bold text-slate-800 dark:text-zinc-200 text-xs flex justify-between">
              <span>SKU Items in this PO ({po.items?.length || 0})</span>
              <span>Total Qty: {po.totalQty}</span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-700">
                <tr>
                  <th className="p-2.5">Item ID</th>
                  <th className="p-2.5">Item Name</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-center">Boxes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {po.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="p-2.5 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {item.itemId}
                    </td>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-zinc-100">
                      {item.itemName}
                    </td>
                    <td className="p-2.5 text-center font-bold">
                      {item.qty}
                    </td>
                    <td className="p-2.5 text-center text-slate-500">
                      {item.boxCount || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200 dark:border-zinc-700">
            <div>
              <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Invoice No</span>
              <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">{po.invoiceNo || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Ship Date</span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">{po.shipDate || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Sales Order (SO)</span>
              <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">{po.so || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Appointment ID</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{po.appointmentId || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Appointment Date</span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">{po.appointmentDate || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Pickup Tracking ID</span>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{po.pickupTrackingId || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">PUC (Confirmation)</span>
              <span className="font-mono text-slate-800 dark:text-zinc-200">{po.puc || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">ASN</span>
              <span className="font-mono text-slate-800 dark:text-zinc-200">{po.asn || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Clear Bag No.</span>
              <span className="font-mono text-slate-800 dark:text-zinc-200">{po.clearBagNo || 'N/A'}</span>
            </div>
          </div>

          {/* GRN & DN Status if any */}
          {po.grnNumber && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                  GRN Record: {po.grnNumber}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Inwarded on {po.grnDate} • {po.hasDN ? '⚠️ Discrepancy Note Flagged' : '✓ Verified 100%'}
                </span>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg">
                GRN Done
              </span>
            </div>
          )}

          {/* Comment */}
          {po.comment && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block mb-1">
                Internal Remarks / Comment
              </span>
              <p className="text-slate-700 dark:text-zinc-300 text-xs italic">
                "{po.comment}"
              </p>
            </div>
          )}

          {/* Audit Logging */}
          <div className="p-3 bg-slate-100 dark:bg-zinc-800/80 rounded-xl text-[11px] text-slate-600 dark:text-zinc-400 flex flex-wrap justify-between gap-2 border border-slate-200 dark:border-zinc-700">
            <div>
              Created by: <strong className="text-slate-900 dark:text-zinc-100">{po.createdByName || 'System'}</strong> (ID: {po.createdByEmpId || 'N/A'})
            </div>
            <div>
              Created on: {new Date(po.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-2">
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => { onClose(); onEdit(); }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition shadow-xs"
            >
              Edit PO Details
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
