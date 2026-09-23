import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { getCategoryById } from '@/lib/categories';
import { formatCurrency, formatDayMonth, getCurrentPeriod, getDueDateForPeriod } from '@/lib/date';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  transaction: Transaction;
  paid: boolean;
  onPress: () => void;
  onDelete: () => void;
  onTogglePaid: () => void;
}

export function BillRow({ transaction, paid, onPress, onDelete, onTogglePaid }: Props) {
  const theme = useTheme();
  const category = getCategoryById(transaction.categoryId);
  const dueDate = transaction.dueDay ? getDueDateForPeriod(transaction.dueDay, getCurrentPeriod()) : null;

  const handleLongPress = () => {
    Alert.alert('Kaydı sil', `"${transaction.name}" tekrarlayan ödemesini silmek istiyor musun?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [styles.row, { borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.expenseSoft }]}>
        <Text style={styles.icon}>{category?.icon ?? '🔁'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {transaction.name}
        </Text>
        <Text style={[styles.meta, { color: theme.subtext }]} numberOfLines={1}>
          {category?.name ?? 'Diğer'} · Her ayın {transaction.dueDay}. günü
          {dueDate ? ` (${formatDayMonth(dueDate)})` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: theme.expense }]}>{formatCurrency(transaction.amount)}</Text>
        <Pressable
          onPress={onTogglePaid}
          style={[
            styles.badge,
            { backgroundColor: paid ? theme.incomeSoft : theme.warningSoft },
          ]}
        >
          <Ionicons
            name={paid ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={paid ? theme.income : theme.warning}
          />
          <Text style={[styles.badgeText, { color: paid ? theme.income : theme.warning }]}>
            {paid ? 'Ödendi' : 'Bekliyor'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 15, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
