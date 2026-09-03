import React, { useState } from 'react';
import {
  WalletCards,
  Banknote,
  Smartphone,
  Plus,
  ArrowLeftRight,
  Pencil,
  Trash2,
  X,
  Check,
  Eye,
  EyeOff,
  Coins,
  CreditCard,
  Landmark,
  PiggyBank,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, WalletType } from '../types';
import { formatRupiah, formatCompactRupiah, getCurrentRealtimeDateTime } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

export const WalletsView: React.FC = () => {
  const {
    wallets,
    totalBalance,
    hideBalance,
    toggleHideBalance,
    addWallet,
    updateWallet,
    deleteWallet,
    addTransaction,
    transactions,
  } = useFinance();

  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'cash' | 'digital'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [transferSourceId, setTransferSourceId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Add / Edit Form State
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('digital');
  const [walletBalanceStr, setWalletBalanceStr] = useState('');
  const [walletColor, setWalletColor] = useState('#00529B');
  const [walletIcon, setWalletIcon] = useState('Landmark');
  const [walletAccount, setWalletAccount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Transfer Modal State
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);

  // Aggregated totals per category
  const cashWallets = wallets.filter((w) => w.type === 'cash');
  const digitalWallets = wallets.filter((w) => w.type === 'digital');

  const totalCash = cashWallets.reduce((sum, w) => sum + w.balance, 0);
  const totalDigital = digitalWallets.reduce((sum, w) => sum + w.balance, 0);

  const cashPercentage = totalBalance > 0 ? Math.round((totalCash / totalBalance) * 100) : 0;
  const digitalPercentage = totalBalance > 0 ? Math.round((totalDigital / totalBalance) * 100) : 0;

  // Filtered wallets
  const displayedWallets = wallets.filter((w) => {
    if (filterType === 'cash') return w.type === 'cash';
    if (filterType === 'digital') return w.type === 'digital';
    return true;
  });

  // Color options
  const colorOptions = [
    '#059669', // Emerald (Cash)
    '#00529B', // BCA Blue
    '#00AED6', // GoPay Cyan
    '#7C3AED', // Purple
    '#F97316', // Orange
    '#EF4444', // Red
    '#0F172A', // Slate 900
    '#D97706', // Amber
  ];

  // Icon options
  const iconOptions = [
    { name: 'Banknote', label: 'Uang Kertas' },
    { name: 'Coins', label: 'Koin' },
    { name: 'Landmark', label: 'Bank' },
    { name: 'Smartphone', label: 'E-Wallet' },
    { name: 'CreditCard', label: 'Kartu' },
    { name: 'PiggyBank', label: 'Tabungan' },
    { name: 'WalletCards', label: 'Dompet' },
  ];

  const handleOpenAddModal = (defaultType: WalletType = 'digital') => {
    setWalletName('');
    setWalletType(defaultType);
    setWalletBalanceStr('');
    setWalletColor(defaultType === 'cash' ? '#059669' : '#00529B');
    setWalletIcon(defaultType === 'cash' ? 'Banknote' : 'Landmark');
    setWalletAccount('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setWalletName(wallet.name);
    setWalletType(wallet.type);
    setWalletBalanceStr(String(wallet.balance));
    setWalletColor(wallet.color);
    setWalletIcon(wallet.icon);
    setWalletAccount(wallet.accountNumber || '');
    setFormError(null);
  };

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) {
      setFormError('Nama dompet wajib diisi');
      return;
    }

    const rawBalance = parseInt(walletBalanceStr.replace(/\D/g, '') || '0', 10);

    if (editingWallet) {
      updateWallet(editingWallet.id, {
        name: walletName.trim(),
        type: walletType,
        balance: rawBalance,
        color: walletColor,
        icon: walletIcon,
        accountNumber: walletAccount.trim() || undefined,
      });
      setEditingWallet(null);
      showToast(`Dompet "${walletName.trim()}" berhasil diperbarui`);
    } else {
      addWallet({
        name: walletName.trim(),
        type: walletType,
        balance: rawBalance,
        initialBalance: rawBalance,
        color: walletColor,
        icon: walletIcon,
        accountNumber: walletAccount.trim() || undefined,
      });
      setIsAddModalOpen(false);
      showToast(`Dompet "${walletName.trim()}" berhasil ditambahkan`);
    }
  };

  const handleDeleteWalletConfirm = (id: string, name: string) => {
    if (wallets.length <= 1) {
      alert('Anda harus menyisakan setidaknya 1 dompet aktif.');
      return;
    }

    if (window.confirm(`Yakin ingin menghapus dompet "${name}"? Saldo yang tersimpan akan dihapus.`)) {
      deleteWallet(id);
      showToast(`Dompet "${name}" berhasil dihapus`);
    }
  };

  const handleOpenTransfer = (sourceWalletId: string) => {
    setTransferSourceId(sourceWalletId);
    const availableTargets = wallets.filter((w) => w.id !== sourceWalletId);
    setTransferTargetId(availableTargets[0]?.id || '');
    setTransferAmountStr('');
    setTransferNote('');
    setTransferError(null);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSourceId || !transferTargetId) {
      setTransferError('Pilih dompet asal dan dompet tujuan');
      return;
    }

    const amount = parseInt(transferAmountStr.replace(/\D/g, '') || '0', 10);
    if (isNaN(amount) || amount <= 0) {
      setTransferError('Masukkan nominal transfer yang valid');
      return;
    }

    const sourceWallet = wallets.find((w) => w.id === transferSourceId);
    const targetWallet = wallets.find((w) => w.id === transferTargetId);

    if (!sourceWallet || !targetWallet) return;

    if (sourceWallet.balance < amount) {
      if (!window.confirm(`Saldo ${sourceWallet.name} (${formatRupiah(sourceWallet.balance)}) kurang dari nominal transfer. Lanjutkan tetap transfer?`)) {
        return;
      }
    }

    const { date: dateStr, time: timeStr } = getCurrentRealtimeDateTime();

    addTransaction({
      amount,
      type: 'transfer',
      categoryId: '',
      walletId: transferSourceId,
      toWalletId: transferTargetId,
      date: dateStr,
      time: timeStr,
      note: transferNote.trim() || `Transfer dari ${sourceWallet.name} ke ${targetWallet.name}`,
    });

    setTransferSourceId(null);
    showToast(`Transfer ${formatRupiah(amount)} dari ${sourceWallet.name} ke ${targetWallet.name} berhasil!`);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  return (
    <div id="view-wallets" className="space-y-4 pb-20">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. Overview Saldo Total */}
      <div
        id="card-total-wealth"
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center">
              <WalletCards className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500">Total Seluruh Saldo</h2>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {hideBalance ? '••••••••' : formatRupiah(totalBalance)}
              </p>
            </div>
          </div>
          <button
            onClick={toggleHideBalance}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
            title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
          >
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Breakdown 2 Kategori Saldo: Cash vs Digital */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Card Cash */}
          <div
            onClick={() => setFilterType(filterType === 'cash' ? 'all' : 'cash')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'cash'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-400 dark:ring-emerald-500'
                : 'bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Banknote className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Saldo Cash</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-md">
                {cashPercentage}%
              </span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {hideBalance ? '••••••' : formatRupiah(totalCash)}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
              {cashWallets.length} dompet tunai
            </p>
          </div>

          {/* Card Digital */}
          <div
            onClick={() => setFilterType(filterType === 'digital' ? 'all' : 'digital')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              filterType === 'digital'
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-400 dark:ring-indigo-500'
                : 'bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Saldo Digital</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded-md">
                {digitalPercentage}%
              </span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {hideBalance ? '••••••' : formatRupiah(totalDigital)}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
              {digitalWallets.length} rekening / e-wallet
            </p>
          </div>
        </div>

        {/* Visual Composition Bar */}
        {totalBalance > 0 && (
          <div className="space-y-1 pt-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${cashPercentage}%` }}
                title={`Cash: ${cashPercentage}%`}
              />
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${digitalPercentage}%` }}
                title={`Digital: ${digitalPercentage}%`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium px-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Cash ({cashPercentage}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Digital ({digitalPercentage}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Filter & Add Button Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Category Tabs */}
        <div className="flex p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex-1 transition-colors">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua ({wallets.length})
          </button>
          <button
            onClick={() => setFilterType('cash')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'cash'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cash ({cashWallets.length})
          </button>
          <button
            onClick={() => setFilterType('digital')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'digital'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Digital ({digitalWallets.length})
          </button>
        </div>

        {/* Add Wallet Button */}
        <button
          id="btn-add-wallet"
          onClick={() => handleOpenAddModal(filterType === 'cash' ? 'cash' : 'digital')}
          className="h-9 px-3.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          <span>Tambah</span>
        </button>
      </div>

      {/* 3. List of Wallet Cards */}
      <div className="space-y-3">
        {displayedWallets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center shadow-xs text-slate-400 dark:text-slate-500 transition-colors">
            <p className="text-xs">
              Tidak ada dompet di kategori {filterType === 'cash' ? 'Cash' : 'Digital'}.
            </p>
            <button
              onClick={() => handleOpenAddModal(filterType === 'cash' ? 'cash' : 'digital')}
              className="mt-2 text-xs font-bold text-slate-900 dark:text-slate-200 hover:underline"
            >
              + Tambah Dompet {filterType === 'cash' ? 'Cash' : 'Digital'}
            </button>
          </div>
        ) : (
          displayedWallets.map((wallet) => {
            // Count transactions in this wallet
            const txCount = transactions.filter(
              (t) => t.walletId === wallet.id || t.toWalletId === wallet.id
            ).length;

            return (
              <div
                key={wallet.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-all hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: wallet.color }}
                    >
                      <CategoryIcon name={wallet.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {wallet.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            wallet.type === 'cash'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          {wallet.type === 'cash' ? 'Cash / Tunai' : 'Digital'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {wallet.accountNumber ? `${wallet.accountNumber} • ` : ''}
                        {txCount} transaksi
                      </p>
                    </div>
                  </div>

                  {/* Actions (Transfer, Edit, Delete) */}
                  <div className="flex items-center gap-1">
                    {wallets.length > 1 && (
                      <button
                        onClick={() => handleOpenTransfer(wallet.id)}
                        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors"
                        title="Transfer ke dompet lain"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditModal(wallet)}
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors"
                      title="Edit dompet"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {wallets.length > 1 && (
                      <button
                        onClick={() => handleDeleteWalletConfirm(wallet.id, wallet.name)}
                        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors"
                        title="Hapus dompet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Balance Display */}
                <div className="pt-2 border-t border-slate-50 dark:border-slate-800 flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Saldo Saat Ini:</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {hideBalance ? '••••••••' : formatRupiah(wallet.balance)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Add / Edit Wallet Modal */}
      {(isAddModalOpen || editingWallet) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-xl p-5 space-y-4 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingWallet ? 'Edit Dompet' : 'Tambah Dompet / Rekening'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingWallet(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWallet} className="space-y-3.5">
              {/* Category Selection: Cash vs Digital */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kategori Saldo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWalletType('cash');
                      if (!editingWallet) {
                        setWalletColor('#059669');
                        setWalletIcon('Banknote');
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      walletType === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold">Cash (Tunai)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Uang tunai di dompet fisik, laci, brankas
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWalletType('digital');
                      if (!editingWallet) {
                        setWalletColor('#00529B');
                        setWalletIcon('Landmark');
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      walletType === 'digital'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold">Digital</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Rekening bank, E-Wallet (GoPay, OVO), tabungan
                    </p>
                  </button>
                </div>
              </div>

              {/* Wallet Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Dompet
                </label>
                <input
                  type="text"
                  placeholder={
                    walletType === 'cash'
                      ? 'Contoh: Dompet Tunai Saku, Kas Harian'
                      : 'Contoh: BCA Utama, Mandiri, GoPay'
                  }
                  value={walletName}
                  onChange={(e) => {
                    setWalletName(e.target.value);
                    setFormError(null);
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  required
                />
              </div>

              {/* Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {editingWallet ? 'Saldo Saat Ini (Rp)' : 'Saldo Awal (Rp)'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={
                    walletBalanceStr
                      ? new Intl.NumberFormat('id-ID').format(
                          parseInt(walletBalanceStr.replace(/\D/g, '') || '0', 10)
                        )
                      : ''
                  }
                  onChange={(e) => {
                    setWalletBalanceStr(e.target.value.replace(/\D/g, ''));
                    setFormError(null);
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>

              {/* Optional Account Number for Digital */}
              {walletType === 'digital' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. Rekening / No. HP (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: •••• 4821 atau 0812..."
                    value={walletAccount}
                    onChange={(e) => setWalletAccount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  />
                </div>
              )}

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ikon Dompet
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {iconOptions.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setWalletIcon(opt.name)}
                      className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                        walletIcon === opt.name
                          ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <CategoryIcon name={opt.name} className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Warna Tema
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWalletColor(c)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                    >
                      {walletColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{formError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl text-xs shadow-xs mt-2 transition-all active:scale-[0.98]"
              >
                {editingWallet ? 'Simpan Perubahan' : 'Tambah Dompet'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Transfer Modal */}
      {transferSourceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-xl p-5 space-y-4 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Transfer Antar Dompet</h3>
              </div>
              <button
                onClick={() => setTransferSourceId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5">
              {/* Source & Target Wallets */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Dari Dompet
                  </label>
                  <select
                    value={transferSourceId}
                    onChange={(e) => setTransferSourceId(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCompactRupiah(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Ke Dompet
                  </label>
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {wallets
                      .filter((w) => w.id !== transferSourceId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatCompactRupiah(w.balance)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal Transfer (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={
                    transferAmountStr
                      ? new Intl.NumberFormat('id-ID').format(
                          parseInt(transferAmountStr.replace(/\D/g, '') || '0', 10)
                        )
                      : ''
                  }
                  onChange={(e) => {
                    setTransferAmountStr(e.target.value.replace(/\D/g, ''));
                    setTransferError(null);
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  autoFocus
                />

                {/* Quick presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50000, 100000, 250000, 500000, 1000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const cur = parseInt(transferAmountStr.replace(/\D/g, '') || '0', 10);
                        setTransferAmountStr(String(cur + preset));
                      }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                    >
                      +{preset >= 1000000 ? `${preset / 1000000}jt` : `${preset / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Tarik tunai ATM, Isi saldo GoPay"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>

              {transferError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{transferError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl text-xs shadow-xs transition-all active:scale-[0.98]"
              >
                Kirim Transfer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
