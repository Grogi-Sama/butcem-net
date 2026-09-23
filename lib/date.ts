const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function getPeriodKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentPeriod(): string {
  return getPeriodKey(new Date());
}

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

/** Resolves a recurring bill's due date within a given "YYYY-MM" period, clamping to the last day of the month. */
export function getDueDateForPeriod(dueDay: number, period: string, hour = 0, minute = 0): Date {
  const [year, month] = period.split('-').map(Number);
  const clampedDay = Math.min(dueDay, daysInMonth(year, month));
  return new Date(year, month - 1, clampedDay, hour, minute, 0, 0);
}

export function addPeriods(period: string, delta: number): string {
  const [year, month] = period.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return getPeriodKey(d);
}

export function getRecentPeriods(count: number): string[] {
  const now = new Date();
  const periods: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    periods.push(getPeriodKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return periods;
}

export function periodLabel(period: string): string {
  const [year, month] = period.split('-').map(Number);
  return `${MONTHS_TR[month - 1]} ${year}`;
}

export function periodLabelShort(period: string): string {
  const [, month] = period.split('-').map(Number);
  return MONTHS_TR[month - 1].slice(0, 3);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]}`;
}

export function isSamePeriod(iso: string, period: string): boolean {
  return getPeriodKey(new Date(iso)) === period;
}

/** Adds `n` calendar months to a date, clamping the day to the target month's length. */
export function addMonths(date: Date, n: number): Date {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1, date.getHours(), date.getMinutes());
  target.setDate(Math.min(day, daysInMonth(target.getFullYear(), target.getMonth() + 1)));
  return target;
}

export function daysUntil(date: Date): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
