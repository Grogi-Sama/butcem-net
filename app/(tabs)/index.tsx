import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { TransactionRow } from '@/components/TransactionRow';
import {
  formatCurrency,
  getCurrentPeriod,
  getDueDateForPeriod,
  daysUntil,
  periodLabel,
  periodLabelShort,
} from '@/lib/date';
import { getCategoryById } from '@/lib/categories';
import {
  getAllTimeTotals,
  getExpenseForPeriod,
  getFutureProjection,
  getIncomeForPeriod,
  sumEntries,
} from '@/lib/summary';

export default function DashboardScreen() {
  const theme = useTheme();
  const { transactions, payments, togglePeriodPaid, deleteTransaction } = useAppData();
  const period = getCurrentPeriod();

  const totalIncome = sumEntries(getIncomeForPeriod(transactions, period));
  const totalExpense = sumEntries(getExpenseForPeriod(transactions, payments, period));
  const balance = totalIncome - totalExpense;

  const allTime = getAllTimeTotals(transactions, payments);
  const forecast = getFutureProjection(transactions, 6);
  const [forecastPage, setForecastPage] = useState(0);
  const forecastPageCount = Math.max(1, Math.ceil(forecast.length / 2));
  const visibleForecast = forecast.slice(forecastPage * 2, forecastPage * 2 + 2);

  const paidBillIds = new Set(payments.filter((p) => p.period === period).map((p) => p.transactionId));
  const upcomingBills = transactions
    .filter((t) => t.type === 'expense' && t.isRecurring && t.dueDay && !paidBillIds.has(t.id))
    .map((t) => ({ tx: t, dueDate: getDueDateForPeriod(t.dueDay!, period) }))
    .filter((b) => daysUntil(b.dueDate) <= 7)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.periodLabel, { color: theme.subtext }]}>{periodLabel(period)}</Text>

        <Card style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
          <Text style={styles.balanceLabel}>Bakiye</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-down-circle" size={16} color="#dcfce7" />
              <Text style={styles.balanceItemText}>{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-up-circle" size={16} color="#fee2e2" />
              <Text style={styles.balanceItemText}>{formatCurrency(totalExpense)}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.quickActions}>
          <Pressable
            onPress={() => router.push({ pathname: '/transaction-form', params: { type: 'income' } })}
            style={[styles.quickBtn, { backgroundColor: theme.incomeSoft }]}
          >
            <Ionicons name="add-circle" size={20} color={theme.income} />
            <Text style={[styles.quickBtnText, { color: theme.income }]}>Gelir Ekle</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/transaction-form', params: { type: 'expense' } })}
            style={[styles.quickBtn, { backgroundColor: theme.expenseSoft }]}
          >
            <Ionicons name="add-circle" size={20} color={theme.expense} />
            <Text style={[styles.quickBtnText, { color: theme.expense }]}>Gider Ekle</Text>
          </Pressable>
        </View>

        {upcomingBills.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Yaklaşan Ödemeler</Text>
            <Card style={{ padding: 4 }}>
              {upcomingBills.map(({ tx, dueDate }) => {
                const category = getCategoryById(tx.categoryId);
                const d = daysUntil(dueDate);
                const dueLabel =
                  d < 0
                    ? `${Math.abs(d)} gün gecikti`
                    : d === 0
                      ? 'Bugün'
                      : d === 1
                        ? 'Yarın'
                        : `${d} gün sonra`;
                return (
                  <Pressable
                    key={tx.id}
                    onPress={() => togglePeriodPaid(tx.id, period)}
                    style={[styles.billRow, { borderColor: theme.border }]}
                  >
                    <Text style={styles.billIcon}>{category?.icon ?? '🔁'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.billName, { color: theme.text }]}>{tx.name}</Text>
                      <Text style={[styles.billMeta, { color: d < 0 ? theme.expense : theme.warning }]}>
                        {dueLabel}
                      </Text>
                    </View>
                    <Text style={[styles.billAmount, { color: theme.text }]}>{formatCurrency(tx.amount)}</Text>
                  </Pressable>
                );
              })}
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Gelecek Aylar (Beklenen)</Text>
          <View style={styles.forecastCarousel}>
            <Pressable
              onPress={() => setForecastPage((p) => Math.max(0, p - 1))}
              disabled={forecastPage === 0}
              style={[
                styles.forecastArrow,
                { backgroundColor: theme.primarySoft, opacity: forecastPage === 0 ? 0.35 : 1 },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={theme.primary} />
            </Pressable>

            <View style={styles.forecastRow}>
              {visibleForecast.map((f) => {
                const net = f.expectedIncome - f.expectedExpense;
                return (
                  <Card key={f.period} style={styles.forecastCard}>
                    <Text style={[styles.forecastMonth, { color: theme.subtext }]}>
                      {periodLabelShort(f.period)}
                    </Text>
                    <View style={styles.forecastLine}>
                      <Ionicons name="arrow-down-circle" size={13} color={theme.income} />
                      <Text style={[styles.forecastValue, { color: theme.income }]} numberOfLines={1}>
                        {formatCurrency(f.expectedIncome)}
                      </Text>
                    </View>
                    <View style={styles.forecastLine}>
                      <Ionicons name="arrow-up-circle" size={13} color={theme.expense} />
                      <Text style={[styles.forecastValue, { color: theme.expense }]} numberOfLines={1}>
                        {formatCurrency(f.expectedExpense)}
                      </Text>
                    </View>
                    <View style={[styles.forecastDivider, { backgroundColor: theme.border }]} />
                    <Text
                      style={[styles.forecastNet, { color: net >= 0 ? theme.income : theme.expense }]}
                      numberOfLines={1}
                    >
                      {formatCurrency(net)}
                    </Text>
                  </Card>
                );
              })}
            </View>

            <Pressable
              onPress={() => setForecastPage((p) => Math.min(forecastPageCount - 1, p + 1))}
              disabled={forecastPage >= forecastPageCount - 1}
              style={[
                styles.forecastArrow,
                {
                  backgroundColor: theme.primarySoft,
                  opacity: forecastPage >= forecastPageCount - 1 ? 0.35 : 1,
                },
              ]}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.primary} />
            </Pressable>
          </View>

          <View style={styles.forecastDots}>
            {Array.from({ length: forecastPageCount }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.forecastDot,
                  { backgroundColor: i === forecastPage ? theme.primary : theme.border },
                ]}
              />
            ))}
          </View>

          <Text style={[styles.forecastHint, { color: theme.subtext }]}>
            Tekrarlayan ödemelerin devam edeceği ve o aya kaydettiğin planlı gelir/giderler varsayılarak
            hesaplandı.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tüm Zamanlar</Text>
          <Card style={[styles.allTimeCard, { borderColor: theme.border }]}>
            <View style={styles.allTimeRow}>
              <View style={styles.allTimeItem}>
                <Text style={[styles.allTimeLabel, { color: theme.subtext }]}>Toplam Gelir</Text>
                <Text style={[styles.allTimeValue, { color: theme.income }]}>
                  {formatCurrency(allTime.income)}
                </Text>
              </View>
              <View style={styles.allTimeItem}>
                <Text style={[styles.allTimeLabel, { color: theme.subtext }]}>Toplam Gider</Text>
                <Text style={[styles.allTimeValue, { color: theme.expense }]}>
                  {formatCurrency(allTime.expense)}
                </Text>
              </View>
            </View>
            <View style={[styles.allTimeDivider, { backgroundColor: theme.border }]} />
            <View style={styles.allTimeNetRow}>
              <Text style={[styles.allTimeNetLabel, { color: theme.text }]}>Genel Net Bakiye</Text>
              <Text
                style={[
                  styles.allTimeNetValue,
                  { color: allTime.balance >= 0 ? theme.income : theme.expense },
                ]}
              >
                {formatCurrency(allTime.balance)}
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Son Hareketler</Text>
          {recent.length === 0 ? (
            <Card>
              <Text style={{ color: theme.subtext, textAlign: 'center' }}>
                Henüz bir gelir veya gider eklemedin.
              </Text>
            </Card>
          ) : (
            <Card style={{ paddingVertical: 4 }}>
              {recent.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onPress={() =>
                    router.push({ pathname: '/transaction-form', params: { type: tx.type, id: tx.id } })
                  }
                  onDelete={() => deleteTransaction(tx.id)}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  periodLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceCard: { gap: 8 },
  balanceLabel: { color: '#e0e7ff', fontSize: 13, fontWeight: '600' },
  balanceValue: { color: '#fff', fontSize: 32, fontWeight: '800' },
  balanceRow: { flexDirection: 'row', gap: 20, marginTop: 4 },
  balanceItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceItemText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  quickBtnText: { fontWeight: '700', fontSize: 14 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  billIcon: { fontSize: 18 },
  billName: { fontSize: 14, fontWeight: '600' },
  billMeta: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  billAmount: { fontSize: 14, fontWeight: '700' },
  forecastCarousel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  forecastArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastRow: { flex: 1, flexDirection: 'row', gap: 10 },
  forecastCard: { flex: 1, gap: 6, minWidth: 0 },
  forecastDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 2 },
  forecastDot: { width: 6, height: 6, borderRadius: 3 },
  forecastMonth: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  forecastLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  forecastValue: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  forecastDivider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  forecastNet: { fontSize: 15, fontWeight: '800' },
  forecastHint: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  allTimeCard: { gap: 12 },
  allTimeRow: { flexDirection: 'row', gap: 20 },
  allTimeItem: { flex: 1 },
  allTimeLabel: { fontSize: 12, fontWeight: '600' },
  allTimeValue: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  allTimeDivider: { height: StyleSheet.hairlineWidth },
  allTimeNetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  allTimeNetLabel: { fontSize: 14, fontWeight: '700' },
  allTimeNetValue: { fontSize: 20, fontWeight: '800' },
});
