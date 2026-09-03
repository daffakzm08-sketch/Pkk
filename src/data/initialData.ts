import { Category, Wallet, Transaction, Budget, FinancialGoal } from '../types';
import { getTodayDateString, getCurrentMonthKey } from '../utils/formatters';

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'wallet-digital',
    name: 'Digital',
    type: 'digital',
    balance: 0,
    initialBalance: 0,
    color: '#2563EB',
    icon: 'Smartphone',
  },
  {
    id: 'wallet-cash',
    name: 'Cash',
    type: 'cash',
    balance: 0,
    initialBalance: 0,
    color: '#059669',
    icon: 'Banknote',
  },
];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_GOALS: FinancialGoal[] = [];

export function getSampleTransactions(): Transaction[] {
  return [];
}

