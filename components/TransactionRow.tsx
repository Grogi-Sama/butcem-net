import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/types';
import { getCategoryById } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/date';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  transaction: Transaction;
  onPress: () => void;
  onDelete: () => void;
}

export function TransactionRow({ transaction, onPress, onDelete }: Props) {
  const theme = useTheme();
  const category = getCategoryById(transaction.categoryId);
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? theme.income : theme.expense;
  const iconBg = isIncome ? theme.incomeSoft : theme.expenseSoft;

  const handleLongPress = () => {
    Alert.alert('Kaydı sil', `"${transaction.name}" kaydını silmek istiyor musun?`, [
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
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Text style={styles.icon}>{category?.icon ?? '❔'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {transaction.name}
        </Text>
        <Text style={[styles.meta, { color: theme.subtext }]} numberOfLines={1}>
          {category?.name ?? 'Diğer'} · {formatDate(transaction.date)}
          {transaction.isRecurring ? ' · Tekrarlayan' : ''}
          {transaction.installment ? ` · Taksit ${transaction.installment.index}/${transaction.installment.total}` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
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
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amount: { fontSize: 15, fontWeight: '700' },
});
