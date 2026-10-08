import React, { useState, useEffect } from 'react';
import { PurchaseOrder, POItem, ItemMaster, POStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_WAREHOUSES } from '../lib/firebase';
import { 
  X, 
  Plus, 
  Trash2, 
  Lock, 
  Save, 
  Package, 
  Truck, 
  Calendar, 
  Building, 
  FileText, 
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface PoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (po: Partial<PurchaseOrder>) => Promise<void>;
  editingPo?: PurchaseOrder | null;
  itemsCatalog: ItemMaster[];
}

const LOGISTICS_PORTALS = [
  'Delhivery Logistics',
  'BlueDart Express',
  'Shadowfax Technologies',
  'Instamart Dedicated Fleet',
  'XpressBees',
  'Ecom Express',
  'DTDC Express',
  'Ekart Logistics',
  'Self Pickup / Vendor Transport'
];

export const PoModal: React.FC<PoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPo,
  itemsCatalog
}) => {
  const { userProfile, isAdmin, isActive } = useAuth();

  const isLocked = Boolean(
    editingPo && 
    (editingPo.pickupStatus === 'YES' || editingPo.status === 'In Transit') && 
    !isAdmin
  );

  const [poNumber, setPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [shipDate, setShipDate] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [so, setSo] = useState('');
  const [status, setStatus] = useState<POStatus>('New PO');
  const [noOfBoxes, setNoOfBoxes] = useState<number>(1);
  const [boxDimensions, setBoxDimensions] = useState('40 x 30 x 25 cm');
  const [logisticsPortal, setLogisticsPortal] = useState('Delhivery Logistics');
  const [pickupTrackingId, setPickupTrackingId] = useState('');
  const [puc, setPuc] = useState('');
  const [asn, setAsn] = useState('');
  const [clearBagNo, setClearBagNo] = useState('');
  const [comment, setComment] = useState('');
  const [pickupStatus, setPickupStatus] = useState<'YES' | 'NO'>('NO');

  // Multiple items
  const [items, setItems] = useState<POItem[]>([
    { itemId: '', itemName: '', qty: 1, unitPrice: 0, boxCount: 1, remark: '' }
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPo) {
      setPoNumber(editingPo.poNumber || '');
      setOrderDate(editingPo.orderDate || '');
      setWarehouseName(editingPo.warehouseName || '');
      setInvoiceNo(editingPo.invoiceNo || '');
      setShipDate(editingPo.shipDate || '');
      setAppointmentId(editingPo.appointmentId || '');
      setAppointmentDate(editingPo.appointmentDate || '');
      setExpiryDate(editingPo.expiryDate || '');
      setSo(editingPo.so || '');
      setStatus(editingPo.status || 'New PO');
      setNoOfBoxes(editingPo.noOfBoxes || 1);
      setBoxDimensions(editingPo.boxDimensions || '40 x 30 x 25 cm');
      setLogisticsPortal(editingPo.logisticsPortal || 'Delhivery Logistics');
      setPickupTrackingId(editingPo.pickupTrackingId || '');
      setPuc(editingPo.puc || '');
      setAsn(editingPo.asn || '');
      setClearBagNo(editingPo.clearBagNo || '');
      setComment(editingPo.comment || '');
      setPickupStatus(editingPo.pickupStatus || 'NO');
      setItems(editingPo.items && editingPo.items.length > 0 ? editingPo.items : [
        { itemId: '', itemName: '', qty: 1, unitPrice: 0, boxCount: 1, remark: '' }
      ]);
    } else {
      // Clean empty form for new PO creation (no default fake dummy data)
      setPoNumber('');
      const today = new Date().toISOString().split('T')[0];
      setOrderDate(today);
      setWarehouseName('');
      setInvoiceNo('');
      setShipDate('');
      setAppointmentId('');
      setAppointmentDate('');
      setExpiryDate('');
      setSo('');
      setStatus('New PO');
      setNoOfBoxes(1);
      setBoxDimensions('');
      setLogisticsPortal('Delhivery Logistics');
      setPickupTrackingId('');
      setPuc('');
      setAsn('');
      setClearBagNo('');
      setComment('');
      setPickupStatus('NO');
      
      // Clean blank item row
      setItems([{ itemId: '', itemName: '', qty: 1, unitPrice: 0, boxCount: 1, remark: '' }]);
    }
  }, [editingPo, isOpen, itemsCatalog]);

  const totalQty = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);

  // Handle Item ID change with automatic Item Name lookup!
  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'itemId') {
      const matched = itemsCatalog.find(
        (c) => c.itemId.toLowerCase().trim() === String(value).toLowerCase().trim()
      );
      if (matched) {
        updated[index].itemName = matched.itemName;
      }
    }

    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { itemId: '', itemName: '', qty: 1, unitPrice: 0, boxCount: 1, remark: '' }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      alert('A Purchase Order must contain at least one item.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handlePickupStatusChange = (val: 'YES' | 'NO') => {
    setPickupStatus(val);
    if (val === 'YES') {
      setStatus('In Transit');
    } else if (status === 'In Transit') {
      setStatus('New PO');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive) {
      setError('Your account is currently inactive. Please contact your system administrator.');
      return;
    }
    if (isLocked) {
      setError('This PO is In Transit and locked. Only Admins can modify.');
      return;
    }
    if (!poNumber.trim()) {
      setError('PO Number is required.');
      return;
    }
    if (items.some((it) => !it.itemId || !it.itemName || it.qty <= 0)) {
      setError('Please check all items: Item ID, Item Name, and Quantity > 0 are mandatory.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: Partial<PurchaseOrder> = {
        poNumber: poNumber.trim(),
        orderDate,
        warehouseName,
        items,
        totalQty,
        invoiceNo: invoiceNo.trim(),
        shipDate,
        appointmentId: appointmentId.trim(),
        appointmentDate,
        expiryDate,
        so: so.trim(),
        status: pickupStatus === 'YES' ? 'In Transit' : status,
        noOfBoxes: Number(noOfBoxes) || 1,
        boxDimensions: boxDimensions.trim(),
        logisticsPortal,
        pickupTrackingId: pickupTrackingId.trim(),
        puc: puc.trim(),
        asn: asn.trim(),
        clearBagNo: clearBagNo.trim(),
        comment: comment.trim(),
        pickupStatus,
        hasDN: editingPo?.hasDN || false,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.uid,
        updatedByName: userProfile?.displayName,
        updatedByEmpId: userProfile?.employeeId,
      };

      if (!editingPo) {
        payload.createdAt = new Date().toISOString();
        payload.createdBy = userProfile?.uid;
        payload.createdByName = userProfile?.displayName;
        payload.createdByEmpId = userProfile?.employeeId;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save Purchase Order.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 transition-all flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl">
                  {editingPo ? `Edit PO: ${editingPo.poNumber}` : 'Create New Instamart PO'}
                </h3>
                {isLocked && (
                  <span className="px-2 py-0.5 text-xs bg-rose-500/80 text-white rounded-md font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked (In Transit)
                  </span>
                )}
              </div>
              <p className="text-xs text-orange-100">
                Backoffice PO Entry & Logistics Dispatch Tracker
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

        {/* Lock warning banner for employees */}
        {isLocked && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900 px-5 py-3 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Read-Only Protection:</strong> This PO has Pickup Status = YES and is "In Transit". As requested, employees cannot edit dispatched PO records. Only Admins can modify.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: PO & Warehouse Basics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-1.5">
              <Building className="w-4 h-4" /> 1. PO Identity & Destination
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  PO Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  placeholder="PO-INST-9021"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Order Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={isLocked}
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Warehouse Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="warehouses-list"
                    disabled={isLocked}
                    placeholder="Select or enter warehouse name"
                    value={warehouseName}
                    onChange={(e) => setWarehouseName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                  />
                  <datalist id="warehouses-list">
                    {DEFAULT_WAREHOUSES.map((wh) => (
                      <option key={wh} value={wh} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Items List (Multiple Items with Auto Name Lookup) */}
          <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> 2. Multiple SKU Items (Auto-Lookup by Item ID)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Select Item ID to automatically populate Item Name. Total Qty is automatically calculated.
                </p>
              </div>
              {!isLocked && (
                <button
                  type="button"
                  onClick={addItemRow}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end shadow-xs"
                >
                  {/* Item ID */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      Item ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      list={`items-catalog-${index}`}
                      required
                      disabled={isLocked}
                      placeholder="e.g. INST-SKU-1001"
                      value={item.itemId}
                      onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none uppercase font-mono disabled:opacity-60"
                    />
                    <datalist id={`items-catalog-${index}`}>
                      {itemsCatalog.map((cat) => (
                        <option key={cat.itemId} value={cat.itemId}>
                          {cat.itemName}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* Item Name (Auto Populated) */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isLocked}
                      placeholder="Automatic item name"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none font-medium text-slate-800 dark:text-zinc-200 disabled:opacity-60"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      Qty <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      disabled={isLocked}
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-center font-bold disabled:opacity-60"
                    />
                  </div>

                  {/* Boxes */}
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      Boxes
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={isLocked}
                      value={item.boxCount || 1}
                      onChange={(e) => handleItemChange(index, 'boxCount', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-center disabled:opacity-60"
                    />
                  </div>

                  {/* Delete Row button */}
                  <div className="sm:col-span-1 flex justify-end">
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        title="Remove item"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Qty Pill */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-700">
              <span className="text-xs text-slate-600 dark:text-zinc-400">
                Total Items in PO: <strong>{items.length}</strong>
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 rounded-lg">
                <span className="text-xs font-semibold text-orange-900 dark:text-orange-200">Total PO Quantity:</span>
                <span className="text-sm font-black text-orange-600 dark:text-orange-400">{totalQty} units</span>
              </div>
            </div>
          </div>

          {/* Section 3: Dispatch, Appointment & Logistics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-1.5">
              <Truck className="w-4 h-4" /> 3. Invoice, Appointments & Logistics Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Invoice No.
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="INV-9021"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Ship Date
                </label>
                <input
                  type="date"
                  disabled={isLocked}
                  value={shipDate}
                  onChange={(e) => setShipDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Appointment ID
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="APT-4421"
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  disabled={isLocked}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  SO (Sales Order)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="SO-8821"
                  value={so}
                  onChange={(e) => setSo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  No. of Boxes
                </label>
                <input
                  type="number"
                  min="1"
                  disabled={isLocked}
                  value={noOfBoxes}
                  onChange={(e) => setNoOfBoxes(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Box Dimensions
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="40 x 30 x 25 cm"
                  value={boxDimensions}
                  onChange={(e) => setBoxDimensions(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Logistics Portal
                </label>
                <select
                  disabled={isLocked}
                  value={logisticsPortal}
                  onChange={(e) => setLogisticsPortal(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                >
                  {LOGISTICS_PORTALS.map((portal) => (
                    <option key={portal} value={portal}>
                      {portal}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Pickup Tracking ID
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="TRK-DEL-8941"
                  value={pickupTrackingId}
                  onChange={(e) => setPickupTrackingId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  PUC (Pickup Confirmation)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="PUC-881"
                  value={puc}
                  onChange={(e) => setPuc(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  ASN (Adv. Ship Notice)
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="ASN-99120"
                  value={asn}
                  onChange={(e) => setAsn(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Clear Bag No.
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="CBG-551"
                  value={clearBagNo}
                  onChange={(e) => setClearBagNo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Status & Pickup Status (Crucial Trigger) */}
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> 4. Pickup Status & Lifecycle Progression
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                  Pickup Status <span className="text-rose-500">* (YES / NO)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                    pickupStatus === 'YES'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700'
                  } ${isLocked ? 'pointer-events-none opacity-60' : ''}`}>
                    <input
                      type="radio"
                      name="pickupStatus"
                      checked={pickupStatus === 'YES'}
                      onChange={() => handlePickupStatusChange('YES')}
                      className="sr-only"
                    />
                    ✓ YES (Shifts to In Transit)
                  </label>

                  <label className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                    pickupStatus === 'NO'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700'
                  } ${isLocked ? 'pointer-events-none opacity-60' : ''}`}>
                    <input
                      type="radio"
                      name="pickupStatus"
                      checked={pickupStatus === 'NO'}
                      onChange={() => handlePickupStatusChange('NO')}
                      className="sr-only"
                    />
                    ✕ NO (Pending Pickup)
                  </label>
                </div>
                {pickupStatus === 'YES' && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> This PO will automatically shift to the "In Transit" tab.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                  Current PO Status
                </label>
                <select
                  disabled={isLocked || pickupStatus === 'YES'}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as POStatus)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
                >
                  <option value="New PO">New PO (Backoffice Created)</option>
                  <option value="In Transit">In Transit (Dispatched)</option>
                  <option value="Inwarded">Inwarded (Warehouse Received)</option>
                  <option value="GRN Completed">GRN Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Internal Remarks / Comment
              </label>
              <textarea
                rows={2}
                disabled={isLocked}
                placeholder="Logistics notes, driver contact or special handling instructions..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Audit stamps */}
          {editingPo && (
            <div className="p-3 bg-slate-100 dark:bg-zinc-800/60 rounded-xl text-[11px] text-slate-600 dark:text-zinc-400 flex flex-wrap gap-4 justify-between border border-slate-200 dark:border-zinc-700">
              <div>
                Created by: <strong className="text-slate-800 dark:text-zinc-200">{editingPo.createdByName || 'System'} ({editingPo.createdByEmpId || 'N/A'})</strong> on {new Date(editingPo.createdAt).toLocaleString()}
              </div>
              {editingPo.updatedByName && (
                <div>
                  Last updated by: <strong className="text-slate-800 dark:text-zinc-200">{editingPo.updatedByName} ({editingPo.updatedByEmpId})</strong> on {new Date(editingPo.updatedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            {!isLocked && (
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition flex items-center gap-2"
              >
                {saving ? (
                  <span className="animate-spin text-sm">⏳</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> {editingPo ? 'Update PO Details' : 'Create Purchase Order'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
