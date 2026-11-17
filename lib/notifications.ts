import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationMapEntry, PaymentRecord, Transaction } from '@/types';
import { storage } from '@/lib/storage';
import { getCurrentPeriod, getDueDateForPeriod } from '@/lib/date';
import { getCategoryById } from '@/lib/categories';

const CHANNEL_ID = 'bills';

// Hours (24h) at which a reminder fires on the due day itself, every 3 hours starting 08:00.
const PAYMENT_DAY_HOURS = [8, 11, 14, 17, 20, 23];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationSetup(): Promise<boolean> {
  // Scheduled local notifications aren't supported in browsers.
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Ödeme Hatırlatmaları',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return requested.granted;
}

async function scheduleAt(date: Date, title: string, body: string): Promise<string | null> {
  if (date.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  });
}

async function cancelIdentifiers(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

/**
 * Recomputes scheduled local notifications for all recurring bills' current period.
 * - Cancels notifications for periods already marked paid, or that are stale (not the current period).
 * - Leaves already-scheduled current-period entries untouched (call cancelBillNotifications first if a bill was edited).
 * - Schedules a reminder 1 day before the due date, plus repeating reminders every 3 hours from 08:00
 *   on the due day itself, stopping once the bill is marked paid.
 */
export async function syncBillNotifications(
  transactions: Transaction[],
  payments: PaymentRecord[]
): Promise<void> {
  const granted = await ensureNotificationSetup();
  if (!granted) return;

  const currentPeriod = getCurrentPeriod();
  let map = await storage.getNotificationMap();
  const bills = transactions.filter((t) => t.type === 'expense' && t.isRecurring && t.dueDay);
  const billIds = new Set(bills.map((b) => b.id));

  const isPaid = (transactionId: string, period: string) =>
    payments.some((p) => p.transactionId === transactionId && p.period === period);

  // Drop entries for deleted bills, paid periods, or periods other than the current one.
  const toDrop = map.filter((entry) => {
    const [transactionId, period] = entry.key.split(':');
    if (!billIds.has(transactionId)) return true;
    if (period !== currentPeriod) return true;
    if (isPaid(transactionId, period)) return true;
    return false;
  });
  for (const entry of toDrop) {
    await cancelIdentifiers(entry.identifiers);
  }
  const dropKeys = new Set(toDrop.map((e) => e.key));
  map = map.filter((e) => !dropKeys.has(e.key));

  // Schedule fresh notifications for unpaid bills that don't have a current-period entry yet.
  const scheduledKeys = new Set(map.map((e) => e.key));
  for (const bill of bills) {
    const key = `${bill.id}:${currentPeriod}`;
    if (scheduledKeys.has(key)) continue;
    if (isPaid(bill.id, currentPeriod)) continue;
    if (!bill.dueDay) continue;

    const category = getCategoryById(bill.categoryId);
    const label = category ? `${category.icon} ${bill.name}` : bill.name;
    const identifiers: string[] = [];

    const reminderDate = getDueDateForPeriod(bill.dueDay, currentPeriod, 9, 0);
    reminderDate.setDate(reminderDate.getDate() - 1);
    const reminderId = await scheduleAt(
      reminderDate,
      'Yaklaşan ödeme',
      `${label} ödemenin son günü yarın.`
    );
    if (reminderId) identifiers.push(reminderId);

    for (const hour of PAYMENT_DAY_HOURS) {
      const dueDate = getDueDateForPeriod(bill.dueDay, currentPeriod, hour, 0);
      const id = await scheduleAt(dueDate, 'Ödeme günü', `${label} için bugün ödeme yapman gerekiyor.`);
      if (id) identifiers.push(id);
    }

    if (identifiers.length > 0) {
      map.push({ key, identifiers });
    }
  }

  await storage.setNotificationMap(map);
}

/** Cancels and removes all scheduled notifications for a specific bill (any period), e.g. before an edit or delete. */
export async function cancelBillNotifications(transactionId: string): Promise<void> {
  const map = await storage.getNotificationMap();
  const toDrop = map.filter((e) => e.key.startsWith(`${transactionId}:`));
  for (const entry of toDrop) {
    await cancelIdentifiers(entry.identifiers);
  }
  const dropKeys = new Set(toDrop.map((e) => e.key));
  await storage.setNotificationMap(map.filter((e) => !dropKeys.has(e.key)));
}
