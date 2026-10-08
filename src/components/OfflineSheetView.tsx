import React, { useState } from 'react';
import { PurchaseOrder, DNRecord } from '../types';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw,
  Search,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { exportToExcel, exportToCSV, copyForGoogleSheets } from '../utils/exportUtils';

interface OfflineSheetViewProps {
  purchaseOrders: PurchaseOrder[];
  dnRecords: DNRecord[];
  onUpdatePo: (po: PurchaseOrder) => Promise<void>;
  onCreatePo: (po: Partial<PurchaseOrder>) => Promise<void>;
  onUpdateDn: (dn: DNRecord) => Promise<void>;
  onCreateDn: (dn: Partial<DNRecord>) => Promise<void>;
  canEdit: boolean;
}

export const OfflineSheetView: React.FC<OfflineSheetViewProps> = ({
  purchaseOrders,
  dnRecords,
  onUpdatePo,
  onCreatePo,
  onUpdateDn,
  onCreateDn,
  canEdit
}) => {
  const [sheetMode, setSheetMode] = useState<'po' | 'dn'>('po');
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  // PO columns
  const poColumns = [
    { key: 'poNumber', label: 'PO Number', width: 'w-36' },
    { key: 'orderDate', label: 'Order Date', width: 'w-28' },
    { key: 'warehouseName', label: 'Warehouse Name', width: 'w-48' },
    { key: 'totalQty', label: 'Total Qty', width: 'w-24' },
    { key: 'noOfBoxes', label: 'Boxes', width: 'w-20' },
    { key: 'pickupStatus', label: 'Pickup (YES/NO)', width: 'w-28' },
    { key: 'status', label: 'Status', width: 'w-32' },
    { key: 'invoiceNo', label: 'Invoice No', width: 'w-28' },
    { key: 'so', label: 'SO No', width: 'w-28' },
    { key: 'logisticsPortal', label: 'Logistics', width: 'w-36' },
    { key: 'pickupTrackingId', label: 'Tracking ID', width: 'w-36' },
    { key: 'grnNumber', label: 'GRN Number', width: 'w-32' },
    { key: 'createdByName', label: 'Created By', width: 'w-32' },
  ];

  // DN columns
  const dnColumns = [
    { key: 'dnNumber', label: 'DN Number', width: 'w-32' },
    { key: 'dnDate', label: 'DN Date', width: 'w-28' },
    { key: 'facilityName', label: 'Facility Name', width: 'w-44' },
    { key: 'parentPoNumber', label: 'Parent PO', width: 'w-36' },
    { key: 'skuId', label: 'SKU ID', width: 'w-32' },
    { key: 'itemName', label: 'Item Name', width: 'w-48' },
    { key: 'dnQty', label: 'DN Qty', width: 'w-24' },
    { key: 'whPocName', label: 'WH POC', width: 'w-32' },
    { key: 'whPocContact', label: 'Contact', width: 'w-32' },
    { key: 'lrNo', label: 'LR No', width: 'w-28' },
    { key: 'trackingNo', label: 'Tracking No', width: 'w-32' },
    { key: 'status', label: 'Status', width: 'w-28' },
  ];

  const handleCellChange = async (record: any, key: string, value: any) => {
    if (!canEdit) return;
    if (sheetMode === 'po') {
      const updated = { ...record, [key]: value };
      if (key === 'pickupStatus' && value === 'YES') {
        updated.status = 'In Transit';
      }
      await onUpdatePo(updated);
    } else {
      const updated = { ...record, [key]: value };
      await onUpdateDn(updated);
    }
  };

  const handleAddNewRow = async () => {
    if (!canEdit) return;
    const rand = Math.floor(1000 + Math.random() * 9000);
    const today = new Date().toISOString().split('T')[0];

    if (sheetMode === 'po') {
      await onCreatePo({
        poNumber: `PO-INST-${rand}`,
        orderDate: today,
        warehouseName: 'Instamart Kolkata DarkStore-01',
        items: [{ itemId: 'INST-SKU-1001', itemName: 'Amul Taaza Milk 1L', qty: 10, boxCount: 1 }],
        totalQty: 10,
        noOfBoxes: 1,
        boxDimensions: '40 x 30 x 20 cm',
        logisticsPortal: 'Delhivery Logistics',
        pickupTrackingId: `TRK-${rand}`,
        invoiceNo: `INV-${rand}`,
        so: `SO-${rand}`,
        appointmentId: `APT-${rand}`,
        appointmentDate: today,
        shipDate: today,
        puc: 'PUC-01',
        asn: 'ASN-01',
        clearBagNo: 'CBG-01',
        comment: '',
        pickupStatus: 'NO',
        status: 'New PO',
      });
    } else {
      await onCreateDn({
        dnNumber: `DN-INST-${rand}`,
        dnDate: today,
        facilityName: 'Instamart Kolkata DarkStore-01',
        parentPoNumber: `PO-INST-${rand}`,
        parentSo: `SO-${rand}`,
        skuId: 'INST-SKU-1001',
        itemName: 'Amul Taaza Milk 1L',
        dnQty: 1,
        whPocName: 'WH Manager',
        whPocContact: '+91 9876543210',
        lrNo: `LR-${rand}`,
        trackingNo: '',
        status: 'Pending',
      });
    }
  };

  // Import from Excel or CSV
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          alert('Spreadsheet is empty.');
          return;
        }

        let importedCount = 0;
        for (const row of json) {
          if (sheetMode === 'po') {
            await onCreatePo({
              poNumber: row['PO Number'] || row['poNumber'] || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
              orderDate: row['Order Date'] || row['orderDate'] || new Date().toISOString().split('T')[0],
              warehouseName: row['Warehouse Name'] || row['warehouseName'] || 'Instamart WH',
              totalQty: Number(row['Total Qty'] || row['totalQty']) || 10,
              noOfBoxes: Number(row['No of Boxes'] || row['noOfBoxes']) || 1,
              pickupStatus: (row['Pickup Status'] || row['pickupStatus'] || 'NO').toUpperCase() === 'YES' ? 'YES' : 'NO',
              status: row['Status'] || row['status'] || 'New PO',
              invoiceNo: row['Invoice No'] || row['invoiceNo'] || '',
              so: row['SO'] || row['so'] || '',
              logisticsPortal: row['Logistics Portal'] || row['logisticsPortal'] || 'Delhivery',
              pickupTrackingId: row['Tracking ID'] || row['pickupTrackingId'] || '',
              boxDimensions: '40x30x20 cm',
              appointmentId: 'APT-01',
              appointmentDate: new Date().toISOString().split('T')[0],
              shipDate: new Date().toISOString().split('T')[0],
              puc: 'PUC-01',
              asn: 'ASN-01',
              clearBagNo: 'CBG-01',
              comment: 'Imported from spreadsheet',
              items: [{ itemId: 'INST-SKU-1001', itemName: 'Imported Item', qty: 10 }]
            });
          } else {
            await onCreateDn({
              dnNumber: row['DN Number'] || row['dnNumber'] || `DN-${Math.floor(1000 + Math.random() * 9000)}`,
              dnDate: row['DN Date'] || row['dnDate'] || new Date().toISOString().split('T')[0],
              facilityName: row['Facility Name'] || row['facilityName'] || 'Instamart WH',
              parentPoNumber: row['Parent PO Number'] || row['parentPoNumber'] || '',
              skuId: row['SKU ID'] || row['skuId'] || 'INST-SKU-1001',
              itemName: row['Item Name'] || row['itemName'] || 'General Item',
              dnQty: Number(row['DN Qty'] || row['dnQty']) || 1,
              whPocName: row['WH POC Name'] || row['whPocName'] || 'WH Lead',
              whPocContact: row['Contact'] || row['whPocContact'] || '',
              lrNo: row['LR No'] || row['lrNo'] || 'LR-001',
              trackingNo: row['Tracking No'] || row['trackingNo'] || '',
              status: row['Status'] || row['status'] || 'Pending',
            });
          }
          importedCount++;
        }
        alert(`Successfully imported ${importedCount} rows into offline sheet!`);
      } catch (err: any) {
        alert(`Error importing file: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const currentList = sheetMode === 'po' ? purchaseOrders : dnRecords;
  const columns = sheetMode === 'po' ? poColumns : dnColumns;

  const filteredList = currentList.filter((item: any) => {
    return Object.values(item).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCopySheets = async () => {
    const headers = columns.map(c => c.label);
    const rows = filteredList.map((item: any) => columns.map(c => item[c.key] ?? ''));
    const ok = await copyForGoogleSheets(headers, rows);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-4 rounded-2xl text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
              Instamart Live Offline Sheet
              <span className="text-[10px] uppercase font-bold bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-400/30">
                100% Offline Capable
              </span>
            </h3>
            <p className="text-xs text-emerald-100">
              Interactive Grid View • Edit Cells Directly • Import & Export • Google Sheets Ready
            </p>
          </div>
        </div>

        {/* Sheet tab toggle */}
        <div className="flex bg-emerald-900/60 p-1 rounded-xl border border-emerald-600/40">
          <button
            type="button"
            onClick={() => setSheetMode('po')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              sheetMode === 'po'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-emerald-100 hover:text-white'
            }`}
          >
            PO Sheet ({purchaseOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setSheetMode('dn')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              sheetMode === 'dn'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-emerald-100 hover:text-white'
            }`}
          >
            DN Tracker Sheet ({dnRecords.length})
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search in sheet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
            {filteredList.length} rows
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Row */}
          {canEdit && (
            <button
              type="button"
              onClick={handleAddNewRow}
              className="px-3 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          )}

          {/* Import Excel */}
          <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg transition border border-slate-200 dark:border-zinc-700 flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            Import File
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportFile}
              className="sr-only"
            />
          </label>

          {/* Copy for Google Sheets */}
          <button
            type="button"
            onClick={handleCopySheets}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1"
            title="Copy for pasting directly into Google Sheets (Ctrl+V)"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied for Sheets!' : 'Copy for Google Sheets'}
          </button>

          {/* Download Excel */}
          <button
            type="button"
            onClick={() => exportToExcel(filteredList, `Instamart_${sheetMode.toUpperCase()}_Sheet`)}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Download Excel
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            {/* Headers with Excel column style */}
            <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 sticky top-0 z-10 border-b border-slate-300 dark:border-zinc-700 font-bold">
              <tr>
                <th className="w-12 py-2 px-2 text-center bg-slate-200 dark:bg-zinc-700 text-slate-500 font-mono text-[10px] border-r border-slate-300 dark:border-zinc-600">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-2 px-3 border-r border-slate-200 dark:border-zinc-700 whitespace-nowrap ${col.width}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 font-mono">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400">
                    No data in sheet. Click "Add Row" or "Import File".
                  </td>
                </tr>
              ) : (
                filteredList.map((row: any, idx: number) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/50">
                    <td className="py-1.5 px-2 text-center bg-slate-50 dark:bg-zinc-800/40 text-slate-400 font-mono text-[10px] border-r border-slate-200 dark:border-zinc-700 select-none">
                      {idx + 1}
                    </td>
                    {columns.map((col) => {
                      const val = row[col.key] ?? '';
                      const isPickup = col.key === 'pickupStatus';
                      const isStatus = col.key === 'status';

                      return (
                        <td
                          key={col.key}
                          className="py-1 px-2 border-r border-slate-100 dark:border-zinc-800"
                        >
                          {isPickup ? (
                            <select
                              value={val || 'NO'}
                              disabled={!canEdit}
                              onChange={(e) => handleCellChange(row, col.key, e.target.value)}
                              className={`w-full py-1 px-1.5 text-xs font-bold rounded border outline-none ${
                                val === 'YES' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                  : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              <option value="YES">YES</option>
                              <option value="NO">NO</option>
                            </select>
                          ) : isStatus ? (
                            <select
                              value={val || 'New PO'}
                              disabled={!canEdit}
                              onChange={(e) => handleCellChange(row, col.key, e.target.value)}
                              className="w-full py-1 px-1 text-xs font-semibold rounded bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 outline-none"
                            >
                              <option value="New PO">New PO</option>
                              <option value="In Transit">In Transit</option>
                              <option value="Inwarded">Inwarded</option>
                              <option value="GRN Completed">GRN Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={val}
                              disabled={!canEdit}
                              onChange={(e) => handleCellChange(row, col.key, e.target.value)}
                              className="w-full py-1 px-1.5 text-xs bg-transparent hover:bg-amber-50/50 dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:ring-1 focus:ring-emerald-500 rounded outline-none border border-transparent focus:border-emerald-500"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
