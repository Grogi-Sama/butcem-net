import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InstallmentGroup } from '@/lib/installments';
import { confirmDestructive } from '@/lib/dialog';
import { getCategoryById } from '@/lib/categories';
import { formatCurrency } from '@/lib/date';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  group: InstallmentGroup;
  onDelete: () => void;
}

export function InstallmentGroupRow({ group, onDelete }: Props) {
  const theme = useTheme();
  const category = getCategoryById(group.categoryId);
  const completed = group.paidCount >= group.totalCount;

  const handleLongPress = () =>
    confirmDestructive(
      'Taksitli harcamayı sil',
      `"${group.name}" için tüm taksitler (${group.totalCount} adet) silinecek. Emin misin?`,
      onDelete
    );

  return (
    <Pressable onLongPress={handleLongPress} style={[styles.row, { borderColor: theme.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.expenseSoft }]}>
        <Text style={styles.icon}>{category?.icon ?? '💳'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={[styles.meta, { color: theme.subtext }]}>
          {category?.name ?? 'Diğer'} · {formatCurrency(group.totalAmount)} toplam
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(group.paidCount / group.totalCount) * 100}%`,
                backgroundColor: completed ? theme.income : theme.expense,
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.progressText, { color: theme.text }]}>
          {group.paidCount}/{group.totalCount}
        </Text>
        <Text style={[styles.remainingText, { color: theme.subtext }]}>
          {completed ? 'Bitti' : `${formatCurrency(group.remainingAmount)} kaldı`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  progressFill: { height: '100%', borderRadius: 3 },
  right: { alignItems: 'flex-end' },
  progressText: { fontSize: 13, fontWeight: '700' },
  remainingText: { fontSize: 11, marginTop: 2 },
});
