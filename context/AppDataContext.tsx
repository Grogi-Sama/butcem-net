import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PaymentRecord, SavingsGoal, Transaction, TransactionType } from '@/types';
import { storage } from '@/lib/storage';
import { generateId } from '@/lib/id';
import { cancelBillNotifications, syncBillNotifications } from '@/lib/notifications';
import { addMonths, getCurrentPeriod } from '@/lib/date';

export interface InstallmentPurchaseInput {
  name: string;
  categoryId: string;
  totalAmount: number;
  installmentCount: number;
  startDate: Date;
}

interface AppDataContextValue {
  loading: boolean;
  transactions: Transaction[];
  payments: PaymentRecord[];
  goals: SavingsGoal[];
  addTransaction: (input: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, input: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addInstallmentPurchase: (input: InstallmentPurchaseInput) => Promise<void>;
  deleteInstallmentGroup: (groupId: string) => Promise<void>;
  isPeriodPaid: (transactionId: string, period: string) => boolean;
  togglePeriodPaid: (transactionId: string, period: string) => Promise<void>;
  transactionsByType: (type: TransactionType) => Transaction[];
  addGoal: (input: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, input: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    (async () => {
      const [tx, pay, savedGoals] = await Promise.all([
        storage.getTransactions(),
        storage.getPayments(),
        storage.getSavingsGoals(),
      ]);
      setTransactions(tx);
      setPayments(pay);
      setGoals(savedGoals);
      setLoading(false);
      syncBillNotifications(tx, pay);
    })();
  }, []);

  const persistTransactions = useCallback(async (next: Transaction[]) => {
    setTransactions(next);
    await storage.setTransactions(next);
  }, []);

  const persistPayments = useCallback(async (next: PaymentRecord[]) => {
    setPayments(next);
    await storage.setPayments(next);
  }, []);

  const persistGoals = useCallback(async (next: SavingsGoal[]) => {
    setGoals(next);
    await storage.setSavingsGoals(next);
  }, []);

  const addTransaction = useCallback(
    async (input: Omit<Transaction, 'id' | 'createdAt'>) => {
      const tx: Transaction = { ...input, id: generateId(), createdAt: new Date().toISOString() };
      const next = [tx, ...transactions];
      await persistTransactions(next);
      await syncBillNotifications(next, payments);
    },
    [transactions, payments, persistTransactions]
  );

  const updateTransaction = useCallback(
    async (id: string, input: Omit<Transaction, 'id' | 'createdAt'>) => {
      const existing = transactions.find((t) => t.id === id);
      if (!existing) return;
      const next = transactions.map((t) => (t.id === id ? { ...existing, ...input } : t));
      await cancelBillNotifications(id);
      await persistTransactions(next);
      await syncBillNotifications(next, payments);
    },
    [transactions, payments, persistTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await cancelBillNotifications(id);
      const next = transactions.filter((t) => t.id !== id);
      const nextPayments = payments.filter((p) => p.transactionId !== id);
      await persistTransactions(next);
      await persistPayments(nextPayments);
      await syncBillNotifications(next, nextPayments);
    },
    [transactions, payments, persistTransactions, persistPayments]
  );

  const addInstallmentPurchase = useCallback(
    async (input: InstallmentPurchaseInput) => {
      const groupId = generateId();
      const base = Math.floor((input.totalAmount / input.installmentCount) * 100) / 100;
      const rounding = Math.round((input.totalAmount - base * input.installmentCount) * 100) / 100;

      const newTransactions: Transaction[] = Array.from({ length: input.installmentCount }, (_, i) => {
        const isLast = i === input.installmentCount - 1;
        const date = addMonths(input.startDate, i);
        return {
          id: generateId(),
          type: 'expense',
          name: input.name,
          categoryId: input.categoryId,
          amount: isLast ? Math.round((base + rounding) * 100) / 100 : base,
          date: date.toISOString(),
          isRecurring: false,
          installment: { groupId, index: i + 1, total: input.installmentCount },
          createdAt: new Date().toISOString(),
        };
      });

      const next = [...newTransactions, ...transactions];
      await persistTransactions(next);
    },
    [transactions, persistTransactions]
  );

  const deleteInstallmentGroup = useCallback(
    async (groupId: string) => {
      const next = transactions.filter((t) => t.installment?.groupId !== groupId);
      await persistTransactions(next);
    },
    [transactions, persistTransactions]
  );

  const isPeriodPaid = useCallback(
    (transactionId: string, period: string) =>
      payments.some((p) => p.transactionId === transactionId && p.period === period),
    [payments]
  );

  const togglePeriodPaid = useCallback(
    async (transactionId: string, period: string) => {
      const alreadyPaid = payments.some((p) => p.transactionId === transactionId && p.period === period);
      const next = alreadyPaid
        ? payments.filter((p) => !(p.transactionId === transactionId && p.period === period))
        : [...payments, { transactionId, period, paidAt: new Date().toISOString() }];
      await persistPayments(next);
      if (period === getCurrentPeriod()) {
        await syncBillNotifications(transactions, next);
      }
    },
    [payments, transactions, persistPayments]
  );

  const transactionsByType = useCallback(
    (type: TransactionType) => transactions.filter((t) => t.type === type),
    [transactions]
  );

  const addGoal = useCallback(
    async (input: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
      const goal: SavingsGoal = { ...input, id: generateId(), createdAt: new Date().toISOString() };
      await persistGoals([goal, ...goals]);
    },
    [goals, persistGoals]
  );

  const updateGoal = useCallback(
    async (id: string, input: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
      const existing = goals.find((g) => g.id === id);
      if (!existing) return;
      const next = goals.map((g) => (g.id === id ? { ...existing, ...input } : g));
      await persistGoals(next);
    },
    [goals, persistGoals]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      await persistGoals(goals.filter((g) => g.id !== id));
    },
    [goals, persistGoals]
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      loading,
      transactions,
      payments,
      goals,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addInstallmentPurchase,
      deleteInstallmentGroup,
      isPeriodPaid,
      togglePeriodPaid,
      transactionsByType,
      addGoal,
      updateGoal,
      deleteGoal,
    }),
    [
      loading,
      transactions,
      payments,
      goals,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addInstallmentPurchase,
      deleteInstallmentGroup,
      isPeriodPaid,
      togglePeriodPaid,
      transactionsByType,
      addGoal,
      updateGoal,
      deleteGoal,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider');
  return ctx;
}
