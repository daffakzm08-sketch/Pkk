import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { GOOGLE_CLIENT_ID } from '../lib/firebase';
import { WalletCards, ShieldCheck, RefreshCw, Smartphone, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loginWithGoogleCredential, authLoading } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const gsiRenderedRef = useRef(false);

  // Initialize Google Identity Services (GSI) with new Client ID
  useEffect(() => {
    const initGsi = () => {
      const g = (window as any).google;
      if (g?.accounts?.id && GOOGLE_CLIENT_ID && !gsiRenderedRef.current) {
        try {
          g.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: any) => {
              if (response?.credential) {
                setIsSubmitting(true);
                setErrorMessage(null);
                try {
                  await loginWithGoogleCredential(response.credential);
                } catch (err: any) {
                  console.error('Credential login error:', err);
                  setErrorMessage(err?.message || 'Gagal login dengan kredensial Google.');
                } finally {
                  setIsSubmitting(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const btnContainer = document.getElementById('gsi-button-container');
          if (btnContainer) {
            g.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              width: btnContainer.offsetWidth || 340,
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              locale: 'id',
            });
            gsiRenderedRef.current = true;
          }
        } catch (e) {
          console.warn('GSI init notice:', e);
        }
      }
    };

    initGsi();
    const timer = setTimeout(initGsi, 800);
    return () => clearTimeout(timer);
  }, [loginWithGoogleCredential]);

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const success = await loginWithGoogle();
      if (!success) {
        setErrorMessage('Gagal masuk dengan Google. Silakan coba lagi.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/unauthorized-domain') {
        const g = (window as any).google;
        if (g?.accounts?.id) {
          try {
            g.accounts.id.prompt();
            setErrorMessage('Meminta autentikasi melalui Google Identity Services...');
            return;
          } catch {}
        }
        setErrorMessage(
          'Domain belum diizinkan di Firebase Console. Buka Firebase Console > Authentication > Settings > Authorized Domains dan tambahkan domain Anda.'
        );
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('Jendela pop-up Google terblokir oleh peramban. Izinkan pop-up untuk melanjutkan.');
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Proses login dibatalkan.');
      } else {
        setErrorMessage(err?.message || 'Terjadi kesalahan saat masuk. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-8 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
        
        {/* App Logo & Badge */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mx-auto shadow-md">
            <WalletCards className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Wajib Login Akun Google
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Rekap Keuangan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
              Kelola pencatatan keuangan harian, pisahkan saldo cash dan digital, serta pantau grafik arus kas dengan sinkronisasi cloud real-time.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Sinkronisasi Otomatis Antar-Perangkat
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Data tersimpan di Google Cloud Firestore sehingga tidak akan hilang saat berganti smartphone atau laptop.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pemisahan Dompet Cash & Digital
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Lacak uang tunai fisik di dompet dan saldo e-wallet / rekening bank secara terpisah dan akurat.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Bebas Kesalahan Data
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Aplikasi hanya dapat digunakan setelah login agar riwayat keuangan Anda terikat aman pada akun pribadi Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2.5 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Google Login Action Button */}
        <div className="pt-2 space-y-3">
          <div id="gsi-button-container" className="w-full flex justify-center empty:hidden min-h-0"></div>

          <button
            id="btn-login-google"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || authLoading}
            className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold rounded-2xl text-sm border-2 border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting || authLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-300" />
                <span>Menghubungkan ke Google...</span>
              </>
            ) : (
              <>
                {/* Official Google Vector Logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Masuk dengan Google</span>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            Data Anda dienkripsi dan diamankan oleh Firebase Cloud Security.
          </p>
        </div>

      </div>
    </div>
  );
};
