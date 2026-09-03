import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';
import {
  formatRupiah,
  formatDateIndo,
  getRelativeDateLabel,
} from '../utils/formatters';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    categories,
    wallets,
    deleteTransaction,
    exportToCSV,
  } = useFinance();

  const [selectedType, setSelectedType] = useState<string>('all'); // 'all', 'income', 'expense', 'transfer'
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTransactionDetail, setActiveTransactionDetail] = useState<Transaction | null>(null);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Type Filter
      if (selectedType !== 'all' && tx.type !== selectedType) return false;

      // 2. Wallet Filter
      if (selectedWallet !== 'all') {
        if (tx.walletId !== selectedWallet && tx.toWalletId !== selectedWallet) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;

      return true;
    });
  }, [transactions, selectedType, selectedWallet, selectedCategory]);

  // Group filtered transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [dateStr: string]: Transaction[] } = {};
    filteredTransactions.forEach((tx) => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });

    // Sort dates descending
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((dateStr) => {
      const items = groups[dateStr].sort((a, b) => {
        if (b.createdAt && a.createdAt && b.createdAt !== a.createdAt) {
          return b.createdAt - a.createdAt;
        }
        return (b.time || '').localeCompare(a.time || '');
      });
      const dailyIncome = items
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const dailyExpense = items
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        dateStr,
        items,
        dailyIncome,
        dailyExpense,
      };
    });
  }, [filteredTransactions]);

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      deleteTransaction(id);
      if (activeTransactionDetail?.id === id) {
        setActiveTransactionDetail(null);
      }
    }
  };

  return (
    <div id="view-transactions" className="space-y-4 pb-20">
      {/* 1. Filters & Export CSV */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between gap-2">
          {/* Type Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 flex-1">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'expense', label: 'Pengeluaran' },
              { id: 'income', label: 'Pemasukan' },
              { id: 'transfer', label: 'Transfer' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  selectedType === t.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={exportToCSV}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold transition-colors"
            title="Ekspor CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Dropdown Filters (Wallet & Category) */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <select
            id="filter-wallet-select"
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <select
            id="filter-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Opsi</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Transactions List by Date Groups */}
      {groupedTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center shadow-xs transition-colors">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tidak ada transaksi</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
            Tidak ditemukan transaksi yang cocok dengan filter yang dipilih.
          </p>
          {(selectedType !== 'all' || selectedWallet !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedWallet('all');
                setSelectedCategory('all');
              }}
              className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {groupedTransactions.map((group) => (
            <div
              key={group.dateStr}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden transition-colors"
            >
              {/* Date Group Header with Daily Totals */}
              <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{getRelativeDateLabel(group.dateStr)}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  {group.dailyIncome > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">+{formatRupiah(group.dailyIncome)}</span>
                  )}
                  {group.dailyExpense > 0 && (
                    <span className="text-rose-600 dark:text-rose-400">-{formatRupiah(group.dailyExpense)}</span>
                  )}
                </div>
              </div>

              {/* Transaction Items */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.items.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const wal = wallets.find((w) => w.id === tx.walletId);
                  const toWal = tx.toWalletId ? wallets.find((w) => w.id === tx.toWalletId) : null;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setActiveTransactionDetail(tx)}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs ${
                            tx.type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-5 h-5" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {cat?.name || tx.note || (tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 truncate font-medium">
                            {tx.note && cat?.name && <span>{tx.note} • </span>}
                            <span className="text-slate-500 dark:text-slate-400">{wal?.name}</span>
                            {toWal && <span className="text-indigo-600 dark:text-indigo-400 font-medium">➔ {toWal.name}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p
                            className={`text-xs sm:text-sm font-bold ${
                              tx.type === 'income'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : tx.type === 'expense'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {tx.type === 'income' ? '+ ' : tx.type === 'expense' ? '- ' : ''}
                            {formatRupiah(tx.amount)}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{tx.time || ''}</span>
                        </div>
                        
                        <button
                          onClick={(e) => handleDelete(tx.id, e)}
                          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {activeTransactionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Detail Transaksi
              </span>
              <button
                onClick={() => setActiveTransactionDetail(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-1 ${
                    activeTransactionDetail.type === 'income'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                      : activeTransactionDetail.type === 'expense'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800'
                  }`}
                >
                  {activeTransactionDetail.type === 'income'
                    ? 'Pemasukan'
                    : activeTransactionDetail.type === 'expense'
                    ? 'Pengeluaran'
                    : 'Transfer'}
                </span>
                <p
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 ${
                    activeTransactionDetail.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : activeTransactionDetail.type === 'expense'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {formatRupiah(activeTransactionDetail.amount)}
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Kategori</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {categories.find((c) => c.id === activeTransactionDetail.categoryId)?.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Dompet / Rekening</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {wallets.find((w) => w.id === activeTransactionDetail.walletId)?.name || '-'}
                  </span>
                </div>
                {activeTransactionDetail.toWalletId && (
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Ke Dompet</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {wallets.find((w) => w.id === activeTransactionDetail.toWalletId)?.name || '-'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Tanggal & Waktu</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatDateIndo(activeTransactionDetail.date)} {activeTransactionDetail.time}
                  </span>
                </div>
                {activeTransactionDetail.note && (
                  <div className="py-1">
                    <span className="text-slate-400 dark:text-slate-500 font-medium block mb-0.5">Catatan</span>
                    <p className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium border border-slate-100 dark:border-slate-700">
                      {activeTransactionDetail.note}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => handleDelete(activeTransactionDetail.id)}
                  className="flex-1 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-100 dark:border-rose-900"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Transaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
