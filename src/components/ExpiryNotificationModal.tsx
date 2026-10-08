import React, { useState } from 'react';
import { PurchaseOrder } from '../types';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Building, 
  Package, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  ShieldAlert,
  Volume2,
  VolumeX,
  Truck
} from 'lucide-react';

interface ExpiryNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrders: PurchaseOrder[];
  onSelectPo: (po: PurchaseOrder) => void;
}

export const ExpiryNotificationModal: React.FC<ExpiryNotificationModalProps> = ({
  isOpen,
  onClose,
  purchaseOrders,
  onSelectPo,
}) => {
  const [filterType, setFilterType] = useState<'today' | '3days' | 'all'>('today');
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isOpen) return null;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);
  const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

  interface ExpiryItem {
    po: PurchaseOrder;
    itemId: string;
    itemName: string;
    qty: number;
    expiryDate: string;
    warehouse: string;
    isToday: boolean;
    isUrgent: boolean;
    daysLeft: number;
  }

  const allExpiryItems: ExpiryItem[] = [];

  purchaseOrders.forEach((po) => {
    // Check PO overall expiry
    const poExp = po.expiryDate || po.appointmentDate;
    if (poExp) {
      const expDate = new Date(poExp);
      const diffTime = expDate.getTime() - today.setHours(0,0,0,0);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      allExpiryItems.push({
        po,
        itemId: po.items?.[0]?.itemId || 'PO-BATCH',
        itemName: po.items?.[0]?.itemName || 'All Consignment Items',
        qty: po.totalQty,
        expiryDate: poExp,
        warehouse: po.warehouseName,
        isToday: poExp === todayStr,
        isUrgent: diffDays <= 3,
        daysLeft: diffDays,
      });
    }

    // Check individual items
    po.items?.forEach((it) => {
      if (it.expiryDate) {
        const expDate = new Date(it.expiryDate);
        const diffTime = expDate.getTime() - today.setHours(0,0,0,0);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        allExpiryItems.push({
          po,
          itemId: it.itemId,
          itemName: it.itemName,
          qty: it.qty,
          expiryDate: it.expiryDate,
          warehouse: po.warehouseName,
          isToday: it.expiryDate === todayStr,
          isUrgent: diffDays <= 3,
          daysLeft: diffDays,
        });
      }
    });
  });

  const filteredItems = allExpiryItems.filter((item) => {
    if (filterType === 'today') return item.isToday || item.daysLeft <= 0;
    if (filterType === '3days') return item.daysLeft <= 3;
    return true;
  });

  const expiringTodayCount = allExpiryItems.filter((i) => i.isToday || i.daysLeft <= 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 via-rose-700 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Expiry Date Notification Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-rose-700 uppercase tracking-wider">
                  Live Alert
                </span>
              </div>
              <p className="text-xs text-rose-100">
                Automated darkstore stock alert for batches expiring today ({todayStr})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('today')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                filterType === 'today'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Expiring Today ({expiringTodayCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('3days')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterType === '3days'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100'
              }`}
            >
              Within 3 Days ({allExpiryItems.filter(i => i.daysLeft <= 3).length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterType === 'all'
                  ? 'bg-slate-800 dark:bg-zinc-700 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100'
              }`}
            >
              All Tracked Batches ({allExpiryItems.length})
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Threshold: FIFO Priority Dispatch
          </div>
        </div>

        {/* Content List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
                No Expiry Emergencies Detected
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                All consignment items in the selected filter are within safe shelf-life windows.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  item.isToday
                    ? 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/30'
                    : item.daysLeft <= 3
                    ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                      {item.po.poNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.isToday
                        ? 'bg-rose-600 text-white animate-pulse'
                        : item.daysLeft <= 3
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                    }`}>
                      {item.isToday ? 'Expires Today!' : `${item.daysLeft} Days Remaining`}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Status: <strong>{item.po.status}</strong>
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-800 dark:text-zinc-200">
                    {item.itemName}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-orange-500" />
                      SKU: <strong className="font-mono">{item.itemId}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-blue-500" />
                      {item.warehouse}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      Expiry: <strong>{item.expiryDate}</strong>
                    </span>
                    <span>
                      Batch Qty: <strong>{item.qty} units</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPo(item.po);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 flex items-center gap-1.5 transition shadow-xs"
                  >
                    <span>View PO Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-500 flex items-center justify-between px-5">
          <span>
            Notification Engine: Daily Darkstore Expiry Alert & FIFO Dispatch Compliance
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-semibold text-xs hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
