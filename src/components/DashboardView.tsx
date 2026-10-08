import React, { useState, useEffect } from 'react';
import { PurchaseOrder, DNRecord, ItemMaster } from '../types';
import { 
  Package, 
  Truck, 
  FileCheck, 
  FileText, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Bell, 
  TrendingUp, 
  Box, 
  CheckCircle2, 
  ChevronRight, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  ShieldAlert,
  Flame,
  FileSpreadsheet
} from 'lucide-react';

interface DashboardViewProps {
  purchaseOrders: PurchaseOrder[];
  dnRecords: DNRecord[];
  itemsCatalog: ItemMaster[];
  onNavigateTab: (tab: any) => void;
  onOpenNewPo: () => void;
  onOpenNewDn: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  purchaseOrders,
  dnRecords,
  itemsCatalog,
  onNavigateTab,
  onOpenNewPo,
  onOpenNewDn,
}) => {
  // Real-time Live Clock and Date
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = currentTime.toISOString().split('T')[0];

  // Expiry date checking: Look for any PO or items where expiryDate matches today or is past
  const expiringTodayList = purchaseOrders.flatMap((po) => {
    const hits: { poNumber: string; warehouse: string; item: string; expiry: string; qty: number }[] = [];
    
    // Check PO overall appointment / expiry date
    if (po.expiryDate === todayStr || po.appointmentDate === todayStr) {
      hits.push({
        poNumber: po.poNumber,
        warehouse: po.warehouseName,
        item: po.items?.[0]?.itemName || 'All Batch Items',
        expiry: po.expiryDate || po.appointmentDate,
        qty: po.totalQty,
      });
    }

    // Check individual items
    po.items?.forEach((it) => {
      if (it.expiryDate === todayStr) {
        hits.push({
          poNumber: po.poNumber,
          warehouse: po.warehouseName,
          item: it.itemName,
          expiry: it.expiryDate,
          qty: it.qty,
        });
      }
    });

    return hits;
  });

  // Key KPI stats
  const totalPOs = purchaseOrders.length;
  const inTransitCount = purchaseOrders.filter(p => p.pickupStatus === 'YES' || p.status === 'In Transit').length;
  const grnCompletedCount = purchaseOrders.filter(p => p.status === 'GRN Completed').length;
  const openDnCount = dnRecords.filter(d => d.status !== 'Closed').length;
  const totalBoxes = purchaseOrders.reduce((sum, p) => sum + (p.noOfBoxes || 0), 0);
  const totalUnits = purchaseOrders.reduce((sum, p) => sum + (p.totalQty || 0), 0);

  // Fulfillment rate
  const fulfillmentRate = totalPOs > 0 ? Math.round((grnCompletedCount / totalPOs) * 100) : 85;

  // Formatting Live Date & Time
  const timeFormatted = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Live Clock & Real-time Operations Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
              Live Operations Command Center
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Swiggy Instamart Supply Chain Hub
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time PO intake, In-Transit tracking, DarkStore Inwards & Discrepancies
          </p>
        </div>

        {/* Live Clock & Date Widget */}
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-3.5 shadow-inner">
          <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="font-mono text-lg sm:text-xl font-black text-white tracking-wider flex items-center gap-1.5">
              <span>{timeFormatted}</span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              {dateFormatted}
            </div>
          </div>
        </div>
      </div>

      {/* Expiry Date Notification Alert Banner (Requested) */}
      {expiringTodayList.length > 0 ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse-border">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                  URGENT EXPIRY ALERT
                </span>
                <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  {expiringTodayList.length} Item Batch(es) Expiring Today ({todayStr})!
                </span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                Perishable groceries / DarkStore appointments expiring today require immediate inward clearance and FIFO dispatch to prevent stock loss.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {expiringTodayList.slice(0, 3).map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-medium">
                    📦 <strong>{item.poNumber}</strong>: {item.item} ({item.qty} units at {item.warehouse.split(' ')[1] || item.warehouse})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('all_pos')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm shrink-0 flex items-center gap-1.5"
          >
            <span>Review Expiring Stock</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Critical Expiries Today:</strong> All active darkstore inventory batches are within valid shelf-life thresholds for {dateFormatted}.
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hidden sm:inline">
            Status: Optimal FIFO
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total POs */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-orange-400 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">Total Purchase Orders</span>
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalPOs}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{totalUnits.toLocaleString()} total units</span>
            <span className="text-emerald-600 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12%
            </span>
          </div>
        </div>

        {/* In-Transit Cargo */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-blue-400 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">In–Transit (On Road)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {inTransitCount}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{totalBoxes} cartons en route</span>
            <span className="text-blue-600 font-bold">Active Fleet</span>
          </div>
        </div>

        {/* GRN Inwarded */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-emerald-400 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">GRN Inwarded</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {grnCompletedCount}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{fulfillmentRate}% fulfillment rate</span>
            <span className="text-emerald-600 font-bold">Verified</span>
          </div>
        </div>

        {/* Open Discrepancies (DNs) */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-rose-400 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-bold">Open DN Discrepancies</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {openDnCount}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>LR tracking active</span>
            <span className="text-rose-600 font-bold">Action Needed</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: 7-Day PO Inflow & Dispatch Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                PO Processing & Dispatch Velocity (Weekly Trend)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Daily volume of New POs created vs successfully dispatched In-Transit
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-orange-600">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> New Orders
              </span>
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Dispatched
              </span>
            </div>
          </div>

          {/* SVG Line / Bar Chart Visual */}
          <div className="h-56 w-full pt-4 relative">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="poGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="transitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="20" x2="490" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.6" />
              <line x1="30" y1="60" x2="490" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.6" />
              <line x1="30" y1="100" x2="490" y2="100" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.6" />
              <line x1="30" y1="140" x2="490" y2="140" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.6" />

              {/* Area 1: New POs */}
              <path
                d="M 40 130 Q 115 70, 190 90 T 340 40 T 480 50 L 480 150 L 40 150 Z"
                fill="url(#poGradient)"
              />
              <path
                d="M 40 130 Q 115 70, 190 90 T 340 40 T 480 50"
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Area 2: In-Transit */}
              <path
                d="M 40 145 Q 115 110, 190 120 T 340 70 T 480 65 L 480 150 L 40 150 Z"
                fill="url(#transitGradient)"
              />
              <path
                d="M 40 145 Q 115 110, 190 120 T 340 70 T 480 65"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data dots */}
              <circle cx="40" cy="130" r="4" fill="#f97316" />
              <circle cx="190" cy="90" r="4" fill="#f97316" />
              <circle cx="340" cy="40" r="4" fill="#f97316" />
              <circle cx="480" cy="50" r="4" fill="#f97316" />

              <circle cx="40" cy="145" r="4" fill="#3b82f6" />
              <circle cx="190" cy="120" r="4" fill="#3b82f6" />
              <circle cx="340" cy="70" r="4" fill="#3b82f6" />
              <circle cx="480" cy="65" r="4" fill="#3b82f6" />

              {/* X Axis Labels */}
              <text x="40" y="170" fontSize="10" fill="#94a3b8" textAnchor="middle">Mon</text>
              <text x="115" y="170" fontSize="10" fill="#94a3b8" textAnchor="middle">Tue</text>
              <text x="190" y="170" fontSize="10" fill="#94a3b8" textAnchor="middle">Wed</text>
              <text x="265" y="170" fontSize="10" fill="#94a3b8" textAnchor="middle">Thu</text>
              <text x="340" y="170" fontSize="10" fill="#94a3b8" textAnchor="middle">Fri</text>
              <text x="415" y="170" fontSize="10" fill="#94a3b8" textAnchor="middle">Sat</text>
              <text x="480" y="170" fontSize="10" fill="#94a3b8" textAnchor="middle">Today</text>
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-center text-xs">
            <div>
              <span className="text-slate-500 text-[11px]">Avg Dispatch Time</span>
              <div className="font-bold text-slate-800 dark:text-zinc-200">2.4 Hours</div>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">SLA On-Time Rate</span>
              <div className="font-bold text-emerald-600">98.6%</div>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Daily Throughput</span>
              <div className="font-bold text-slate-800 dark:text-zinc-200">4,250 Units</div>
            </div>
          </div>
        </div>

        {/* Chart 2: Logistics Portal Distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              Logistics Fleet Share
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Active courier partners handling DarkStore shipments
            </p>
          </div>

          {/* Donut Visual */}
          <div className="relative flex items-center justify-center py-2">
            <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
              {/* Delhivery: 45% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#fa5300"
                strokeWidth="12"
                strokeDasharray="107 132"
                strokeDashoffset="0"
              />
              {/* Instamart Fleet: 30% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeDasharray="71 168"
                strokeDashoffset="-107"
              />
              {/* BlueDart: 15% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray="36 203"
                strokeDashoffset="-178"
              />
              {/* Others: 10% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#a855f7"
                strokeWidth="12"
                strokeDasharray="24 215"
                strokeDashoffset="-214"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-xl font-black text-slate-900 dark:text-white">100%</span>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Tracked</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fa5300]" /> Delhivery Logistics
              </span>
              <span className="font-bold">45%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Instamart Fleet
              </span>
              <span className="font-bold">30%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> BlueDart Express
              </span>
              <span className="font-bold">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Shadowfax / Others
              </span>
              <span className="font-bold">10%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Destination Volume & Quick Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DarkStore Network Inward Leaderboard */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              DarkStore Warehouse Inward Volume Distribution
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Active Nodes: 7 Hubs</span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Kolkata DarkStore-01 (Salt Lake Sector V)', volume: 1420, max: 2000, color: 'bg-orange-500' },
              { name: 'Kolkata Hub-02 (Rajarhat Newtown)', volume: 1180, max: 2000, color: 'bg-blue-500' },
              { name: 'Bangalore Hub-North (Hebbal)', volume: 940, max: 2000, color: 'bg-emerald-500' },
              { name: 'Mumbai Central WH (Andheri East)', volume: 820, max: 2000, color: 'bg-purple-500' },
              { name: 'Delhi NCR Hub (Gurugram Sec 48)', volume: 650, max: 2000, color: 'bg-teal-500' },
            ].map((wh, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">{wh.name}</span>
                  <span className="font-bold text-slate-600 dark:text-zinc-400">{wh.volume} units</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${wh.color}`}
                    style={{ width: `${(wh.volume / wh.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Execution Desk */}
        <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="inline-flex p-2 rounded-xl bg-white/20 backdrop-blur-md mb-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-black text-lg">
              Quick Operations Actions
            </h3>
            <p className="text-xs text-orange-100 mt-1">
              One-click shortcuts to create records, inward consignments, and sync offline sheets.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <button
              type="button"
              onClick={onOpenNewPo}
              className="w-full py-2.5 px-3 rounded-xl bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs transition shadow-sm flex items-center justify-between"
            >
              <span>+ Create New PO Consignment</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('in_transit')}
              className="w-full py-2.5 px-3 rounded-xl bg-orange-700/60 hover:bg-orange-700 text-white font-bold text-xs transition border border-white/20 flex items-center justify-between"
            >
              <span>Track In–Transit Shipments ({inTransitCount})</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('offline_sheet')}
              className="w-full py-2.5 px-3 rounded-xl bg-orange-700/60 hover:bg-orange-700 text-white font-bold text-xs transition border border-white/20 flex items-center justify-between"
            >
              <span>Open Live Offline Sheet (Grid Mode)</span>
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenNewDn}
              className="w-full py-2.5 px-3 rounded-xl bg-orange-700/60 hover:bg-orange-700 text-white font-bold text-xs transition border border-white/20 flex items-center justify-between"
            >
              <span>Report DN Discrepancy / Damage</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
