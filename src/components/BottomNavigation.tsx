import React from 'react';
import {
  PenLine,
  ReceiptText,
  WalletCards,
  PieChart,
  User,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { ActiveTab } from '../types';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  const navTabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Catat', icon: PenLine },
    { id: 'transactions', label: 'Transaksi', icon: ReceiptText },
    { id: 'wallets', label: 'Dompet', icon: WalletCards },
    { id: 'analytics', label: 'Rekap', icon: PieChart },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div
      id="bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-sm transition-colors"
    >
      <div className="max-w-lg mx-auto px-2 h-16 grid grid-cols-5 items-center">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] sm:text-[11px] tracking-tight truncate max-w-[56px]">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 bg-slate-900 dark:bg-white rounded-full mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

