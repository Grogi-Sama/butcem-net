import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SavingsGoal } from '@/types';
import { formatCurrency, formatDate } from '@/lib/date';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';

interface Props {
  goal: SavingsGoal;
  onPress: () => void;
  onDelete: () => void;
}

export function GoalCard({ goal, onPress, onDelete }: Props) {
  const theme = useTheme();
  const progress = goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0;
  const completed = progress >= 1;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const handleLongPress = () => {
    Alert.alert('Hedefi sil', `"${goal.name}" hedefini silmek istiyor musun?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Pressable onPress={onPress} onLongPress={handleLongPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
            <Text style={styles.icon}>{goal.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {goal.name}
            </Text>
            {goal.targetDate && (
              <Text style={[styles.date, { color: theme.subtext }]}>Hedef: {formatDate(goal.targetDate)}</Text>
            )}
          </View>
          {completed && (
            <View style={[styles.badge, { backgroundColor: theme.incomeSoft }]}>
              <Text style={[styles.badgeText, { color: theme.income }]}>Tamamlandı</Text>
            </View>
          )}
        </View>

        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: completed ? theme.income : theme.primary },
            ]}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.amountText, { color: theme.text }]}>
            {formatCurrency(goal.currentAmount)}{' '}
            <Text style={{ color: theme.subtext, fontWeight: '600' }}>/ {formatCurrency(goal.targetAmount)}</Text>
          </Text>
          <Text style={[styles.remainingText, { color: theme.subtext }]}>
            {completed ? 'Hedefe ulaşıldı 🎉' : `${formatCurrency(remaining)} kaldı`}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  name: { fontSize: 15, fontWeight: '700' },
  date: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountText: { fontSize: 14, fontWeight: '700' },
  remainingText: { fontSize: 12, fontWeight: '600' },
});
