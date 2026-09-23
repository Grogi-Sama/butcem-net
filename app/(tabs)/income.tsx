import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { TransactionRow } from '@/components/TransactionRow';
import { formatCurrency, getCurrentPeriod, isSamePeriod, periodLabel } from '@/lib/date';

export default function IncomeScreen() {
  const theme = useTheme();
  const { transactionsByType, deleteTransaction } = useAppData();
  const period = getCurrentPeriod();

  const income = transactionsByType('income').sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const monthTotal = income
    .filter((t) => isSamePeriod(t.date, period))
    .reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: theme.subtext }]}>{periodLabel(period)} toplam gelir</Text>
        <Text style={[styles.headerValue, { color: theme.income }]}>{formatCurrency(monthTotal)}</Text>
      </View>

      <FlatList
        data={income}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Card>
            <Text style={{ color: theme.subtext, textAlign: 'center' }}>
              Henüz gelir eklemedin. Sağ alttaki + butonuyla ekleyebilirsin.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={{ paddingVertical: 0, marginBottom: 8 }}>
            <TransactionRow
              transaction={item}
              onPress={() =>
                router.push({ pathname: '/transaction-form', params: { type: 'income', id: item.id } })
              }
              onDelete={() => deleteTransaction(item.id)}
            />
          </Card>
        )}
      />

      <Pressable
        onPress={() => router.push({ pathname: '/transaction-form', params: { type: 'income' } })}
        style={[styles.fab, { backgroundColor: theme.income }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerLabel: { fontSize: 13, fontWeight: '600' },
  headerValue: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  listContent: { padding: 16, paddingTop: 8, paddingBottom: 96 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
