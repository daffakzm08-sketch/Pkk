import React, { useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
  HelpCircle,
  Info,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const SettingsAndExportView: React.FC = () => {
  const {
    exportToJSON,
    exportToCSV,
    importFromJSON,
    resetToDefaultData,
    clearAllData,
    transactions,
    wallets,
  } = useFinance();

  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importFromJSON(text);
        if (success) {
          setImportStatus('Data berhasil dipulihkan!');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          alert('Format file cadangan tidak valid.');
        }
      } catch {
        alert('Gagal membaca file.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Muat ulang data contoh? Data yang Anda buat akan digantikan dengan data demo simulasi.')) {
      resetToDefaultData();
      alert('Data demo berhasil dimuat!');
    }
  };

  const handleClear = () => {
    if (confirm('Peringatan: Kosongkan seluruh data transaksi dan anggaran? Tindakan ini tidak dapat dibatalkan.')) {
      clearAllData();
      alert('Data berhasil dikosongkan.');
    }
  };

  return (
    <div id="view-settings" className="space-y-4 pb-20">
      {/* 1. Ekspor & Cadangan Data */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Cadangan & Ekspor Data
        </h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Data Anda disimpan secara lokal di browser. Ekspor berkala untuk mengamankan data keuangan Anda.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            id="btn-export-csv"
            onClick={exportToCSV}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 text-slate-700" />
            <span>Ekspor Excel / CSV</span>
          </button>

          <button
            id="btn-export-json"
            onClick={exportToJSON}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-colors"
          >
            <FileCode className="w-5 h-5 text-slate-700" />
            <span>Backup JSON</span>
          </button>
        </div>

        {/* Import JSON file */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Pulihkan / Impor Data dari File JSON
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />
          {importStatus && (
            <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {importStatus}
            </p>
          )}
        </div>
      </div>

      {/* 2. Aturan Finansial 50/30/20 Info */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-widest">
          <HelpCircle className="w-4 h-4 text-slate-700" />
          <span>Panduan Pengelolaan 50/30/20</span>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Metode pembagian gaji bulanan yang terbukti efektif untuk menjaga stabilitas finansial:
        </p>
        <div className="space-y-1.5 text-xs text-slate-700">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span>🔹 <b>50% Kebutuhan Pokok</b> (Makan, Tagihan, Transport)</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span>🔹 <b>30% Keinginan & Gaya Hidup</b> (Hiburan, Belanja, Hobi)</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span>🔹 <b>20% Tabungan & Investasi</b> (Dana Darurat, Tabungan)</span>
          </div>
        </div>
      </div>

      {/* 3. Pengaturan Data Aplikasi */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Kelola Database
        </h3>

        <div className="space-y-2">
          <button
            onClick={handleReset}
            className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-700" />
              <span>Muat Ulang Data Contoh (Demo)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={handleClear}
            className="w-full p-3.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100 border border-rose-100 text-rose-700 font-bold text-xs flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Kosongkan Semua Data Transaksi</span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </div>

      {/* App Info Footer */}
      <div className="text-center text-xs text-slate-400 py-2">
        <p className="font-semibold text-slate-500">Rekap Keuangan v1.0</p>
        <p className="text-[11px]">Navigasi Bawah • Desain Minimalis • Format IDR</p>
      </div>
    </div>
  );
};
