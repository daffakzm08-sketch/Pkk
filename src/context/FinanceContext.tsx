import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Transaction,
  Wallet,
  Category,
  Budget,
  FinancialGoal,
  ActiveTab,
  CategorySummary,
  MonthlyCashflow,
  TransactionType,
  UserProfile,
  AppSettings,
  ThemeMode,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_WALLETS,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
} from '../data/initialData';
import { getCurrentMonthKey, getIndonesianMonthName, parseMonthKey, getCurrentRealtimeDateTime } from '../utils/formatters';
import { auth, googleProvider, db } from '../lib/firebase';
import {
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface FinanceContextType {
  // State
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  goals: FinancialGoal[];
  activeTab: ActiveTab;
  activeMonth: string; // YYYY-MM
  isAddModalOpen: boolean;
  addModalDefaultType: TransactionType;
  hideBalance: boolean;

  // Profile, Theme, Auth & Sync
  userProfile: UserProfile | null;
  authLoading: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  appSettings: AppSettings;
  theme: ThemeMode;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setTheme: (theme: ThemeMode) => void;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  loginWithGoogle: (customUser?: Partial<UserProfile>) => Promise<boolean>;
  loginWithGoogleCredential: (idToken: string) => Promise<boolean>;
  logoutGoogle: () => Promise<void>;
  syncWithGoogleCloud: () => Promise<boolean>;

  // Setters
  setActiveTab: (tab: ActiveTab) => void;
  setActiveMonth: (month: string) => void;
  openAddModal: (defaultType?: TransactionType) => void;
  closeAddModal: () => void;
  toggleHideBalance: () => void;

  // Actions (Auto-synced to Cloud Firestore)
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addWallet: (wallet: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (id: string, data: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;

  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  saveBudget: (categoryId: string, amount: number, month?: string) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  addGoal: (goal: Omit<FinancialGoal, 'id'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Data Management
  resetToDefaultData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportToJSON: () => void;
  exportToCSV: () => void;
  importFromJSON: (jsonString: string) => Promise<boolean>;

  // Computed Summaries for Active Month
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  categoryExpenseBreakdown: CategorySummary[];
  categoryIncomeBreakdown: CategorySummary[];
  monthlyCashflows: MonthlyCashflow[];
  activeMonthTransactions: Transaction[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  HIDE_BALANCE: 'rekap_keuangan_hide_balance',
  SETTINGS: 'rekap_keuangan_settings_v2',
  THEME: 'rekap_keuangan_theme_v2',
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  currency: 'IDR',
  hideBalanceOnDashboard: false,
  enableDailyReminder: true,
  reminderTime: '20:00',
  autoBackupToDrive: true,
  lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  // App data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  // Theme & Preferences
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode;
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
      return 'light';
    } catch {
      return 'light';
    }
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.HIDE_BALANCE) === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeMonth, setActiveMonth] = useState<string>(getCurrentMonthKey());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDefaultType, setAddModalDefaultType] = useState<TransactionType>('expense');

  // Listen to Firebase Authentication & Cloud Firestore in real-time
  useEffect(() => {
    let unsubWallets: (() => void) | null = null;
    let unsubTransactions: (() => void) | null = null;
    let unsubCategories: (() => void) | null = null;
    let unsubBudgets: (() => void) | null = null;
    let unsubGoals: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Unsubscribe previous listeners
      unsubWallets?.();
      unsubTransactions?.();
      unsubCategories?.();
      unsubBudgets?.();
      unsubGoals?.();

      if (fbUser) {
        const profile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Pengguna',
          email: fbUser.email || '',
          avatarUrl: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || 'U')}&background=0D8ABC&color=fff`,
          isGoogleLinked: true,
          linkedAt: new Date().toISOString(),
        };

        setUserProfile(profile);
        setSyncStatus('syncing');
        setSyncError(null);

        // Sync User Profile Document to Firestore
        try {
          await setDoc(doc(db, 'users', fbUser.uid), {
            uid: fbUser.uid,
            displayName: profile.name,
            email: profile.email,
            photoURL: profile.avatarUrl,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (err: any) {
          console.warn('Could not sync user profile document:', err);
        }

        const walletsCol = collection(db, 'users', fbUser.uid, 'wallets');
        const transactionsCol = collection(db, 'users', fbUser.uid, 'transactions');
        const categoriesCol = collection(db, 'users', fbUser.uid, 'categories');
        const budgetsCol = collection(db, 'users', fbUser.uid, 'budgets');
        const goalsCol = collection(db, 'users', fbUser.uid, 'goals');

        // 1. Wallets Listener (Initializes default Cash & Digital wallets if empty)
        unsubWallets = onSnapshot(walletsCol, async (snapshot) => {
          if (snapshot.empty) {
            // First time login on new Google account: populate default wallets
            try {
              const batch = writeBatch(db);
              INITIAL_WALLETS.forEach((w) => {
                const wRef = doc(walletsCol, w.id);
                batch.set(wRef, w);
              });
              await batch.commit();
            } catch (e) {
              console.error('Error seeding initial wallets:', e);
            }
          } else {
            const list: Wallet[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as Wallet;
              list.push({
                ...data,
                id: d.id,
              });
            });
            setWallets(list);
          }
          setSyncStatus('synced');
        }, (error) => {
          console.error('Wallets sync error:', error);
          setSyncError('Gagal menyinkronkan dompet dari cloud.');
          setSyncStatus('error');
        });

        // 2. Transactions Listener
        unsubTransactions = onSnapshot(transactionsCol, (snapshot) => {
          const list: Transaction[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Transaction;
            list.push({
              ...data,
              id: d.id,
            });
          });
          // Sort latest transactions first
          list.sort((a, b) => {
            const dtA = `${a.date} ${a.time || '00:00'}`;
            const dtB = `${b.date} ${b.time || '00:00'}`;
            return dtB.localeCompare(dtA);
          });
          setTransactions(list);
          setSyncStatus('synced');
          setAppSettings((prev) => ({
            ...prev,
            lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          }));
        }, (error) => {
          console.error('Transactions sync error:', error);
          setSyncError('Gagal menyinkronkan transaksi dari cloud.');
          setSyncStatus('error');
        });

        // 3. Categories Listener
        unsubCategories = onSnapshot(categoriesCol, (snapshot) => {
          const list: Category[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Category);
          });
          setCategories(list);
        });

        // 4. Budgets Listener
        unsubBudgets = onSnapshot(budgetsCol, (snapshot) => {
          const list: Budget[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Budget);
          });
          setBudgets(list);
        });

        // 5. Goals Listener
        unsubGoals = onSnapshot(goalsCol, (snapshot) => {
          const list: FinancialGoal[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as FinancialGoal);
          });
          setGoals(list);
        });

        setAuthLoading(false);
      } else {
        // User is logged out
        setUserProfile(null);
        setTransactions([]);
        setWallets([]);
        setCategories([]);
        setBudgets([]);
        setGoals([]);
        setSyncStatus('idle');
        setAuthLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubWallets?.();
      unsubTransactions?.();
      unsubCategories?.();
      unsubBudgets?.();
      unsubGoals?.();
    };
  }, []);

  // Persist Local Preferences (theme, hideBalance, settings)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HIDE_BALANCE, String(hideBalance));
  }, [hideBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Apply Theme Mode to root HTML document
  useEffect(() => {
    const root = document.documentElement;
    const updateDarkClass = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      updateDarkClass(true);
    } else if (theme === 'light') {
      updateDarkClass(false);
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      updateDarkClass(mq.matches);

      const handler = (e: MediaQueryListEvent) => updateDarkClass(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  // Recalculate dynamic wallet balance from initial balance + transactions
  const recalculatedWallets = useMemo(() => {
    return wallets.map((wallet) => {
      let currentBal = wallet.initialBalance ?? 0;
      
      transactions.forEach((tx) => {
        if (tx.walletId === wallet.id) {
          if (tx.type === 'income') currentBal += tx.amount;
          else if (tx.type === 'expense') currentBal -= tx.amount;
          else if (tx.type === 'transfer') currentBal -= tx.amount;
        }
        if (tx.type === 'transfer' && tx.toWalletId === wallet.id) {
          currentBal += tx.amount;
        }
      });

      return {
        ...wallet,
        balance: currentBal,
      };
    });
  }, [wallets, transactions]);

  // Total Balance across all wallets
  const totalBalance = useMemo(() => {
    return recalculatedWallets.reduce((acc, w) => acc + w.balance, 0);
  }, [recalculatedWallets]);

  // Transactions in current active month
  const activeMonthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(activeMonth));
  }, [transactions, activeMonth]);

  // Total income for active month
  const totalIncome = useMemo(() => {
    return activeMonthTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [activeMonthTransactions]);

  // Total expense for active month
  const totalExpense = useMemo(() => {
    return activeMonthTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [activeMonthTransactions]);

  // Net savings & savings rate
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  // Category expense breakdown for active month
  const categoryExpenseBreakdown = useMemo<CategorySummary[]>(() => {
    const expenseTxs = activeMonthTransactions.filter((tx) => tx.type === 'expense');
    const totalExp = expenseTxs.reduce((sum, tx) => sum + tx.amount, 0);

    const categoryMap: { [catId: string]: { total: number; count: number } } = {};
    expenseTxs.forEach((tx) => {
      if (!categoryMap[tx.categoryId]) {
        categoryMap[tx.categoryId] = { total: 0, count: 0 };
      }
      categoryMap[tx.categoryId].total += tx.amount;
      categoryMap[tx.categoryId].count += 1;
    });

    const breakdown: CategorySummary[] = [];
    Object.keys(categoryMap).forEach((catId) => {
      const cat = categories.find((c) => c.id === catId) || {
        id: catId,
        name: 'Lainnya',
        type: 'expense' as const,
        icon: 'HelpCircle',
        color: '#64748B',
        bgColor: '#F1F5F9',
      };
      const total = categoryMap[catId].total;
      breakdown.push({
        category: cat,
        total,
        percentage: totalExp > 0 ? Math.round((total / totalExp) * 100) : 0,
        count: categoryMap[catId].count,
      });
    });

    return breakdown.sort((a, b) => b.total - a.total);
  }, [activeMonthTransactions, categories]);

  // Category income breakdown for active month
  const categoryIncomeBreakdown = useMemo<CategorySummary[]>(() => {
    const incomeTxs = activeMonthTransactions.filter((tx) => tx.type === 'income');
    const totalInc = incomeTxs.reduce((sum, tx) => sum + tx.amount, 0);

    const categoryMap: { [catId: string]: { total: number; count: number } } = {};
    incomeTxs.forEach((tx) => {
      if (!categoryMap[tx.categoryId]) {
        categoryMap[tx.categoryId] = { total: 0, count: 0 };
      }
      categoryMap[tx.categoryId].total += tx.amount;
      categoryMap[tx.categoryId].count += 1;
    });

    const breakdown: CategorySummary[] = [];
    Object.keys(categoryMap).forEach((catId) => {
      const cat = categories.find((c) => c.id === catId) || {
        id: catId,
        name: 'Pemasukan Lain',
        type: 'income' as const,
        icon: 'HelpCircle',
        color: '#10B981',
        bgColor: '#ECFDF5',
      };
      const total = categoryMap[catId].total;
      breakdown.push({
        category: cat,
        total,
        percentage: totalInc > 0 ? Math.round((total / totalInc) * 100) : 0,
        count: categoryMap[catId].count,
      });
    });

    return breakdown.sort((a, b) => b.total - a.total);
  }, [activeMonthTransactions, categories]);

  // 6 Months Cashflow history
  const monthlyCashflows = useMemo<MonthlyCashflow[]>(() => {
    const [yearStr, monthStr] = activeMonth.split('-');
    const curYear = parseInt(yearStr, 10);
    const curMonth = parseInt(monthStr, 10);

    const result: MonthlyCashflow[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = curMonth - i;
      let y = curYear;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      const mKey = `${y}-${String(m).padStart(2, '0')}`;
      const monthTxs = transactions.filter((tx) => tx.date.startsWith(mKey));
      const inc = monthTxs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
      const exp = monthTxs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

      result.push({
        month: getIndonesianMonthName(mKey).substring(0, 3),
        monthKey: mKey,
        income: inc,
        expense: exp,
        net: inc - exp,
      });
    }
    return result;
  }, [transactions, activeMonth]);

  // UI state toggles
  const openAddModal = (defaultType: TransactionType = 'expense') => {
    setAddModalDefaultType(defaultType);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => setIsAddModalOpen(false);
  const toggleHideBalance = () => setHideBalance((prev) => !prev);

  // Firestore Sync Helpers
  const getUserId = () => userProfile?.id;

  // Transaction CRUD (Firestore Synced)
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const uid = getUserId();
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };

    // Optimistic local state update
    setTransactions((prev) => [newTx, ...prev]);

    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'transactions', newTx.id), newTx);
      } catch (err) {
        console.error('Failed to save transaction to Cloud Firestore:', err);
      }
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    const uid = getUserId();
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...data } : tx)));

    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'transactions', id), data, { merge: true });
      } catch (err) {
        console.error('Failed to update transaction in Firestore:', err);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    const uid = getUserId();
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    if (uid) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'transactions', id));
      } catch (err) {
        console.error('Failed to delete transaction in Firestore:', err);
      }
    }
  };

  // Wallet CRUD (Firestore Synced)
  const addWallet = async (wallet: Omit<Wallet, 'id'>) => {
    const uid = getUserId();
    const newWallet: Wallet = {
      ...wallet,
      id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      initialBalance: wallet.initialBalance ?? wallet.balance,
    };

    setWallets((prev) => [...prev, newWallet]);

    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'wallets', newWallet.id), newWallet);
      } catch (err) {
        console.error('Failed to save wallet to Firestore:', err);
      }
    }
  };

  const updateWallet = async (id: string, data: Partial<Wallet>) => {
    const uid = getUserId();
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));

    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'wallets', id), data, { merge: true });
      } catch (err) {
        console.error('Failed to update wallet in Firestore:', err);
      }
    }
  };

  const deleteWallet = async (id: string) => {
    const uid = getUserId();
    setWallets((prev) => prev.filter((w) => w.id !== id));

    if (uid) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'wallets', id));
      } catch (err) {
        console.error('Failed to delete wallet in Firestore:', err);
      }
    }
  };

  // Category CRUD (Firestore Synced)
  const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
    const uid = getUserId();
    const newCat: Category = {
      ...category,
      id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };
    setCategories((prev) => [...prev, newCat]);

    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'categories', newCat.id), newCat);
      } catch (err) {
        console.error('Failed to save category to Firestore:', err);
      }
    }
    return newCat;
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    const uid = getUserId();
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));

    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'categories', id), data, { merge: true });
      } catch (err) {
        console.error('Failed to update category in Firestore:', err);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    const uid = getUserId();
    setCategories((prev) => prev.filter((c) => c.id !== id));

    if (uid) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'categories', id));
      } catch (err) {
        console.error('Failed to delete category in Firestore:', err);
      }
    }
  };

  // Budget CRUD (Firestore Synced)
  const saveBudget = async (categoryId: string, amount: number, month = activeMonth) => {
    const uid = getUserId();
    let budgetId = `b-${Date.now()}`;
    const existing = budgets.find((b) => b.categoryId === categoryId && b.month === month);
    if (existing) {
      budgetId = existing.id;
    }

    const newBudget: Budget = {
      id: budgetId,
      categoryId,
      amount,
      month,
    };

    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.id === budgetId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newBudget;
        return next;
      }
      return [...prev, newBudget];
    });

    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'budgets', budgetId), newBudget);
      } catch (err) {
        console.error('Failed to save budget in Firestore:', err);
      }
    }
  };

  const deleteBudget = async (id: string) => {
    const uid = getUserId();
    setBudgets((prev) => prev.filter((b) => b.id !== id));

    if (uid) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'budgets', id));
      } catch (err) {
        console.error('Failed to delete budget in Firestore:', err);
      }
    }
  };

  // Goal CRUD (Firestore Synced)
  const addGoal = async (goal: Omit<FinancialGoal, 'id'>) => {
    const uid = getUserId();
    const newGoal: FinancialGoal = {
      ...goal,
      id: `g-${Date.now()}`,
    };
    setGoals((prev) => [...prev, newGoal]);

    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'goals', newGoal.id), newGoal);
      } catch (err) {
        console.error('Failed to save goal to Firestore:', err);
      }
    }
  };

  const updateGoal = async (id: string, data: Partial<FinancialGoal>) => {
    const uid = getUserId();
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)));

    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'goals', id), data, { merge: true });
      } catch (err) {
        console.error('Failed to update goal in Firestore:', err);
      }
    }
  };

  const deleteGoal = async (id: string) => {
    const uid = getUserId();
    setGoals((prev) => prev.filter((g) => g.id !== id));

    if (uid) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'goals', id));
      } catch (err) {
        console.error('Failed to delete goal in Firestore:', err);
      }
    }
  };

  // Reset & Clear (Firestore batch synced)
  const resetToDefaultData = async () => {
    const uid = getUserId();
    if (!uid) return;

    try {
      const batch = writeBatch(db);
      // Delete existing transactions
      transactions.forEach((tx) => {
        batch.delete(doc(db, 'users', uid, 'transactions', tx.id));
      });
      // Set initial wallets
      INITIAL_WALLETS.forEach((w) => {
        batch.set(doc(db, 'users', uid, 'wallets', w.id), w);
      });
      await batch.commit();
      setTransactions([]);
      setWallets(INITIAL_WALLETS);
      setActiveMonth(getCurrentMonthKey());
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const clearAllData = async () => {
    const uid = getUserId();
    if (!uid) return;

    try {
      const batch = writeBatch(db);
      transactions.forEach((tx) => batch.delete(doc(db, 'users', uid, 'transactions', tx.id)));
      budgets.forEach((b) => batch.delete(doc(db, 'users', uid, 'budgets', b.id)));
      goals.forEach((g) => batch.delete(doc(db, 'users', uid, 'goals', g.id)));
      await batch.commit();

      setTransactions([]);
      setBudgets([]);
      setGoals([]);
    } catch (err) {
      console.error('Clear all data error:', err);
    }
  };

  const exportToJSON = () => {
    const backupData = {
      version: '2.0',
      user: userProfile?.email,
      exportedAt: new Date().toISOString(),
      transactions,
      wallets,
      categories,
      budgets,
      goals,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-keuangan-backup-${getCurrentRealtimeDateTime().date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Tanggal', 'Waktu', 'Tipe', 'Nominal', 'Kategori', 'Dompet Asal', 'Dompet Tujuan', 'Catatan'];
    const rows = transactions.map((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId)?.name || tx.categoryId || '-';
      const w = wallets.find((w) => w.id === tx.walletId)?.name || tx.walletId || '-';
      const toW = tx.toWalletId ? wallets.find((w) => w.id === tx.toWalletId)?.name || tx.toWalletId : '-';
      return [
        tx.id,
        tx.date,
        tx.time || '',
        tx.type,
        tx.amount,
        `"${cat}"`,
        `"${w}"`,
        `"${toW}"`,
        `"${(tx.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-transaksi-${getCurrentMonthKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromJSON = async (jsonString: string): Promise<boolean> => {
    const uid = getUserId();
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.wallets)) setWallets(data.wallets);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (Array.isArray(data.budgets)) setBudgets(data.budgets);
      if (Array.isArray(data.goals)) setGoals(data.goals);

      // Save to Firestore in batch if user is authenticated
      if (uid) {
        const batch = writeBatch(db);
        if (Array.isArray(data.transactions)) {
          data.transactions.forEach((tx: Transaction) => {
            batch.set(doc(db, 'users', uid, 'transactions', tx.id), tx);
          });
        }
        if (Array.isArray(data.wallets)) {
          data.wallets.forEach((w: Wallet) => {
            batch.set(doc(db, 'users', uid, 'wallets', w.id), w);
          });
        }
        await batch.commit();
      }
      return true;
    } catch {
      return false;
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setAppSettings((prev) => ({ ...prev, theme: newTheme }));
  };

  const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    setAppSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.theme && newSettings.theme !== theme) {
        setThemeState(newSettings.theme);
      }
      return updated;
    });
  };

  // Google Login via Firebase Auth
  const loginWithGoogle = async (customUser?: Partial<UserProfile>): Promise<boolean> => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      return !!res.user;
    } catch (err: any) {
      console.warn('signInWithPopup failed:', err);
      // Fallback for sandboxed iframe test accounts if popup is blocked
      if (customUser && customUser.email) {
        const profile: UserProfile = {
          id: customUser.id || `usr-google-${Date.now()}`,
          name: customUser.name || 'Daffa Kazhim',
          email: customUser.email,
          avatarUrl: customUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          isGoogleLinked: true,
          linkedAt: new Date().toISOString(),
        };
        setUserProfile(profile);
        return true;
      }
      throw err;
    }
  };

  // Google Login with Credential (e.g. from Google Identity Services / GSI)
  const loginWithGoogleCredential = async (idToken: string): Promise<boolean> => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const res = await signInWithCredential(auth, credential);
      return !!res.user;
    } catch (err: any) {
      console.error('signInWithCredential failed:', err);
      throw err;
    }
  };

  // Google Sign Out via Firebase Auth
  const logoutGoogle = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setUserProfile(null);
    setTransactions([]);
    setWallets([]);
    setCategories([]);
    setBudgets([]);
    setGoals([]);
    setSyncStatus('idle');
  };

  // Cloud Sync Manual Trigger
  const syncWithGoogleCloud = async (): Promise<boolean> => {
    if (!userProfile?.id) return false;
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'users', userProfile.id), {
        lastSyncedAt: new Date().toISOString(),
      }, { merge: true });

      setAppSettings((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }));
      setSyncStatus('synced');
      return true;
    } catch (err) {
      console.error('Manual sync failed:', err);
      setSyncStatus('error');
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        wallets: recalculatedWallets,
        categories,
        budgets,
        goals,
        activeTab,
        activeMonth,
        isAddModalOpen,
        addModalDefaultType,
        hideBalance,

        userProfile,
        authLoading,
        syncStatus,
        syncError,
        appSettings,
        theme,
        setUserProfile,
        setTheme,
        updateAppSettings,
        loginWithGoogle,
        loginWithGoogleCredential,
        logoutGoogle,
        syncWithGoogleCloud,

        setActiveTab,
        setActiveMonth,
        openAddModal,
        closeAddModal,
        toggleHideBalance,

        addTransaction,
        updateTransaction,
        deleteTransaction,

        addWallet,
        updateWallet,
        deleteWallet,

        addCategory,
        updateCategory,
        deleteCategory,

        saveBudget,
        deleteBudget,

        addGoal,
        updateGoal,
        deleteGoal,

        resetToDefaultData,
        clearAllData,
        exportToJSON,
        exportToCSV,
        importFromJSON,

        totalBalance,
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        categoryExpenseBreakdown,
        categoryIncomeBreakdown,
        monthlyCashflows,
        activeMonthTransactions,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
