import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { GoalCard } from '@/components/GoalCard';
import { formatCurrency } from '@/lib/date';

export default function GoalsScreen() {
  const theme = useTheme();
  const { goals, deleteGoal } = useAppData();

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: theme.subtext }]}>Toplam Birikim</Text>
        <Text style={[styles.headerValue, { color: theme.primary }]}>{formatCurrency(totalSaved)}</Text>
        {totalTarget > 0 && (
          <Text style={[styles.headerSub, { color: theme.subtext }]}>
            Hedeflerin toplamı {formatCurrency(totalTarget)}
          </Text>
        )}
      </View>

      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Card>
            <Text style={{ color: theme.subtext, textAlign: 'center' }}>
              Henüz bir birikim hedefi eklemedin. Sağ alttaki + butonuyla ekleyebilirsin.
            </Text>
          </Card>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onPress={() => router.push({ pathname: '/goal-form', params: { id: item.id } })}
            onDelete={() => deleteGoal(item.id)}
          />
        )}
      />

      <Pressable
        onPress={() => router.push({ pathname: '/goal-form' })}
        style={[styles.fab, { backgroundColor: theme.primary }]}
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
  headerSub: { fontSize: 12, marginTop: 2 },
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
