import React, { useState, useEffect } from 'react';
import {
  PenLine,
  CheckCircle2,
  Check,
  Plus,
  X,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, getCurrentRealtimeDateTime, formatDateIndo } from '../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    userProfile,
    syncStatus,
    wallets,
    categories,
    addCategory,
    deleteCategory,
    addTransaction,
  } = useFinance();

  // ---------------- Form State for Direct Recording ----------------
  const [recordType, setRecordType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live ticking date/time display
  const [currentLiveTime, setCurrentLiveTime] = useState(() => getCurrentRealtimeDateTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLiveTime(getCurrentRealtimeDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick inline add option input
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionError, setNewOptionError] = useState<string | null>(null);

  // Available options for current type (expense / income / both)
  const availableOptions = categories.filter(
    (c) => c.type === recordType || c.type === 'both'
  );

  // Auto-select option if selected one was deleted or invalid
  useEffect(() => {
    const filtered = categories.filter(
      (c) => c.type === recordType || c.type === 'both'
    );
    if (filtered.length > 0) {
      if (!filtered.some((c) => c.id === selectedOptionId)) {
        setSelectedOptionId(filtered[0].id);
      }
    } else {
      setSelectedOptionId('');
    }
  }, [recordType, categories, selectedOptionId]);

  // Ensure default wallet is set
  useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  const handleAddPreset = (preset: number) => {
    const current = parseInt(amountStr.replace(/\D/g, '') || '0', 10);
    setAmountStr(String(current + preset));
    setErrorMsg(null);
  };

  const handleSaveNewOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newOptionName.trim();
    if (!trimmed) {
      setNewOptionError('Tuliskan nama opsi');
      return null;
    }

    // Check duplicate
    const exists = categories.find(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        (c.type === recordType || c.type === 'both')
    );
    if (exists) {
      setSelectedOptionId(exists.id);
      setNewOptionName('');
      setIsAddingOption(false);
      setNewOptionError(null);
      return exists;
    }

    const created = addCategory({
      name: trimmed,
      type: recordType,
      icon: 'Tag',
      color: recordType === 'expense' ? '#E11D48' : '#059669',
      bgColor: recordType === 'expense' ? '#FFE4E6' : '#D1FAE5',
    });

    setSelectedOptionId(created.id);
    setNewOptionName('');
    setIsAddingOption(false);
    setNewOptionError(null);
    return created;
  };

  const handleDeleteOption = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCategory(id);
    if (selectedOptionId === id) {
      const remaining = availableOptions.filter((c) => c.id !== id);
      setSelectedOptionId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseInt(amountStr.replace(/\D/g, ''), 10);

    if (isNaN(rawAmount) || rawAmount <= 0) {
      setErrorMsg('Masukkan nominal transaksi yang valid (lebih dari Rp 0)');
      return;
    }

    let targetOptionId = selectedOptionId;

    // If user has typed an option in the input but hasn't clicked save
    if (!targetOptionId && newOptionName.trim()) {
      const created = handleSaveNewOption();
      if (created) {
        targetOptionId = created.id;
      }
    }

    if (!targetOptionId) {
      setErrorMsg(`Silakan buat atau pilih opsi ${recordType === 'expense' ? 'pengeluaran' : 'pemasukan'} terlebih dahulu`);
      return;
    }

    if (!walletId) {
      setErrorMsg('Pilih dompet / rekening');
      return;
    }

    // Capture exact real-time date and time upon clicking save
    const { date: realDate, time: realTime } = getCurrentRealtimeDateTime();

    // Save transaction
    addTransaction({
      amount: rawAmount,
      type: recordType,
      categoryId: targetOptionId,
      walletId,
      date: realDate,
      time: realTime,
      note: note.trim(),
    });

    const chosenOption = categories.find((c) => c.id === targetOptionId);
    const optionLabel = chosenOption ? chosenOption.name : 'transaksi';

    // Reset inputs
    setAmountStr('');
    setNote('');
    setErrorMsg(null);
    setSuccessMsg(
      recordType === 'expense'
        ? `Pengeluaran ${formatRupiah(rawAmount)} untuk "${optionLabel}" berhasil dicatat!`
        : `Pemasukan ${formatRupiah(rawAmount)} dari "${optionLabel}" berhasil dicatat!`
    );

    setTimeout(() => {
      setSuccessMsg(null);
    }, 3500);
  };

  return (
    <div id="view-dashboard" className="space-y-4 pb-20">
      {/* Transaction Recording Form */}
      <div
        id="card-record-transaction"
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs">
              <PenLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Catat Transaksi</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[140px] sm:max-w-none">
                {userProfile ? `Akun: ${userProfile.name}` : 'Pencatatan langsung & sederhana'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
            <span>{syncStatus === 'syncing' ? 'Menyinkronkan...' : 'Cloud Firestore'}</span>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRecordSubmit} className="space-y-4">
          {/* 1. Type Switcher: Only Pengeluaran & Pemasukan */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setRecordType('expense');
                setErrorMsg(null);
                setIsAddingOption(false);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                recordType === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRecordType('income');
                setErrorMsg(null);
                setIsAddingOption(false);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                recordType === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>
          </div>

          {/* 2. Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 dark:text-slate-500">
                Rp
              </span>
              <input
                id="input-record-amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={
                  amountStr
                    ? new Intl.NumberFormat('id-ID').format(
                        parseInt(amountStr.replace(/\D/g, '') || '0', 10)
                      )
                    : ''
                }
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAmountStr(val);
                  setErrorMsg(null);
                }}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-slate-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                autoFocus
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[10000, 20000, 50000, 100000, 250000, 500000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors active:scale-95"
                >
                  +{preset >= 1000000 ? `${preset / 1000000}jt` : `${preset / 1000}rb`}
                </button>
              ))}
              {amountStr && (
                <button
                  type="button"
                  onClick={() => setAmountStr('')}
                  className="px-2.5 py-1 text-[11px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg ml-auto"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 3. Simple Clean Option Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Opsi {recordType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </label>

              {availableOptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingOption(!isAddingOption);
                    setNewOptionName('');
                    setNewOptionError(null);
                  }}
                  className="text-[11px] font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all active:scale-95"
                >
                  {isAddingOption ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />}
                  <span>{isAddingOption ? 'Tutup' : 'Tambah Opsi'}</span>
                </button>
              )}
            </div>

            {/* If no options yet, or if isAddingOption is toggled */}
            {(isAddingOption || availableOptions.length === 0) && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 animate-in fade-in">
                {availableOptions.length === 0 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Belum ada opsi {recordType === 'expense' ? 'pengeluaran' : 'pemasukan'}. Tuliskan opsi pertama Anda:
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Nama opsi ${recordType === 'expense' ? 'pengeluaran' : 'pemasukan'} baru...`}
                    value={newOptionName}
                    onChange={(e) => {
                      setNewOptionName(e.target.value);
                      setNewOptionError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveNewOption();
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
                    autoFocus={availableOptions.length === 0}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveNewOption()}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
                {newOptionError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{newOptionError}</p>
                )}
              </div>
            )}

            {/* Simple Text-Based Option Pills with Quick Delete 'x' Button */}
            {availableOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {availableOptions.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setSelectedOptionId(opt.id);
                        setErrorMsg(null);
                      }}
                      className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
                        isSelected
                          ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className="truncate max-w-[140px]">{opt.name}</span>

                      {/* Direct Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteOption(opt.id, opt.name, e)}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'text-slate-400 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'
                            : 'text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        }`}
                        title={`Hapus opsi ${opt.name}`}
                        aria-label={`Hapus ${opt.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Inline "+ Tambah" button if not currently expanded */}
                {!isAddingOption && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingOption(true);
                      setNewOptionName('');
                      setNewOptionError(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 bg-white dark:bg-slate-850 text-xs font-semibold transition-all active:scale-95"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5px]" />
                    <span>Tambah Opsi</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. Simple Dompet / Rekening Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dompet / Rekening
            </label>
            <div className="grid grid-cols-2 gap-2">
              {wallets.map((w) => {
                const isSelected = walletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWalletId(w.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-900 dark:ring-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{w.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {formatRupiah(w.balance)}
                      </p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Real-time Date & Time Indicator */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Waktu Pencatatan (Realtime)</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {formatDateIndo(currentLiveTime.date)} • {currentLiveTime.time} WIB
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              Live
            </span>
          </div>

          {/* 6. Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Makan siang, Beli bensin, Gaji proyek"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <button
            id="btn-submit-direct-record"
            type="submit"
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <PenLine className="w-4 h-4" />
            {recordType === 'expense'
              ? 'Simpan Pengeluaran'
              : 'Simpan Pemasukan'}
          </button>
        </form>
      </div>
    </div>
  );
};
