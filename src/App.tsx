/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { BottomNavigation } from './components/BottomNavigation';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { WalletsView } from './components/WalletsView';
import { BudgetsAndWalletsView } from './components/BudgetsAndWalletsView';
import { ProfileView } from './components/ProfileView';
import { SettingsAndExportView } from './components/SettingsAndExportView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { LoginScreen } from './components/LoginScreen';
import { WalletCards, RefreshCw } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    userProfile,
    authLoading,
    activeTab,
    isAddModalOpen,
    addModalDefaultType,
    closeAddModal,
  } = useFinance();

  // 1. Loading state while checking Google auth status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md mb-3 animate-pulse">
          <WalletCards className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
          <span>Memeriksa Akun Google...</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          Menghubungkan ke Cloud Firestore
        </p>
      </div>
    );
  }

  // 2. Mandatory Auth Gate: Must sign in with Google before using the app
  if (!userProfile) {
    return <LoginScreen />;
  }

  // 3. Main Application when authenticated
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-slate-900 selection:text-white dark:selection:bg-slate-100 dark:selection:text-slate-900 transition-colors duration-200">
      {/* Main Viewport Container */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-5 pb-24">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'wallets' && <WalletsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'budgets' && <BudgetsAndWalletsView />}
        {activeTab === 'settings' && <SettingsAndExportView />}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNavigation />

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        initialType={addModalDefaultType}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
