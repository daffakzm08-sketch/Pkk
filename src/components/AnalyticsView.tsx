import React, { useState, useMemo } from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Lightbulb,
  FileText,
  Percent,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatRupiah,
  formatCompactRupiah,
  parseMonthKey,
  getIndonesianMonthName,
} from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

export const AnalyticsView: React.FC = () => {
  const {
    activeMonth,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    categoryExpenseBreakdown,
    categoryIncomeBreakdown,
    monthlyCashflows,
    activeMonthTransactions,
    hideBalance,
    exportToCSV,
  } = useFinance();

  const { monthName, year } = parseMonthKey(activeMonth);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  // SVG Donut calculation
  const donutData = useMemo(() => {
    if (categoryExpenseBreakdown.length === 0) return [];
    
    let cumulativeAngle = 0;
    const radius = 64;
    const cx = 90;
    const cy = 90;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;

    return categoryExpenseBreakdown.map((item, index) => {
      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -cumulativeAngle;
      cumulativeAngle += (item.percentage / 100) * circumference;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
        index,
      };
    });
  }, [categoryExpenseBreakdown]);

  // Max value for cashflow chart
  const maxCashflow = useMemo(() => {
    const maxVal = Math.max(
      ...monthlyCashflows.map((m) => Math.max(m.income, m.expense)),
      1000000
    );
    return maxVal;
  }, [monthlyCashflows]);

  // Smart AI Insights based on real spending logic
  const smartInsights = useMemo(() => {
    const insights: { type: 'good' | 'warning' | 'tip'; title: string; text: string }[] = [];

    if (savingsRate >= 20) {
      insights.push({
        type: 'good',
        title: 'Kondisi Keuangan Sehat!',
        text: `Rasio tabungan Anda bulan ini sebesar ${savingsRate}%. Ini melampaui standar ideal aturan 50/30/20 (minimal 20% untuk tabungan/investasi).`,
      });
    } else if (savingsRate > 0) {
      insights.push({
        type: 'warning',
        title: 'Rasio Tabungan Bisa Ditingkatkan',
        text: `Tabungan Anda saat ini ${savingsRate}%. Pertimbangkan mengurangi pengeluaran sekunder untuk mencapai target 20%.`,
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Pengeluaran Melebihi Pemasukan',
        text: `Defisit sebesar ${formatRupiah(Math.abs(netSavings))}. Cek kembali anggaran kategori belanja dan hiburan.`,
      });
    }

    if (categoryExpenseBreakdown.length > 0) {
      const topCat = categoryExpenseBreakdown[0];
      insights.push({
        type: 'tip',
        title: `Pengeluaran Terbesar: ${topCat.category.name}`,
        text: `Mencakup ${topCat.percentage}% (${formatRupiah(topCat.total)}) dari total pengeluaran bulan ini dari ${topCat.count} transaksi.`,
      });
    }

    return insights;
  }, [savingsRate, netSavings, categoryExpenseBreakdown]);

  return (
    <div id="view-analytics" className="space-y-4 pb-20">
      {/* 1. Monthly Summary Stat Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Rekap Arus Kas Bulanan</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">{monthName} {year}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
            {activeMonthTransactions.length} Transaksi
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100/90 dark:border-emerald-800">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Total Masuk</span>
            </div>
            <p className="text-base sm:text-lg font-extrabold text-emerald-900 dark:text-emerald-300">
              {hideBalance ? '••••' : formatRupiah(totalIncome)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100/90 dark:border-rose-800">
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Total Keluar</span>
            </div>
            <p className="text-base sm:text-lg font-extrabold text-rose-900 dark:text-rose-300">
              {hideBalance ? '••••' : formatRupiah(totalExpense)}
            </p>
          </div>
        </div>

        {/* Net Savings Difference */}
        <div className="mt-3 p-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-between border border-transparent dark:border-slate-700">
          <div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">Sisa Bersih (Net Cashflow)</p>
            <p className={`text-base font-extrabold ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {hideBalance ? '••••' : formatRupiah(netSavings)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Tingkat Tabungan</span>
            <span className="text-sm font-extrabold text-emerald-400">{savingsRate}%</span>
          </div>
        </div>
      </div>

      {/* 2. Donut Chart Pengeluaran per Kategori */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          Distribusi Pengeluaran Kategori
        </h3>

        {categoryExpenseBreakdown.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <PieChart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Belum ada pengeluaran pada bulan ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* SVG Donut Visualizer */}
            <div className="flex items-center justify-center py-2 relative">
              <svg width="180" height="180" viewBox="0 0 180 180" className="rotate-[-90deg]">
                {donutData.map((item) => (
                  <circle
                    key={item.category.id}
                    cx="90"
                    cy="90"
                    r="64"
                    fill="transparent"
                    stroke={item.category.color}
                    strokeWidth={activeSegmentIndex === item.index ? 28 : 22}
                    strokeDasharray={item.strokeDasharray}
                    strokeDashoffset={item.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setActiveSegmentIndex(item.index)}
                    onMouseLeave={() => setActiveSegmentIndex(null)}
                    onClick={() => setActiveSegmentIndex(item.index)}
                  />
                ))}
              </svg>

              {/* Center Text inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Total Keluar</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {hideBalance ? '••••' : formatCompactRupiah(totalExpense)}
                </span>
                {activeSegmentIndex !== null && donutData[activeSegmentIndex] && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {donutData[activeSegmentIndex].category.name} ({donutData[activeSegmentIndex].percentage}%)
                  </span>
                )}
              </div>
            </div>

            {/* Category Breakdown Ranking List */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {categoryExpenseBreakdown.map((item, idx) => (
                <div
                  key={item.category.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    activeSegmentIndex === idx
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
                  }`}
                  onMouseEnter={() => setActiveSegmentIndex(idx)}
                  onMouseLeave={() => setActiveSegmentIndex(null)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.category.color }}
                      >
                        <CategoryIcon name={item.category.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {item.category.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{formatRupiah(item.total)}</span>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 ml-1.5">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bar Chart Arus Kas 6 Bulan Terakhir */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Tren Arus Kas 6 Bulan
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Masuk
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Keluar
            </span>
          </div>
        </div>

        <div className="h-40 flex items-end justify-between gap-2 pt-6 px-1 border-b border-slate-100 dark:border-slate-800 pb-2">
          {monthlyCashflows.map((m) => {
            const incHeight = maxCashflow > 0 ? (m.income / maxCashflow) * 100 : 0;
            const expHeight = maxCashflow > 0 ? (m.expense / maxCashflow) * 100 : 0;
            const isCurrent = m.monthKey === activeMonth;

            return (
              <div key={m.monthKey} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                {/* Tooltip */}
                <div className="absolute -top-10 bg-slate-900 dark:bg-slate-800 text-white text-[9px] font-semibold p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md border border-slate-700">
                  <p className="text-emerald-400">Masuk: {formatCompactRupiah(m.income)}</p>
                  <p className="text-rose-400">Keluar: {formatCompactRupiah(m.expense)}</p>
                </div>

                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Income bar */}
                  <div
                    className="w-2.5 sm:w-3 bg-emerald-500 rounded-t-sm transition-all duration-300"
                    style={{ height: `${Math.max(incHeight, 4)}%` }}
                  />
                  {/* Expense bar */}
                  <div
                    className="w-2.5 sm:w-3 bg-rose-500 rounded-t-sm transition-all duration-300"
                    style={{ height: `${Math.max(expHeight, 4)}%` }}
                  />
                </div>

                <span className={`text-[10px] font-medium leading-none ${isCurrent ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Smart Insights & Rekomendasi Finansial */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest">
          <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          <span>Analisis & Catatan Cerdas</span>
        </div>

        <div className="space-y-2.5">
          {smartInsights.map((insight, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
            >
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">{insight.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
