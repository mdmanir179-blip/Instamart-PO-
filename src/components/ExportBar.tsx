import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  TableProperties,
  Share2
} from 'lucide-react';
import { exportToExcel, exportToCSV, exportToPDF, copyForGoogleSheets } from '../utils/exportUtils';

interface ExportBarProps {
  title: string;
  filename: string;
  data: Record<string, any>[];
  headers: string[];
  pdfRows: (string | number)[][];
  subtitle?: string;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  title,
  filename,
  data,
  headers,
  pdfRows,
  subtitle
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyGoogleSheets = async () => {
    const success = await copyForGoogleSheets(headers, pdfRows);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/70 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 rounded-xl backdrop-blur-md">
      <div className="flex items-center gap-2">
        <TableProperties className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Export / Sheets Sync ({data.length} records):
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Copy for Google Sheets */}
        <button
          type="button"
          onClick={handleCopyGoogleSheets}
          title="Copies table data in Google Sheets friendly format. Open Google Sheets and press Ctrl+V"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition shadow-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied for Sheets!' : 'Google Sheets Sync'}
        </button>

        {/* Excel XLSX */}
        <button
          type="button"
          onClick={() => exportToExcel(data, filename, title)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Excel (.xlsx)
        </button>

        {/* CSV */}
        <button
          type="button"
          onClick={() => exportToCSV(data, filename)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>

        {/* PDF */}
        <button
          type="button"
          onClick={() => exportToPDF(title, headers, pdfRows, filename, subtitle)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
        >
          <FileText className="w-3.5 h-3.5" />
          PDF Report
        </button>
      </div>
    </div>
  );
};
