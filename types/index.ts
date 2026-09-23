export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
}

export interface InstallmentInfo {
  groupId: string;
  index: number; // 1-based
  total: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  name: string;
  categoryId: string;
  amount: number;
  date: string; // ISO date string — when the transaction was recorded / occurred
  note?: string;
  isRecurring: boolean; // true for bills like Kira, Fatura, Aidat with a monthly due day
  dueDay?: number; // 1-31, only set when isRecurring is true
  installment?: InstallmentInfo; // set when this expense is one part of a multi-month installment purchase
  createdAt: string;
}

export interface PaymentRecord {
  transactionId: string;
  period: string; // "YYYY-MM"
  paidAt: string; // ISO datetime
}

export interface NotificationMapEntry {
  key: string; // `${transactionId}:${period}`
  identifiers: string[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // ISO date, optional
  createdAt: string;
}
