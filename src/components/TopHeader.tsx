import React, { useState } from 'react';
import {
  Wallet2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Download,
  RotateCcw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { getIndonesianMonthName, parseMonthKey } from '../utils/formatters';

interface TopHeaderProps {
  onOpenSettings?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenSettings }) => {
  const {
    activeMonth,
    setActiveMonth,
    hideBalance,
    toggleHideBalance,
    setActiveTab,
    exportToCSV,
  } = useFinance();

  const { year, monthIndex } = parseMonthKey(activeMonth);

  const handlePrevMonth = () => {
    let newMonth = monthIndex - 1;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    const formatted = `${newYear}-${String(newMonth + 1).padStart(2, '0')}`;
    setActiveMonth(formatted);
  };

  const handleNextMonth = () => {
    let newMonth = monthIndex + 1;
    let newYear = year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    const formatted = `${newYear}-${String(newMonth + 1).padStart(2, '0')}`;
    setActiveMonth(formatted);
  };

  const currentMonthLabel = `${getIndonesianMonthName(monthIndex)} ${year}`;

  return (
    <header
      id="top-header"
      className="sticky top-0 z-30 bg-white text-slate-900 shadow-xs border-b border-slate-100"
    >
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs">
              <Wallet2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight text-slate-900 flex items-center gap-1.5">
                Rekap Keuangan
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Catatan & Anggaran</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Eye Hide/Show Balance Toggle */}
            <button
              id="btn-toggle-balance-visibility"
              onClick={toggleHideBalance}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
              aria-label="Toggle Saldo"
            >
              {hideBalance ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Quick Export CSV */}
            <button
              id="btn-quick-export-csv"
              onClick={exportToCSV}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Ekspor CSV / Excel"
              aria-label="Ekspor Laporan CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Settings Tab Button */}
            <button
              id="btn-open-settings"
              onClick={() => {
                if (onOpenSettings) onOpenSettings();
                else setActiveTab('settings');
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Pengaturan & Backup"
              aria-label="Pengaturan"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month Selector Bar */}
        <div className="mt-2.5 flex items-center justify-between bg-slate-50 rounded-xl p-1 border border-slate-200/70">
          <button
            id="btn-prev-month"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-600 transition-colors active:scale-90"
            title="Bulan Sebelumnya"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentMonthLabel}</span>
          </div>

          <button
            id="btn-next-month"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-600 transition-colors active:scale-90"
            title="Bulan Berikutnya"
            aria-label="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
