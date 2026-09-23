import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { TransactionRow } from '@/components/TransactionRow';
import { BillRow } from '@/components/BillRow';
import { InstallmentGroupRow } from '@/components/InstallmentGroupRow';
import { formatCurrency, getCurrentPeriod, periodLabel } from '@/lib/date';
import { getExpenseForPeriod, sumEntries } from '@/lib/summary';
import { getInstallmentGroups } from '@/lib/installments';

export default function ExpenseScreen() {
  const theme = useTheme();
  const {
    transactions,
    payments,
    transactionsByType,
    deleteTransaction,
    isPeriodPaid,
    togglePeriodPaid,
    deleteInstallmentGroup,
  } = useAppData();
  const period = getCurrentPeriod();

  const expenses = transactionsByType('expense').sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const bills = expenses.filter((t) => t.isRecurring);
  const oneOff = expenses.filter((t) => !t.isRecurring && !t.installment);
  const installmentGroups = getInstallmentGroups(expenses);

  const monthTotal = sumEntries(getExpenseForPeriod(transactions, payments, period));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: theme.subtext }]}>{periodLabel(period)} toplam gider</Text>
        <Text style={[styles.headerValue, { color: theme.expense }]}>{formatCurrency(monthTotal)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {bills.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tekrarlayan Ödemeler</Text>
            <Card style={{ paddingVertical: 0 }}>
              {bills.map((tx) => (
                <BillRow
                  key={tx.id}
                  transaction={tx}
                  paid={isPeriodPaid(tx.id, period)}
                  onPress={() =>
                    router.push({ pathname: '/transaction-form', params: { type: 'expense', id: tx.id } })
                  }
                  onDelete={() => deleteTransaction(tx.id)}
                  onTogglePaid={() => togglePeriodPaid(tx.id, period)}
                />
              ))}
            </Card>
          </View>
        )}

        <Pressable
          onPress={() => router.push({ pathname: '/installment-form' })}
          style={[styles.installmentAddBtn, { borderColor: theme.expense, backgroundColor: theme.expenseSoft }]}
        >
          <Ionicons name="card" size={18} color={theme.expense} />
          <Text style={[styles.installmentAddText, { color: theme.expense }]}>Taksitli Harcama Ekle</Text>
        </Pressable>

        {installmentGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Taksitli Harcamalar</Text>
            <Card style={{ paddingVertical: 0 }}>
              {installmentGroups.map((group) => (
                <InstallmentGroupRow
                  key={group.groupId}
                  group={group}
                  onDelete={() => deleteInstallmentGroup(group.groupId)}
                />
              ))}
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Diğer Giderler</Text>
          {oneOff.length === 0 ? (
            <Card>
              <Text style={{ color: theme.subtext, textAlign: 'center' }}>
                Henüz gider eklemedin. Sağ alttaki + butonuyla ekleyebilirsin.
              </Text>
            </Card>
          ) : (
            <Card style={{ paddingVertical: 0 }}>
              {oneOff.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onPress={() =>
                    router.push({ pathname: '/transaction-form', params: { type: 'expense', id: tx.id } })
                  }
                  onDelete={() => deleteTransaction(tx.id)}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.push({ pathname: '/transaction-form', params: { type: 'expense' } })}
        style={[styles.fab, { backgroundColor: theme.expense }]}
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
  listContent: { padding: 16, paddingTop: 8, paddingBottom: 96, gap: 16 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  installmentAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  installmentAddText: { fontWeight: '700', fontSize: 13 },
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
