import React, { useState } from 'react';
import {
  WalletCards,
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowLeftRight,
  TrendingUp,
  ShieldCheck,
  Target,
  X,
  CreditCard,
  Landmark,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Category, Wallet, WalletType, FinancialGoal } from '../types';
import {
  formatRupiah,
  formatCompactRupiah,
  parseMonthKey,
} from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

export const BudgetsAndWalletsView: React.FC = () => {
  const {
    categories,
    budgets,
    wallets,
    goals,
    activeMonth,
    activeMonthTransactions,
    saveBudget,
    deleteBudget,
    addWallet,
    updateWallet,
    deleteWallet,
    addGoal,
    updateGoal,
    deleteGoal,
    openAddModal,
  } = useFinance();

  const { monthName, year } = parseMonthKey(activeMonth);
  const [subTab, setSubTab] = useState<'budgets' | 'wallets' | 'goals'>('budgets');

  // Budget Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [budgetAmountStr, setBudgetAmountStr] = useState('');

  // Wallet Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('digital');
  const [walletInitialBalanceStr, setWalletInitialBalanceStr] = useState('');
  const [walletColor, setWalletColor] = useState('#00529B');
  const [walletIcon, setWalletIcon] = useState('Landmark');
  const [walletAccNum, setWalletAccNum] = useState('');

  // Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetStr, setGoalTargetStr] = useState('');
  const [goalCurrentStr, setGoalCurrentStr] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  // Expense categories for budget
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Total budget & spending
  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => {
    const spent = activeMonthTransactions
      .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return sum + spent;
  }, 0);

  const overallBudgetPercent = totalBudgetAmount > 0 ? Math.round((totalBudgetSpent / totalBudgetAmount) * 100) : 0;

  // Handlers
  const handleOpenBudgetModal = (categoryId?: string, currentAmount?: number) => {
    if (categoryId) {
      setSelectedCategoryId(categoryId);
      setBudgetAmountStr(currentAmount ? String(currentAmount) : '');
    } else if (expenseCategories.length > 0) {
      setSelectedCategoryId(expenseCategories[0].id);
      setBudgetAmountStr('');
    }
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(budgetAmountStr.replace(/\D/g, '') || '0', 10);
    if (!selectedCategoryId || amount <= 0) return;
    saveBudget(selectedCategoryId, amount, activeMonth);
    setIsBudgetModalOpen(false);
  };

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) return;
    const initialBal = parseInt(walletInitialBalanceStr.replace(/\D/g, '') || '0', 10);
    addWallet({
      name: walletName.trim(),
      type: walletType,
      balance: initialBal,
      initialBalance: initialBal,
      color: walletColor,
      icon: walletIcon,
      accountNumber: walletAccNum.trim() || undefined,
    });
    setIsWalletModalOpen(false);
    setWalletName('');
    setWalletInitialBalanceStr('');
    setWalletAccNum('');
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const target = parseInt(goalTargetStr.replace(/\D/g, '') || '0', 10);
    const current = parseInt(goalCurrentStr.replace(/\D/g, '') || '0', 10);
    if (target <= 0) return;

    addGoal({
      title: goalTitle.trim(),
      targetAmount: target,
      currentAmount: current,
      deadline: goalDeadline || `${year}-12-31`,
      icon: 'ShieldCheck',
      color: '#10B981',
    });
    setIsGoalModalOpen(false);
    setGoalTitle('');
    setGoalTargetStr('');
    setGoalCurrentStr('');
  };

  return (
    <div id="view-budgets-and-wallets" className="space-y-4 pb-20">
      {/* Subtab Switcher */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <button
          onClick={() => setSubTab('budgets')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'budgets'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Anggaran
        </button>
        <button
          onClick={() => setSubTab('wallets')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'wallets'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Dompet ({wallets.length})
        </button>
        <button
          onClick={() => setSubTab('goals')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'goals'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Target ({goals.length})
        </button>
      </div>

      {/* ----------------- SUBTAB 1: ANGGARAN KATEGORI ----------------- */}
      {subTab === 'budgets' && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Total Anggaran {monthName}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {formatRupiah(totalBudgetSpent)} terpakai dari {formatRupiah(totalBudgetAmount)}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  overallBudgetPercent >= 100
                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                    : overallBudgetPercent >= 80
                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}
              >
                {overallBudgetPercent}%
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallBudgetPercent >= 100
                    ? 'bg-rose-600'
                    : overallBudgetPercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-slate-900'
                }`}
                style={{ width: `${Math.min(overallBudgetPercent, 100)}%` }}
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Sisa: <b className="text-slate-900 font-bold">{formatRupiah(Math.max(0, totalBudgetAmount - totalBudgetSpent))}</b>
              </span>
              <button
                id="btn-add-budget"
                onClick={() => handleOpenBudgetModal()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Pasang Anggaran
              </button>
            </div>
          </div>

          {/* List of Category Budgets */}
          <div className="space-y-2.5">
            {budgets.map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              const spent = activeMonthTransactions
                .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
              const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
              const remaining = b.amount - spent;

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat?.color || '#64748B' }}
                      >
                        <CategoryIcon name={cat?.icon || 'Tag'} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{cat?.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {formatRupiah(spent)} / {formatRupiah(b.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          percent >= 100
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : percent >= 80
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {percent}%
                      </span>
                      <button
                        onClick={() => handleOpenBudgetModal(b.categoryId, b.amount)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                        title="Edit Anggaran"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBudget(b.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded-lg"
                        title="Hapus Anggaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percent >= 100
                          ? 'bg-rose-500'
                          : percent >= 80
                          ? 'bg-amber-500'
                          : 'bg-slate-900'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>
                      {remaining >= 0 ? `Sisa: ${formatRupiah(remaining)}` : `Overbudget: ${formatRupiah(Math.abs(remaining))}`}
                    </span>
                    <span className="text-slate-400">{activeMonth}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 2: KELOLA DOMPET ----------------- */}
      {subTab === 'wallets' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daftar Dompet & Akun</span>
            <button
              id="btn-add-wallet"
              onClick={() => setIsWalletModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Dompet
            </button>
          </div>

          <div className="space-y-2.5">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: w.color }}
                  >
                    <CategoryIcon name={w.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{w.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {w.type === 'cash' ? 'Uang Tunai (Cash)' : 'Saldo Digital / Rekening'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900">{formatRupiah(w.balance)}</p>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{w.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- SUBTAB 3: TARGET FINANSIAL (GOALS) ----------------- */}
      {subTab === 'goals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Tabungan & Impian</span>
            <button
              id="btn-add-goal"
              onClick={() => setIsGoalModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Pasang Target
            </button>
          </div>

          <div className="space-y-3">
            {goals.map((g) => {
              const progress = g.targetAmount > 0 ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100) : 0;
              return (
                <div
                  key={g.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{g.title}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Target Deadline: {g.deadline}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {progress}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-extrabold text-slate-900">{formatRupiah(g.currentAmount)}</span>
                    <span className="text-slate-400 font-medium">Target: {formatRupiah(g.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Pasang Batas Anggaran</h3>
              <button onClick={() => setIsBudgetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Opsi Pengeluaran</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Batas Maksimal Bulanan (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 1.500.000"
                  value={budgetAmountStr ? new Intl.NumberFormat('id-ID').format(parseInt(budgetAmountStr.replace(/\D/g, '') || '0', 10)) : ''}
                  onChange={(e) => setBudgetAmountStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs mt-2"
              >
                Simpan Anggaran
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Tambah Dompet / Rekening</h3>
              <button onClick={() => setIsWalletModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWallet} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Dompet</label>
                <input
                  type="text"
                  placeholder="Misal: Bank Mandiri, Dompet Tunai, DANA"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe</label>
                  <select
                    value={walletType}
                    onChange={(e) => {
                      const val = e.target.value as WalletType;
                      setWalletType(val);
                      if (val === 'cash') setWalletIcon('Banknote');
                      else setWalletIcon('Landmark');
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="cash">Tunai (Cash)</option>
                    <option value="digital">Digital (Bank / E-Wallet)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Warna</label>
                  <input
                    type="color"
                    value={walletColor}
                    onChange={(e) => setWalletColor(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={walletInitialBalanceStr ? new Intl.NumberFormat('id-ID').format(parseInt(walletInitialBalanceStr.replace(/\D/g, '') || '0', 10)) : ''}
                  onChange={(e) => setWalletInitialBalanceStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs mt-2"
              >
                Simpan Dompet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Target Impian / Menabung</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Target</label>
                <input
                  type="text"
                  placeholder="Misal: Dana Darurat, Beli Laptop, Umrah"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Nominal (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 10.000.000"
                  value={goalTargetStr ? new Intl.NumberFormat('id-ID').format(parseInt(goalTargetStr.replace(/\D/g, '') || '0', 10)) : ''}
                  onChange={(e) => setGoalTargetStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Terkumpul Sekarang (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={goalCurrentStr ? new Intl.NumberFormat('id-ID').format(parseInt(goalCurrentStr.replace(/\D/g, '') || '0', 10)) : ''}
                  onChange={(e) => setGoalCurrentStr(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs mt-2"
              >
                Simpan Target
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
