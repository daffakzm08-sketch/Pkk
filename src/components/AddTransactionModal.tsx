import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import {
  formatRupiah,
  getCurrentRealtimeDateTime,
  formatDateIndo,
} from '../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
}) => {
  const {
    categories,
    wallets,
    addTransaction,
    addCategory,
    deleteCategory,
  } = useFinance();

  // Types: only 'expense' | 'income' (Transfer removed)
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Live ticking date/time display
  const [liveDateTime, setLiveDateTime] = useState(() => getCurrentRealtimeDateTime());

  useEffect(() => {
    if (!isOpen) return;
    setLiveDateTime(getCurrentRealtimeDateTime());
    const interval = setInterval(() => {
      setLiveDateTime(getCurrentRealtimeDateTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // New Option creation inside modal
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');

  // Sync initial type when opened
  useEffect(() => {
    if (isOpen) {
      setType(initialType === 'income' ? 'income' : 'expense');
      setAmountStr('');
      setNote('');
      setError(null);
      setIsAddingOption(false);
      setNewOptionName('');

      // Default wallet
      if (wallets.length > 0) {
        setWalletId(wallets[0].id);
      }
    }
  }, [isOpen, initialType, wallets]);

  // Filter options by selected transaction type
  const availableOptions = categories.filter((c) => {
    if (type === 'expense') return c.type === 'expense' || c.type === 'both';
    if (type === 'income') return c.type === 'income' || c.type === 'both';
    return true;
  });

  // Set default option when type or options change
  useEffect(() => {
    const matching = categories.filter(
      (c) => c.type === type || c.type === 'both'
    );
    if (matching.length > 0) {
      if (!matching.some((c) => c.id === selectedOptionId)) {
        setSelectedOptionId(matching[0].id);
      }
    } else {
      setSelectedOptionId('');
    }
  }, [type, categories, selectedOptionId]);

  if (!isOpen) return null;

  const handleAddPreset = (addVal: number) => {
    const cur = parseInt(amountStr.replace(/\D/g, '') || '0', 10);
    setAmountStr(String(cur + addVal));
  };

  const handleCreateOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newOptionName.trim();
    if (!trimmed) return null;

    const exists = categories.find(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        (c.type === type || c.type === 'both')
    );
    if (exists) {
      setSelectedOptionId(exists.id);
      setNewOptionName('');
      setIsAddingOption(false);
      return exists;
    }

    const created = addCategory({
      name: trimmed,
      type,
      icon: 'Tag',
      color: type === 'expense' ? '#E11D48' : '#059669',
      bgColor: type === 'expense' ? '#FFE4E6' : '#D1FAE5',
    });

    setSelectedOptionId(created.id);
    setNewOptionName('');
    setIsAddingOption(false);
    return created;
  };

  const handleDeleteOption = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCategory(id);
    if (selectedOptionId === id) {
      const remaining = availableOptions.filter((c) => c.id !== id);
      setSelectedOptionId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseInt(amountStr.replace(/\D/g, '') || '0', 10);

    if (!rawAmount || rawAmount <= 0) {
      setError('Masukkan nominal transaksi yang valid (lebih dari Rp 0)');
      return;
    }

    if (!walletId) {
      setError('Pilih dompet / rekening');
      return;
    }

    let targetOptionId = selectedOptionId;
    if (!targetOptionId && newOptionName.trim()) {
      const created = handleCreateOption();
      if (created) targetOptionId = created.id;
    }

    if (!targetOptionId) {
      setError(`Silakan buat atau pilih opsi ${type === 'expense' ? 'pengeluaran' : 'pemasukan'} terlebih dahulu`);
      return;
    }

    // Capture real-time date and time upon clicking save
    const { date: realDate, time: realTime } = getCurrentRealtimeDateTime();

    // Process Add
    addTransaction({
      type,
      amount: rawAmount,
      categoryId: targetOptionId,
      walletId,
      date: realDate,
      time: realTime,
      note: note.trim() || undefined,
    });

    // Small celebratory confetti for large income
    if (type === 'income' && rawAmount >= 500000) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // Ignore fallback
      }
    }

    onClose();
  };

  return (
    <div
      id="modal-add-transaction"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs transition-opacity p-0 sm:p-4"
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 border border-slate-100"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-base font-bold text-slate-900">Catat Transaksi</h2>
            <p className="text-xs text-slate-500 font-medium">Pemasukan atau Pengeluaran</p>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {/* 1. Transaction Type Switcher: Only Pengeluaran & Pemasukan */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              id="type-btn-expense"
              onClick={() => {
                setType('expense');
                setIsAddingOption(false);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              id="type-btn-income"
              onClick={() => {
                setType('income');
                setIsAddingOption(false);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>
          </div>

          {/* 2. Amount Input & Quick Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                id="input-transaction-amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amountStr ? new Intl.NumberFormat('id-ID').format(parseInt(amountStr.replace(/\D/g, '') || '0', 10)) : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAmountStr(val);
                  setError(null);
                }}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-300"
                autoFocus
              />
            </div>

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[10000, 25000, 50000, 100000, 500000, 1000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  +{preset >= 1000000 ? `${preset / 1000000}jt` : `${preset / 1000}rb`}
                </button>
              ))}
              {amountStr && (
                <button
                  type="button"
                  onClick={() => setAmountStr('')}
                  className="px-2.5 py-1 text-[11px] font-medium text-rose-500 hover:bg-rose-50 rounded-lg ml-auto"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 3. Option Selector with Simple Pills (No Logo, Deletable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Opsi {type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </label>
              {availableOptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingOption(!isAddingOption)}
                  className="text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all"
                >
                  {isAddingOption ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />}
                  <span>{isAddingOption ? 'Tutup' : 'Tambah Opsi'}</span>
                </button>
              )}
            </div>

            {/* Inline Add Option Form */}
            {(isAddingOption || availableOptions.length === 0) && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-in fade-in">
                {availableOptions.length === 0 && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    Belum ada opsi {type === 'expense' ? 'pengeluaran' : 'pemasukan'}. Tuliskan opsi baru:
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Nama opsi ${type === 'expense' ? 'pengeluaran' : 'pemasukan'}...`}
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateOption();
                      }
                    }}
                    className="flex-1 py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    autoFocus={availableOptions.length === 0}
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateOption()}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {availableOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                {availableOptions.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setSelectedOptionId(opt.id);
                        setError(null);
                      }}
                      className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate max-w-[130px]">{opt.name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteOption(opt.id, e)}
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-400 hover:text-rose-600'
                        }`}
                        title="Hapus opsi"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {!isAddingOption && (
                  <button
                    type="button"
                    onClick={() => setIsAddingOption(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:text-slate-900 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5px]" />
                    <span>Tambah Opsi</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. Wallet Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{w.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{formatRupiah(w.balance)}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Real-time Date & Time Indicator */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Waktu Pencatatan (Realtime)</p>
                <p className="text-xs font-bold text-slate-800">
                  {formatDateIndo(liveDateTime.date)} • {liveDateTime.time} WIB
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 text-[10px] font-bold">
              Live
            </span>
          </div>

          {/* 6. Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Tambahkan detail catatan..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xs active:scale-[0.98] transition-all text-xs"
          >
            {type === 'expense' ? 'Simpan Pengeluaran' : 'Simpan Pemasukan'}
          </button>
        </form>
      </div>
    </div>
  );
};
