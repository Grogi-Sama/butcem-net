import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/hooks/useTheme';
import { GOAL_ICONS } from '@/lib/goalIcons';
import { DateField } from '@/components/DateField';
import { confirmDestructive, showAlert } from '@/lib/dialog';

export default function GoalFormScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const { goals, addGoal, updateGoal, deleteGoal } = useAppData();

  const existing = params.id ? goals.find((g) => g.id === params.id) : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? GOAL_ICONS[0]);
  const [targetAmount, setTargetAmount] = useState(existing ? String(existing.targetAmount) : '');
  const [currentAmount, setCurrentAmount] = useState(existing ? String(existing.currentAmount) : '0');
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    existing?.targetDate ? new Date(existing.targetDate) : undefined
  );

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const parsedTarget = parseFloat(targetAmount.replace(',', '.'));
    const parsedCurrent = parseFloat((currentAmount || '0').replace(',', '.'));

    if (!trimmedName) {
      showAlert('Eksik bilgi', 'Lütfen bir hedef ismi gir.');
      return;
    }
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      showAlert('Geçersiz tutar', 'Lütfen geçerli bir hedef tutar gir.');
      return;
    }
    if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
      showAlert('Geçersiz tutar', 'Lütfen geçerli bir birikim tutarı gir.');
      return;
    }

    const payload = {
      name: trimmedName,
      icon,
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      targetDate: targetDate?.toISOString(),
    };

    if (isEditing && existing) {
      await updateGoal(existing.id, payload);
    } else {
      await addGoal(payload);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!existing) return;
    confirmDestructive('Hedefi sil', `"${existing.name}" hedefini silmek istiyor musun?`, async () => {
      await deleteGoal(existing.id);
      router.back();
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: isEditing ? 'Hedefi Düzenle' : 'Yeni Birikim Hedefi' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>İsim</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Örn. Tatil için Birikim"
              placeholderTextColor={theme.subtext}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>İkon</Text>
            <View style={styles.chipWrap}>
              {GOAL_ICONS.map((i) => {
                const selected = i === icon;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setIcon(i)}
                    style={[
                      styles.iconChip,
                      {
                        backgroundColor: selected ? theme.primarySoft : theme.card,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.iconChipText}>{i}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>Hedef Tutar (₺)</Text>
            <TextInput
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="0,00"
              placeholderTextColor={theme.subtext}
              keyboardType="decimal-pad"
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>Mevcut Birikim (₺)</Text>
            <TextInput
              value={currentAmount}
              onChangeText={setCurrentAmount}
              placeholder="0,00"
              placeholderTextColor={theme.subtext}
              keyboardType="decimal-pad"
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
            <Text style={[styles.hint, { color: theme.subtext }]}>
              Birikmiş tutarını buradan güncelleyebilirsin — gelir/gider takibinden bağımsızdır.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>Hedef Tarih (opsiyonel)</Text>
            <DateField
              value={targetDate}
              onChange={setTargetDate}
              minimumDate={new Date()}
              accentColor={theme.primary}
            />
            {targetDate && (
              <Pressable onPress={() => setTargetDate(undefined)} style={{ alignSelf: 'flex-start' }}>
                <Text style={{ color: theme.expense, fontSize: 12, fontWeight: '600' }}>Tarihi kaldır</Text>
              </Pressable>
            )}
          </View>

          <Pressable onPress={handleSubmit} style={[styles.submitBtn, { backgroundColor: theme.primary }]}>
            <Text style={styles.submitText}>{isEditing ? 'Kaydet' : 'Ekle'}</Text>
          </Pressable>

          {isEditing && (
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Text style={{ color: theme.expense, fontWeight: '600' }}>Hedefi Sil</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 11, lineHeight: 15 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipText: { fontSize: 20 },
  submitBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteBtn: { alignItems: 'center', paddingVertical: 8 },
});
