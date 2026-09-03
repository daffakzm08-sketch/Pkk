/**
 * Formatting utilities for Indonesian currency, dates, and number representations.
 */

export function formatRupiah(amount: number, options?: { showSign?: boolean; type?: 'income' | 'expense' | 'transfer' }): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount);

  if (options?.showSign) {
    if (options.type === 'income') return `+${formatted}`;
    if (options.type === 'expense') return `-${formatted}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

export function formatCompactRupiah(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace('.0', '')} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)} rb`;
  }
  return `${sign}${abs}`;
}

export function formatDateIndo(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatShortDateIndo(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function getRelativeDateLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = getTodayDateString();
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateToYYYYMMDD(yesterday);

  if (dateStr === todayStr) return 'Hari Ini';
  if (dateStr === yesterdayStr) return 'Kemarin';

  return formatDateIndo(dateStr);
}

export function getTodayDateString(): string {
  const now = new Date();
  return formatDateToYYYYMMDD(now);
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getCurrentTimeWithSecondsString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function getCurrentRealtimeDateTime(): { date: string; time: string } {
  const now = new Date();
  return {
    date: formatDateToYYYYMMDD(now),
    time: getCurrentTimeString(),
  };
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getIndonesianMonthName(input: number | string): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  if (typeof input === 'string') {
    if (input.includes('-')) {
      const parts = input.split('-');
      const mIdx = parseInt(parts[1], 10) - 1;
      return months[mIdx] || '';
    }
    const parsed = parseInt(input, 10);
    if (!isNaN(parsed)) {
      return months[parsed >= 1 && parsed <= 12 ? parsed - 1 : parsed] || '';
    }
    return '';
  }
  return months[input] || '';
}

export function parseMonthKey(monthKey: string): { year: number; monthName: string; monthIndex: number } {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  return {
    year,
    monthName: getIndonesianMonthName(monthIndex),
    monthIndex,
  };
}
