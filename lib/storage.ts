import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationMapEntry, PaymentRecord, SavingsGoal, Transaction } from '@/types';

const KEYS = {
  transactions: 'butcem:transactions',
  payments: 'butcem:payments',
  notificationMap: 'butcem:notification_map',
  savingsGoals: 'butcem:savings_goals',
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getTransactions: () => readJson<Transaction[]>(KEYS.transactions, []),
  setTransactions: (value: Transaction[]) => writeJson(KEYS.transactions, value),

  getPayments: () => readJson<PaymentRecord[]>(KEYS.payments, []),
  setPayments: (value: PaymentRecord[]) => writeJson(KEYS.payments, value),

  getNotificationMap: () => readJson<NotificationMapEntry[]>(KEYS.notificationMap, []),
  setNotificationMap: (value: NotificationMapEntry[]) => writeJson(KEYS.notificationMap, value),

  getSavingsGoals: () => readJson<SavingsGoal[]>(KEYS.savingsGoals, []),
  setSavingsGoals: (value: SavingsGoal[]) => writeJson(KEYS.savingsGoals, value),
};
