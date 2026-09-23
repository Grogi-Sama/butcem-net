import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';

import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { DonutChart } from '@/components/DonutChart';
import { getCategoryById } from '@/lib/categories';
import { formatCurrency, getCurrentPeriod, getRecentPeriods, periodLabel, periodLabelShort } from '@/lib/date';
import { getExpenseForPeriod, getIncomeForPeriod, sumEntries } from '@/lib/summary';

const screenWidth = Dimensions.get('window').width;
const CATEGORY_COLORS = [
  '#4f46e5', '#dc2626', '#16a34a', '#f59e0b', '#0ea5e9',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#64748b',
];

export default function AnalysisScreen() {
  const theme = useTheme();
  const { transactions, payments } = useAppData();
  const period = getCurrentPeriod();

  const incomeEntries = getIncomeForPeriod(transactions, period);
  const expenseEntries = getExpenseForPeriod(transactions, payments, period);
  const totalIncome = sumEntries(incomeEntries);
  const totalExpense = sumEntries(expenseEntries);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  const categoryTotals = new Map<string, number>();
  expenseEntries.forEach(({ transaction, amount }) =>
    categoryTotals.set(transaction.categoryId, (categoryTotals.get(transaction.categoryId) ?? 0) + amount)
  );
  const expenseByCategory = Array.from(categoryTotals.entries())
    .map(([categoryId, amount], i) => ({
      categoryId,
      amount,
      name: getCategoryById(categoryId)?.name ?? 'Diğer',
      icon: getCategoryById(categoryId)?.icon ?? '❔',
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  const trend = getRecentPeriods(6).map((p) => ({
    period: p,
    income: sumEntries(getIncomeForPeriod(transactions, p)),
    expense: sumEntries(getExpenseForPeriod(transactions, payments, p)),
  }));

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    labelColor: () => theme.subtext,
    propsForBackgroundLines: { stroke: theme.border },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.periodLabel, { color: theme.subtext }]}>{periodLabel(period)}</Text>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Gelir</Text>
            <Text style={[styles.statValue, { color: theme.income }]}>{formatCurrency(totalIncome)}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Gider</Text>
            <Text style={[styles.statValue, { color: theme.expense }]}>{formatCurrency(totalExpense)}</Text>
          </Card>
        </View>

        <Card>
          <Text style={[styles.statLabel, { color: theme.subtext }]}>Net Bakiye</Text>
          <Text style={[styles.balanceValue, { color: balance >= 0 ? theme.income : theme.expense }]}>
            {formatCurrency(balance)}
          </Text>
          <Text style={[styles.savingsText, { color: theme.subtext }]}>
            {totalIncome > 0
              ? `Gelirinin %${savingsRate} kadarı elinde kaldı.`
              : 'Bu ay henüz gelir girilmedi.'}
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Son 6 Ay: Gelir & Gider</Text>
          <Card>
            {totalIncome + totalExpense === 0 && trend.every((t) => t.income + t.expense === 0) ? (
              <Text style={{ color: theme.subtext, textAlign: 'center' }}>Grafik için henüz veri yok.</Text>
            ) : (
              <LineChart
                data={{
                  labels: trend.map((t) => periodLabelShort(t.period)),
                  datasets: [
                    { data: trend.map((t) => t.income), color: () => theme.income, strokeWidth: 2 },
                    { data: trend.map((t) => t.expense), color: () => theme.expense, strokeWidth: 2 },
                  ],
                  legend: ['Gelir', 'Gider'],
                }}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 12 }}
              />
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Kategoriye Göre Giderler</Text>
          <Card>
            {expenseByCategory.length === 0 ? (
              <Text style={{ color: theme.subtext, textAlign: 'center' }}>
                Bu ay henüz gider girilmedi.
              </Text>
            ) : (
              <>
                <View style={styles.donutWrap}>
                  <DonutChart
                    data={expenseByCategory.map((c) => ({ key: c.categoryId, value: c.amount, color: c.color }))}
                    size={190}
                    strokeWidth={28}
                    centerValue={formatCurrency(totalExpense)}
                    centerLabel="Toplam Gider"
                  />
                </View>
                <View style={{ marginTop: 4, gap: 8 }}>
                  {expenseByCategory.map((c) => (
                    <View key={c.categoryId} style={styles.legendRow}>
                      <View style={[styles.dot, { backgroundColor: c.color }]} />
                      <Text style={[styles.legendName, { color: theme.text }]}>
                        {c.icon} {c.name}
                      </Text>
                      <Text style={[styles.legendAmount, { color: theme.subtext }]}>
                        {formatCurrency(c.amount)} ·{' '}
                        {totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0}%
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  periodLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1 },
  statLabel: { fontSize: 13, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  balanceValue: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  savingsText: { fontSize: 12, marginTop: 6 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: 13, fontWeight: '600' },
  legendAmount: { fontSize: 12 },
  donutWrap: { alignItems: 'center', paddingVertical: 8 },
});
