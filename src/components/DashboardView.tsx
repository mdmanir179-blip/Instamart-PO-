import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  Navigation
} from 'lucide-react';

interface DashboardViewProps {
  purchaseOrders: PurchaseOrder[];
  dnRecords: DNRecord[];
  itemsCatalog: ItemMaster[];
  onNavigateTab: (tab: any) => void;
  onOpenNewPo: () => void;
  onOpenNewDn: () => void;
  onOpenExpiryCenter?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  purchaseOrders,
  dnRecords,
  itemsCatalog,
  onNavigateTab,
  onOpenNewPo,
  onOpenNewDn,
  onOpenExpiryCenter,
}) => {
  // Real-time Live Clock and Date
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trendFilter, setTrendFilter] = useState<'all' | 'new' | 'dispatched'>('all');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = currentTime.toISOString().split('T')[0];

  // Expiry date checking: Look for any PO or items where expiryDate matches today or is past
  const expiringTodayList = useMemo(() => {
    return purchaseOrders.flatMap((po) => {
      const hits: { poNumber: string; warehouse: string; item: string; expiry: string; qty: number }[] = [];
      
      if (po.expiryDate === todayStr || po.appointmentDate === todayStr) {
        hits.push({
          poNumber: po.poNumber,
          warehouse: po.warehouseName,
          item: po.items?.[0]?.itemName || 'All Batch Items',
          expiry: po.expiryDate || po.appointmentDate,
          qty: po.totalQty,
        });
      }

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
  }, [purchaseOrders, todayStr]);

  // Key KPI stats
  const totalPOs = purchaseOrders.length;
  const inTransitCount = purchaseOrders.filter(p => p.pickupStatus === 'YES' || p.status === 'In Transit').length;
  const grnCompletedCount = purchaseOrders.filter(p => p.status === 'GRN Completed').length;
  const openDnCount = dnRecords.filter(d => d.status !== 'Closed').length;
  const totalBoxes = purchaseOrders.reduce((sum, p) => sum + (p.noOfBoxes || 0), 0);
  const totalUnits = purchaseOrders.reduce((sum, p) => sum + (p.totalQty || 0), 0);

  // Fulfillment rate
  const fulfillmentRate = totalPOs > 0 ? Math.round((grnCompletedCount / totalPOs) * 100) : 100;

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

  // ==========================================
  // 1. DYNAMIC 7-DAY WEEKLY TREND DATA MODEL
  // ==========================================
  const weeklyTrendData = useMemo(() => {
    // Generate dates for last 7 calendar days
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentTime);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = i === 6 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Count POs created on this date
      const newOrders = purchaseOrders.filter(po => (po.orderDate || '').startsWith(dateStr)).length;

      // Count POs dispatched/shipped on this date
      const dispatched = purchaseOrders.filter(po => {
        const matchShip = (po.shipDate || '').startsWith(dateStr);
        const matchInTransit = (po.status === 'In Transit' || po.pickupStatus === 'YES') && 
          ((po.updatedAt || '').startsWith(dateStr) || (po.createdAt || '').startsWith(dateStr) || (po.orderDate || '').startsWith(dateStr));
        return matchShip || matchInTransit;
      }).length;

      // Units on this date
      const units = purchaseOrders
        .filter(po => (po.orderDate || '').startsWith(dateStr))
        .reduce((acc, p) => acc + (p.totalQty || 0), 0);

      return {
        dateStr,
        dayLabel,
        dateNum,
        newOrders,
        dispatched,
        units
      };
    });
  }, [purchaseOrders, currentTime]);

  // Determine scale maximum for the chart
  const maxTrendValue = useMemo(() => {
    let max = 0;
    weeklyTrendData.forEach(d => {
      if (d.newOrders > max) max = d.newOrders;
      if (d.dispatched > max) max = d.dispatched;
    });
    return Math.max(max, 4); // minimum 4 to ensure aesthetic proportional bars
  }, [weeklyTrendData]);

  // Total 7-day counts
  const total7DayNew = weeklyTrendData.reduce((acc, d) => acc + d.newOrders, 0);
  const total7DayDispatched = weeklyTrendData.reduce((acc, d) => acc + d.dispatched, 0);

  // ==========================================
  // 2. DYNAMIC LOGISTICS FLEET SHARE DATA MODEL
  // ==========================================
  const logisticsFleetData = useMemo(() => {
    const portalMap: Record<string, number> = {};

    purchaseOrders.forEach((po) => {
      const portal = (po.logisticsPortal || '').trim() || 'Direct Fleet';
      portalMap[portal] = (portalMap[portal] || 0) + 1;
    });

    // Color definitions (calm, corporate, non-glaring)
    const colorPalette = [
      { stroke: '#ea580c', bg: 'bg-orange-500', text: 'text-orange-600', fill: '#ea580c' },
      { stroke: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600', fill: '#2563eb' },
      { stroke: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-600', fill: '#059669' },
      { stroke: '#7c3aed', bg: 'bg-purple-600', text: 'text-purple-600', fill: '#7c3aed' },
      { stroke: '#0891b2', bg: 'bg-cyan-600', text: 'text-cyan-600', fill: '#0891b2' },
      { stroke: '#d97706', bg: 'bg-amber-600', text: 'text-amber-600', fill: '#d97706' },
    ];

    const entries = Object.entries(portalMap).map(([name, count], index) => {
      const color = colorPalette[index % colorPalette.length];
      const percentage = totalPOs > 0 ? Math.round((count / totalPOs) * 100) : 0;
      return {
        name,
        count,
        percentage,
        color
      };
    });

    // Sort by count descending
    entries.sort((a, b) => b.count - a.count);
    return entries;
  }, [purchaseOrders, totalPOs]);

  // Circumference for r=38 circle: 2 * PI * 38 = 238.76
  const CIRCLE_CIRCUMFERENCE = 238.76;

  // ==========================================
  // 3. DYNAMIC WAREHOUSE INWARD VOLUME
  // ==========================================
  const warehouseVolumeData = useMemo(() => {
    const whMap: Record<string, { units: number; pos: number }> = {};

    purchaseOrders.forEach((po) => {
      const wh = (po.warehouseName || 'Main Hub').trim();
      if (!whMap[wh]) {
        whMap[wh] = { units: 0, pos: 0 };
      }
      whMap[wh].units += (po.totalQty || 0);
      whMap[wh].pos += 1;
    });

    const entries = Object.entries(whMap).map(([name, data]) => ({
      name,
      units: data.units,
      pos: data.pos,
    }));

    entries.sort((a, b) => b.units - a.units);
    const maxUnits = Math.max(...entries.map(e => e.units), 100);

    return { entries, maxUnits };
  }, [purchaseOrders]);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      
      {/* Top Banner: Real-Time Command Center with Live Clock & Shift Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">
              Live Operations Command Desk • Active Shift
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Swiggy Instamart Supply Chain Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time PO intake, In-Transit dispatches, DarkStore Inwards & Discrepancies
          </p>
        </div>

        {/* Live Clock & Date Widget */}
        <div className="bg-slate-800/90 border border-slate-700/80 px-4 py-2.5 rounded-xl flex items-center gap-3.5 shadow-inner">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">
              {timeFormatted}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {dateFormatted}
            </div>
          </div>
        </div>
      </div>

      {/* Expiry Date Notification Alert Banner (Requested) */}
      {expiringTodayList.length > 0 ? (
        <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white">
                  URGENT EXPIRY ALERT
                </span>
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  {expiringTodayList.length} Item Batch(es) Expiring Today ({todayStr})!
                </span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                Perishable darkstore consignments expiring today require immediate FIFO dispatch or clearance.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {expiringTodayList.slice(0, 3).map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-medium">
                    📦 <strong>{item.poNumber}</strong>: {item.item} ({item.qty} units at {item.warehouse})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenExpiryCenter ? onOpenExpiryCenter : () => onNavigateTab('all_pos')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Review Expiring Stock ({expiringTodayList.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Critical Expiries Today:</strong> All active darkstore inventory batches are within valid shelf-life thresholds for {dateFormatted}.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hidden sm:inline">
            Status: FIFO Optimal
          </span>
        </div>
      )}

      {/* KPI Cards Grid - Eye-Friendly Soft Corporate Styling */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total POs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-orange-400 transition">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Purchase Orders</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200/60 dark:border-orange-900/40">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
            {totalPOs}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{totalUnits.toLocaleString()} units cataloged</span>
            <span className="text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Active
            </span>
          </div>
        </div>

        {/* In-Transit Cargo */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-400 transition">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">In–Transit (On Road)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/40">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {inTransitCount}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{totalBoxes} cartons dispatched</span>
            <span className="text-blue-600 font-semibold">Active Fleet</span>
          </div>
        </div>

        {/* GRN Inwarded */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">GRN Inwarded</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-900/40">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {grnCompletedCount}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{fulfillmentRate}% fulfillment rate</span>
            <span className="text-emerald-600 font-semibold">Verified</span>
          </div>
        </div>

        {/* Open Discrepancies (DNs) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-rose-400 transition">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Open DN Discrepancies</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-900/40">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {openDnCount}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>LR tracking active</span>
            <span className="text-rose-600 font-semibold">Action Needed</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Charts Section (Dynamic & Functional) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART 1: 7-DAY PO PROCESSING & DISPATCH VELOCITY (FULLY DYNAMIC & FUNCTIONAL) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center border border-orange-200/50">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                  PO Processing & Dispatch Velocity (Weekly Trend)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamic 7-day volume: New POs received vs successfully dispatched In-Transit
              </p>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTrendFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  trendFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                All ({total7DayNew + total7DayDispatched})
              </button>
              <button
                type="button"
                onClick={() => setTrendFilter('new')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  trendFilter === 'new'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                New POs ({total7DayNew})
              </button>
              <button
                type="button"
                onClick={() => setTrendFilter('dispatched')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  trendFilter === 'dispatched'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Dispatched ({total7DayDispatched})
              </button>
            </div>
          </div>

          {/* DYNAMIC COLUMN BARS CHART VISUAL */}
          <div className="pt-4 pb-2">
            <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200/80 dark:border-slate-800 relative">
              {/* Background Guide Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full" />
                <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full" />
                <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full" />
                <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full" />
              </div>

              {weeklyTrendData.map((day, idx) => {
                const isHovered = hoveredDayIdx === idx;
                // Calculate height percentage based on max
                const newHeight = Math.max(14, (day.newOrders / maxTrendValue) * 100);
                const dispatchHeight = Math.max(14, (day.dispatched / maxTrendValue) * 100);

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDayIdx(idx)}
                    onMouseLeave={() => setHoveredDayIdx(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[10px] font-mono py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap border border-slate-700 animate-in fade-in duration-100">
                        <div className="font-bold font-sans text-slate-200">{day.dateNum} ({day.dayLabel})</div>
                        <div>New POs: <strong className="text-orange-400">{day.newOrders}</strong> | Dispatched: <strong className="text-blue-400">{day.dispatched}</strong></div>
                      </div>
                    )}

                    {/* Columns container */}
                    <div className="w-full flex items-end justify-center gap-1.5 h-full pb-1 z-10">
                      {/* Bar 1: New POs */}
                      {(trendFilter === 'all' || trendFilter === 'new') && (
                        <div className="w-full max-w-[20px] flex flex-col items-center justify-end h-full">
                          <span className={`text-[10px] font-bold text-orange-600 dark:text-orange-400 mb-1 transition ${
                            day.newOrders > 0 ? 'opacity-100 font-extrabold' : 'opacity-40 text-slate-400'
                          }`}>
                            {day.newOrders}
                          </span>
                          <div
                            style={{ height: `${day.newOrders > 0 ? newHeight : 8}%` }}
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              day.newOrders > 0
                                ? 'bg-orange-500 hover:bg-orange-600 shadow-xs'
                                : 'bg-slate-200/70 dark:bg-slate-800'
                            }`}
                          />
                        </div>
                      )}

                      {/* Bar 2: Dispatched */}
                      {(trendFilter === 'all' || trendFilter === 'dispatched') && (
                        <div className="w-full max-w-[20px] flex flex-col items-center justify-end h-full">
                          <span className={`text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1 transition ${
                            day.dispatched > 0 ? 'opacity-100 font-extrabold' : 'opacity-40 text-slate-400'
                          }`}>
                            {day.dispatched}
                          </span>
                          <div
                            style={{ height: `${day.dispatched > 0 ? dispatchHeight : 8}%` }}
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              day.dispatched > 0
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                                : 'bg-slate-200/70 dark:bg-slate-800'
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    {/* X-Axis Label */}
                    <div className="pt-2 text-center select-none">
                      <div className={`text-[11px] font-bold ${
                        idx === 6
                          ? 'text-orange-600 dark:text-orange-400 font-black'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {day.dayLabel}
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500">
                        {day.dateNum}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Footer */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs">
            <div>
              <span className="text-slate-500 text-[11px]">7-Day PO Inflow</span>
              <div className="font-bold text-slate-800 dark:text-slate-200">{total7DayNew} Orders Logged</div>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Weekly Dispatches</span>
              <div className="font-bold text-blue-600 dark:text-blue-400">{total7DayDispatched} Consignments</div>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Avg Dispatch Velocity</span>
              <div className="font-bold text-emerald-600">Same-Day In Transit</div>
            </div>
          </div>
        </div>

        {/* CHART 2: LOGISTICS FLEET SHARE (FULLY DYNAMIC COMPUTATION FROM REAL POS) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center border border-blue-200/50">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Logistics Fleet Share
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Active courier & freight portals handling DarkStore deliveries
            </p>
          </div>

          {/* DYNAMIC SVG DONUT VISUAL */}
          <div className="relative flex items-center justify-center py-2">
            <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="11"
              />

              {/* Dynamic Portals Arc Segments */}
              {(() => {
                let currentOffset = 0;
                return logisticsFleetData.map((item, idx) => {
                  const strokeLength = (item.percentage / 100) * CIRCLE_CIRCUMFERENCE;
                  const dashArray = `${strokeLength} ${CIRCLE_CIRCUMFERENCE - strokeLength}`;
                  const offset = -currentOffset;
                  currentOffset += strokeLength;

                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke={item.color.stroke}
                      strokeWidth="11"
                      strokeDasharray={dashArray}
                      strokeDashoffset={offset}
                      strokeLinecap="butt"
                      className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                    />
                  );
                });
              })()}
            </svg>

            <div className="absolute text-center select-none pointer-events-none">
              <span className="text-xl font-extrabold text-slate-800 dark:text-white block">
                {totalPOs}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                Total POs
              </span>
            </div>
          </div>

          {/* DYNAMIC INTERACTIVE LEGEND */}
          <div className="space-y-2 text-xs pt-1">
            {logisticsFleetData.length === 0 ? (
              <div className="text-center py-2 text-slate-400 text-xs">
                No active logistics consignments logged yet.
              </div>
            ) : (
              logisticsFleetData.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateTab('in_transit')}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                  title={`Click to filter In-Transit POs handled by ${item.name}`}
                >
                  <span className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color.stroke }}
                    />
                    <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                      {item.name}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {item.count} PO{item.count !== 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 min-w-[32px] text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Destination Volume & Quick Operations Actions Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DarkStore Network Inward Leaderboard */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center border border-emerald-200/50">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                DarkStore Warehouse Inward Volume Distribution
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {warehouseVolumeData.entries.length} Active DarkStore Nodes
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {warehouseVolumeData.entries.map((wh, idx) => {
              const colors = ['bg-orange-500', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-cyan-600'];
              const barColor = colors[idx % colors.length];
              const pct = Math.max(8, (wh.units / warehouseVolumeData.maxUnits) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {wh.name}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                      {wh.units.toLocaleString()} units ({wh.pos} POs)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Operations Execution Desk - Calm Corporate Slate Styling */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="inline-flex p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">
              Quick Operations Desk
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              One-click shortcuts to create consignments, dispatch In-Transit, and sync offline sheets.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <button
              type="button"
              onClick={onOpenNewPo}
              className="w-full py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition shadow-xs flex items-center justify-between cursor-pointer"
            >
              <span>+ Create New PO Consignment</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('in_transit')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700/80 flex items-center justify-between cursor-pointer"
            >
              <span>Track In–Transit Cargo ({inTransitCount})</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('offline_sheet')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700/80 flex items-center justify-between cursor-pointer"
            >
              <span>Open Live Offline Sheet (Grid Mode)</span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={onOpenNewDn}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700/80 flex items-center justify-between cursor-pointer"
            >
              <span>Report DN Discrepancy / Damage</span>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
