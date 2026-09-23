import { PaymentRecord, Transaction } from '@/types';
import { addPeriods, getCurrentPeriod, isSamePeriod } from '@/lib/date';

export interface PeriodEntry {
  transaction: Transaction;
  amount: number;
}

/** Non-recurring income transactions dated within the given "YYYY-MM" period. */
export function getIncomeForPeriod(transactions: Transaction[], period: string): PeriodEntry[] {
  return transactions
    .filter((t) => t.type === 'income' && isSamePeriod(t.date, period))
    .map((t) => ({ transaction: t, amount: t.amount }));
}

/**
 * Expenses attributed to a period: one-off expenses dated in that period, plus recurring
 * bills whose payment for that period has been marked as paid (unpaid bills don't count yet).
 */
export function getExpenseForPeriod(
  transactions: Transaction[],
  payments: PaymentRecord[],
  period: string
): PeriodEntry[] {
  const oneOff = transactions
    .filter((t) => t.type === 'expense' && !t.isRecurring && isSamePeriod(t.date, period))
    .map((t) => ({ transaction: t, amount: t.amount }));

  const paidBillIds = new Set(payments.filter((p) => p.period === period).map((p) => p.transactionId));
  const recurring = transactions
    .filter((t) => t.type === 'expense' && t.isRecurring && paidBillIds.has(t.id))
    .map((t) => ({ transaction: t, amount: t.amount }));

  return [...oneOff, ...recurring];
}

export function sumEntries(entries: PeriodEntry[]): number {
  return entries.reduce((s, e) => s + e.amount, 0);
}

export interface AllTimeTotals {
  income: number;
  expense: number;
  balance: number;
}

/**
 * Totals since the app started being used: all income ever recorded, plus all expenses —
 * one-off expenses by date, and recurring bills only for periods actually marked paid.
 */
export function getAllTimeTotals(transactions: Transaction[], payments: PaymentRecord[]): AllTimeTotals {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const oneOffExpense = transactions
    .filter((t) => t.type === 'expense' && !t.isRecurring)
    .reduce((s, t) => s + t.amount, 0);

  const billsById = new Map(transactions.filter((t) => t.isRecurring).map((t) => [t.id, t]));
  const paidBillsExpense = payments.reduce((s, p) => {
    const bill = billsById.get(p.transactionId);
    return bill ? s + bill.amount : s;
  }, 0);

  const expense = oneOffExpense + paidBillsExpense;
  return { income, expense, balance: income - expense };
}

export interface FuturePeriodForecast {
  period: string;
  expectedIncome: number;
  expectedExpense: number;
}

/**
 * A forward-looking forecast for the next `monthsAhead` periods: any income/expense already
 * scheduled with a future date, plus every active recurring bill (assumed to repeat at its
 * current amount).
 */
export function getFutureProjection(transactions: Transaction[], monthsAhead: number): FuturePeriodForecast[] {
  const recurringExpenseTotal = transactions
    .filter((t) => t.type === 'expense' && t.isRecurring)
    .reduce((s, t) => s + t.amount, 0);

  const currentPeriod = getCurrentPeriod();
  const periods = Array.from({ length: monthsAhead }, (_, i) => addPeriods(currentPeriod, i + 1));

  return periods.map((period) => {
    const expectedIncome = transactions
      .filter((t) => t.type === 'income' && isSamePeriod(t.date, period))
      .reduce((s, t) => s + t.amount, 0);
    const scheduledExpense = transactions
      .filter((t) => t.type === 'expense' && !t.isRecurring && isSamePeriod(t.date, period))
      .reduce((s, t) => s + t.amount, 0);

    return { period, expectedIncome, expectedExpense: scheduledExpense + recurringExpenseTotal };
  });
}
