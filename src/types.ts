export type TransactionType = 'income' | 'expense' | 'transfer';

export type WalletType = 'cash' | 'digital';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  initialBalance: number;
  color: string;
  icon: string;
  accountNumber?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  icon: string;
  color: string;
  bgColor: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  walletId: string;
  toWalletId?: string; // used when type === 'transfer'
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
  tags?: string[];
  createdAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // YYYY-MM
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isGoogleLinked: boolean;
  linkedAt?: string;
}

export interface AppSettings {
  theme: ThemeMode;
  currency: string;
  hideBalanceOnDashboard: boolean;
  enableDailyReminder: boolean;
  reminderTime: string;
  autoBackupToDrive: boolean;
  lastSyncedAt?: string;
}

export type ActiveTab = 'dashboard' | 'transactions' | 'wallets' | 'analytics' | 'profile' | 'budgets' | 'settings';

export interface CategorySummary {
  category: Category;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthlyCashflow {
  month: string; // "Jan", "Feb", etc.
  monthKey: string; // "2026-01"
  income: number;
  expense: number;
  net: number;
}
