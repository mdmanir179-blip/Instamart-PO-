import React, { useState, useEffect } from 'react';
import { DNRecord, PurchaseOrder, ItemMaster } from '../types';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_WAREHOUSES } from '../lib/firebase';
import { 
  X, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  Truck, 
  Building, 
  UserCheck, 
  Link,
  Download,
  Trash2
} from 'lucide-react';

interface DNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dn: Partial<DNRecord>) => Promise<void>;
  editingDn?: DNRecord | null;
  poList: PurchaseOrder[];
  itemsCatalog: ItemMaster[];
}

export const DNModal: React.FC<DNModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDn,
  poList,
  itemsCatalog
}) => {
  const { userProfile, isAdmin, isWarehouse, isBackoffice, isActive } = useAuth();

  const [dnDate, setDnDate] = useState('');
  const [dnNumber, setDnNumber] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [parentPoNumber, setParentPoNumber] = useState('');
  const [parentPoDate, setParentPoDate] = useState('');
  const [parentSo, setParentSo] = useState('');
  const [skuId, setSkuId] = useState('');
  const [itemName, setItemName] = useState('');
  const [dnQty, setDnQty] = useState<number>(1);
  const [whPocName, setWhPocName] = useState('');
  const [whPocContact, setWhPocContact] = useState('');
  const [lrNo, setLrNo] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Accepted' | 'Dispatched' | 'Closed'>('Pending');

  // File upload state
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);
  const [fileData, setFileData] = useState<string | undefined>(undefined);
  const [fileType, setFileType] = useState<string | undefined>(undefined);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingDn) {
      setDnDate(editingDn.dnDate || '');
      setDnNumber(editingDn.dnNumber || '');
      setFacilityName(editingDn.facilityName || '');
      setParentPoNumber(editingDn.parentPoNumber || '');
      setParentPoDate(editingDn.parentPoDate || '');
      setParentSo(editingDn.parentSo || '');
      setSkuId(editingDn.skuId || '');
      setItemName(editingDn.itemName || '');
      setDnQty(editingDn.dnQty || 1);
      setWhPocName(editingDn.whPocName || '');
      setWhPocContact(editingDn.whPocContact || '');
      setLrNo(editingDn.lrNo || '');
      setTrackingNo(editingDn.trackingNo || '');
      setStatus(editingDn.status || 'Pending');
      setFileName(editingDn.fileName);
      setFileSize(editingDn.fileSize);
      setFileData(editingDn.fileData);
      setFileType(editingDn.fileType);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const rand = Math.floor(1000 + Math.random() * 9000);
      setDnDate(today);
      setDnNumber(`DN-INST-${rand}`);
      setFacilityName(DEFAULT_WAREHOUSES[0]);
      setParentPoNumber('');
      setParentPoDate(today);
      setParentSo('');
      setSkuId(itemsCatalog[0]?.itemId || '');
      setItemName(itemsCatalog[0]?.itemName || '');
      setDnQty(1);
      setWhPocName(userProfile?.displayName || 'Rajesh WH Manager');
      setWhPocContact('+91 98765 43210');
      setLrNo(`LR-${rand}`);
      setTrackingNo('');
      setStatus('Pending');
      setFileName(undefined);
      setFileSize(undefined);
      setFileData(undefined);
      setFileType(undefined);
    }
  }, [editingDn, isOpen, itemsCatalog, userProfile]);

  // When Parent PO is picked, auto-populate PO Date and SO
  const handleParentPoChange = (poNum: string) => {
    setParentPoNumber(poNum);
    const matched = poList.find((p) => p.poNumber.toLowerCase() === poNum.toLowerCase());
    if (matched) {
      setParentPoDate(matched.orderDate || '');
      setParentSo(matched.so || '');
      setFacilityName(matched.warehouseName || facilityName);
      if (matched.items && matched.items.length > 0) {
        setSkuId(matched.items[0].itemId);
        setItemName(matched.items[0].itemName);
      }
    }
  };

  // When SKU is changed, auto populate item name
  const handleSkuChange = (newSku: string) => {
    setSkuId(newSku);
    const matched = itemsCatalog.find((c) => c.itemId.toLowerCase() === newSku.toLowerCase());
    if (matched) {
      setItemName(matched.itemName);
    }
  };

  // Handle File Upload: max 10MB, PDF or Spreadsheet
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 10 MB = 10 * 1024 * 1024 bytes
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('File exceeds maximum allowed size of 10 MB. Please upload a smaller document.');
      return;
    }

    const validExtensions = ['.pdf', '.xlsx', '.xls', '.csv'];
    const nameLower = file.name.toLowerCase();
    const isValidType = validExtensions.some((ext) => nameLower.endsWith(ext));

    if (!isValidType) {
      setError('Unsupported file type. Please upload a PDF or spreadsheet (.xlsx, .xls, .csv).');
      return;
    }

    setError(null);
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFileName(undefined);
    setFileSize(undefined);
    setFileData(undefined);
    setFileType(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActive) {
      setError('Your account is currently inactive.');
      return;
    }
    if (!dnNumber.trim() || !facilityName.trim() || !parentPoNumber.trim() || !skuId.trim()) {
      setError('DN Number, Facility Name, Parent PO, and SKU ID are mandatory.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: Partial<DNRecord> = {
        dnDate,
        dnNumber: dnNumber.trim(),
        facilityName: facilityName.trim(),
        parentPoNumber: parentPoNumber.trim(),
        parentPoDate,
        parentSo: parentSo.trim(),
        skuId: skuId.trim(),
        itemName: itemName.trim(),
        dnQty: Number(dnQty) || 1,
        whPocName: whPocName.trim(),
        whPocContact: whPocContact.trim(),
        lrNo: lrNo.trim(),
        trackingNo: trackingNo.trim(),
        status,
        fileName,
        fileSize,
        fileData,
        fileType,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.uid,
        updatedByName: userProfile?.displayName,
        updatedByEmpId: userProfile?.employeeId,
      };

      if (status === 'Accepted' && (!editingDn || editingDn.status !== 'Accepted')) {
        payload.acceptedAt = new Date().toISOString();
        payload.acceptedBy = `${userProfile?.displayName} (${userProfile?.employeeId})`;
      }

      if (!editingDn) {
        payload.createdAt = new Date().toISOString();
        payload.createdBy = userProfile?.uid;
        payload.createdByName = userProfile?.displayName;
        payload.createdByEmpId = userProfile?.employeeId;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save DN Record.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 transition-all flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl">
                {editingDn ? `Edit DN: ${editingDn.dnNumber}` : 'Instamart DN Tracker - New Entry'}
              </h3>
              <p className="text-xs text-rose-100">
                Discrepancy / Debit Note Tracking & Warehouse Receipt
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: DN Identifiers & Warehouse */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                DN Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dnDate}
                onChange={(e) => setDnDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                DN Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="DN-INST-4012"
                value={dnNumber}
                onChange={(e) => setDnNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Facility Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="facility-options"
                placeholder="Warehouse or Hub"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <datalist id="facility-options">
                {DEFAULT_WAREHOUSES.map((wh) => (
                  <option key={wh} value={wh} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Section 2: Parent PO Details */}
          <div className="bg-slate-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5" /> Parent PO Linkage
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Parent PO Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="po-number-options"
                  placeholder="Select or enter Parent PO"
                  value={parentPoNumber}
                  onChange={(e) => handleParentPoChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-mono"
                />
                <datalist id="po-number-options">
                  {poList.map((po) => (
                    <option key={po.id} value={po.poNumber}>
                      {po.warehouseName} ({po.status})
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Parent PO Date
                </label>
                <input
                  type="date"
                  value={parentPoDate}
                  onChange={(e) => setParentPoDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Parent SO (Sales Order)
                </label>
                <input
                  type="text"
                  placeholder="SO-8821"
                  value={parentSo}
                  onChange={(e) => setParentSo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: SKU & DN Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                DN SKU ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="sku-catalog-list"
                placeholder="e.g. INST-SKU-1001"
                value={skuId}
                onChange={(e) => handleSkuChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none uppercase font-mono"
              />
              <datalist id="sku-catalog-list">
                {itemsCatalog.map((c) => (
                  <option key={c.itemId} value={c.itemId}>
                    {c.itemName}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Auto-populated or entered item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                DN QTY <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={dnQty}
                onChange={(e) => setDnQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-bold text-center text-rose-600 dark:text-rose-400"
              />
            </div>
          </div>

          {/* Section 4: POC & Transport */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                WH POC Name
              </label>
              <input
                type="text"
                placeholder="Sanjay Das"
                value={whPocName}
                onChange={(e) => setWhPocName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                WH POC Contact / Phone
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={whPocContact}
                onChange={(e) => setWhPocContact(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                LR No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="LR-88219"
                value={lrNo}
                onChange={(e) => setLrNo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Tracking Number
              </label>
              <input
                type="text"
                placeholder="WH-TRK-771"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Section 5: Upload DN Report (PDF or spreadsheet max 10MB) */}
          <div className="p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200 dark:border-zinc-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-rose-500" /> Upload DN Report (Supported: PDF or spreadsheet. Max 10 MB)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
              Attach Debit Note invoice, discrepancy photo/PDF report or Excel audit sheet.
            </p>

            {fileName ? (
              <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    {fileName.endsWith('.pdf') ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {fileName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {fileSize ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : ''} • {fileType}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {fileData && (
                    <a
                      href={fileData}
                      download={fileName}
                      className="p-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white dark:bg-zinc-900 transition">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Click to select file or drag & drop here
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                  1 supported file: PDF or spreadsheet (.xlsx, .xls, .csv). Maximum size 10 MB.
                </span>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {/* Section 6: Warehouse Acceptance & Status */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                DN Processing Status
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-300">
                Warehouse accepts and updates tracking number for delivery back.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none"
              >
                <option value="Pending">Pending Review</option>
                <option value="Accepted">Accepted by WH</option>
                <option value="Dispatched">Dispatched / In Transit</option>
                <option value="Closed">Closed & Reconciled</option>
              </select>

              {(isWarehouse || isAdmin) && status !== 'Accepted' && (
                <button
                  type="button"
                  onClick={() => setStatus('Accepted')}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Accept DN (WH)
                </button>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition flex items-center gap-2"
            >
              {saving ? (
                <span className="animate-spin text-sm">⏳</span>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {editingDn ? 'Update DN Details' : 'Save DN Record'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
