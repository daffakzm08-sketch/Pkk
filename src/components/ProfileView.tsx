import React, { useState } from 'react';
import {
  User,
  Sun,
  Moon,
  Laptop,
  Eye,
  EyeOff,
  Bell,
  Cloud,
  CloudCheck,
  RefreshCw,
  LogOut,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Trash2,
  Target,
  Sparkles,
  ExternalLink,
  HelpCircle,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { ThemeMode } from '../types';

export const ProfileView: React.FC = () => {
  const {
    userProfile,
    theme,
    setTheme,
    appSettings,
    updateAppSettings,
    loginWithGoogle,
    logoutGoogle,
    syncWithGoogleCloud,
    hideBalance,
    toggleHideBalance,
    exportToCSV,
    exportToJSON,
    importFromJSON,
    resetToDefaultData,
    clearAllData,
    setActiveTab,
  } = useFinance();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('daffakzm@gmail.com');
  const [googleNameInput, setGoogleNameInput] = useState('Daffa Kazhim');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await syncWithGoogleCloud();
    setIsSyncing(false);
    setSyncSuccessMsg('Data berhasil disinkronkan ke Google Cloud!');
    setTimeout(() => setSyncSuccessMsg(null), 3000);
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim()) return;
    await loginWithGoogle({
      name: googleNameInput.trim() || 'Pengguna Google',
      email: googleEmailInput.trim(),
    });
    setIsLoginModalOpen(false);
    setSyncSuccessMsg('Berhasil masuk dengan Akun Google!');
    setTimeout(() => setSyncSuccessMsg(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importFromJSON(text);
        if (success) {
          setImportStatus('Data berhasil dipulihkan!');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          alert('Format file cadangan tidak valid.');
        }
      } catch {
        alert('Gagal membaca file.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Muat ulang data contoh? Data yang ada akan diganti dengan data simulasi.')) {
      resetToDefaultData();
      alert('Data contoh berhasil dimuat.');
    }
  };

  const handleClear = () => {
    if (confirm('Peringatan: Kosongkan seluruh data transaksi? Tindakan ini tidak dapat dibatalkan.')) {
      clearAllData();
      alert('Semua data berhasil dikosongkan.');
    }
  };

  return (
    <div id="view-profile" className="space-y-4 pb-20">
      {/* 1. Profil & Akun Google */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
        {userProfile && userProfile.isGoogleLinked ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Akun Terhubung
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                Google Verified
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={userProfile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={userProfile.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 shadow-xs"
                />
                {/* Official Google 'G' mini badge */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {userProfile.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                  {userProfile.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <Cloud className="w-3 h-3 text-emerald-500" />
                  <span>Sinkron: {appSettings.lastSyncedAt || 'Baru saja'} WIB</span>
                </div>
              </div>
            </div>

            {/* Sync Feedback */}
            {syncSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{syncSuccessMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                id="btn-sync-cloud"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Sekarang'}</span>
              </button>

              <button
                id="btn-logout-google"
                onClick={async () => {
                  if (confirm('Keluar dari Akun Google? Sesi akan ditutup dan data tetap tersimpan aman di Cloud Firestore.')) {
                    await logoutGoogle();
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200/70 dark:border-rose-800 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto shadow-xs">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Masuk dengan Akun Google
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Sinkronkan pencatatan transaksi secara aman ke cloud, otomatis cadangkan data, dan buka di mana saja.
              </p>
            </div>
            <button
              id="btn-google-login"
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Pengaturan Tema Tampilan (Gelap / Terang / Sistem) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Tema Tampilan
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih mode tema gelap, terang, atau otomatis ikuti sistem
            </p>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {theme === 'dark' ? 'Gelap' : theme === 'light' ? 'Terang' : 'Sistem'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            {
              id: 'light' as ThemeMode,
              label: 'Terang',
              icon: Sun,
              desc: 'Tampilan cerah',
              bgClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
            },
            {
              id: 'dark' as ThemeMode,
              label: 'Gelap',
              icon: Moon,
              desc: 'Nyaman di malam',
              bgClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
            },
            {
              id: 'system' as ThemeMode,
              label: 'Sistem',
              icon: Laptop,
              desc: 'Otomatis OS',
              bgClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                id={`btn-theme-${item.id}`}
                onClick={() => setTheme(item.id)}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                  isSelected
                    ? 'border-slate-900 dark:border-white bg-slate-900/5 dark:bg-white/10 ring-2 ring-slate-900/10 dark:ring-white/15'
                    : 'border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.bgClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Preferensi & Privasi */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3.5 transition-colors">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Preferensi & Privasi
        </h3>

        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Sembunyikan Saldo */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Sensor Saldo Utama
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Sembunyikan nominal saldo di Beranda
                </p>
              </div>
            </div>
            <button
              id="toggle-hide-balance"
              onClick={toggleHideBalance}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                hideBalance ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white dark:bg-slate-900 shadow-xs transition-transform ${
                  hideBalance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Pengingat Harian */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Pengingat Catat Harian
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Notifikasi rekap keuangan setiap {appSettings.reminderTime || '20:00'} WIB
                </p>
              </div>
            </div>
            <button
              id="toggle-daily-reminder"
              onClick={() =>
                updateAppSettings({ enableDailyReminder: !appSettings.enableDailyReminder })
              }
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                appSettings.enableDailyReminder
                  ? 'bg-slate-900 dark:bg-white'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white dark:bg-slate-900 shadow-xs transition-transform ${
                  appSettings.enableDailyReminder ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Akses Anggaran & Target Finansial */}
          <div className="pt-3">
            <button
              onClick={() => setActiveTab('budgets')}
              className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Batas Anggaran Kategori
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Atur batas belanja bulanan & tabungan impian
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Cadangan & Ekspor Data */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Cadangan & Ekspor Data
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Unduh catatan keuangan dalam format Excel/CSV atau buat file cadangan JSON.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            id="btn-export-csv"
            onClick={exportToCSV}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Ekspor CSV / Excel</span>
          </button>

          <button
            id="btn-export-json"
            onClick={exportToJSON}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-colors"
          >
            <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Backup JSON</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Pulihkan dari File Backup JSON
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-700 cursor-pointer"
          />
          {importStatus && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> {importStatus}
            </p>
          )}
        </div>
      </div>

      {/* 5. Kelola Database & Keluar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2.5 transition-colors">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Kelola Database & Akun
        </h3>

        <button
          onClick={handleReset}
          className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Muat Ulang Data Simulasi (Demo)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={handleClear}
          className="w-full p-3 rounded-2xl bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-100 dark:border-rose-900 text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Kosongkan Seluruh Riwayat Transaksi</span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400" />
        </button>

        {userProfile && (
          <button
            onClick={() => {
              if (confirm('Keluar dari akun Google? Data transaksi Anda tetap tersimpan di perangkat ini.')) {
                logoutGoogle();
              }
            }}
            className="w-full p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between transition-colors mt-1"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Keluar dari Akun Google</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Info Aplikasi */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-2">
        <p className="font-semibold text-slate-600 dark:text-slate-400">Rekap Keuangan v1.0</p>
        <p className="text-[11px] mt-0.5">Mode Gelap & Terang • Sinkronisasi Google • Aman & Privat</p>
      </div>

      {/* Modal Google Sign-In */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Masuk dengan Google
                </h3>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Akun
                </label>
                <input
                  type="text"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  placeholder="Contoh: Daffa Kazhim"
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Akun Google
                </label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="nama@gmail.com"
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Quick account switch button */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center">
                    DK
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">daffakzm@gmail.com</p>
                    <p className="text-[10px] text-slate-400">Akun Terdaftar</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGoogleEmailInput('daffakzm@gmail.com');
                    setGoogleNameInput('Daffa Kazhim');
                  }}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Pilih Ini
                </button>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-xs"
                >
                  Hubungkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
