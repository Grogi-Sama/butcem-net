import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/hooks/useTheme';
import { getCategoriesByType } from '@/lib/categories';
import { DateField } from '@/components/DateField';
import { confirmDestructive, showAlert } from '@/lib/dialog';
import { TransactionType } from '@/types';

export default function TransactionFormScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ type?: string; id?: string }>();
  const type: TransactionType = params.type === 'income' ? 'income' : 'expense';
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useAppData();

  const existing = params.id ? transactions.find((t) => t.id === params.id) : undefined;
  const isEditing = !!existing;
  const categories = getCategoriesByType(type);

  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null);
  const [date, setDate] = useState(existing ? new Date(existing.date) : new Date());
  const [note, setNote] = useState(existing?.note ?? '');
  const [isRecurring, setIsRecurring] = useState(existing?.isRecurring ?? false);
  const [dueDay, setDueDay] = useState(existing?.dueDay ? String(existing.dueDay) : '');

  const isIncome = type === 'income';
  const accent = isIncome ? theme.income : theme.expense;
  const accentSoft = isIncome ? theme.incomeSoft : theme.expenseSoft;

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const parsedDueDay = parseInt(dueDay, 10);

    if (!trimmedName) {
      showAlert('Eksik bilgi', 'Lütfen bir isim gir.');
      return;
    }
    if (!categoryId) {
      showAlert('Eksik bilgi', 'Lütfen bir tür seç.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showAlert('Geçersiz tutar', 'Lütfen geçerli bir tutar gir.');
      return;
    }
    if (isRecurring && (!Number.isInteger(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31)) {
      showAlert('Geçersiz ödeme günü', 'Ödeme günü 1 ile 31 arasında olmalı.');
      return;
    }

    const payload = {
      type,
      name: trimmedName,
      categoryId,
      amount: parsedAmount,
      date: date.toISOString(),
      note: note.trim() || undefined,
      isRecurring: type === 'expense' ? isRecurring : false,
      dueDay: type === 'expense' && isRecurring ? parsedDueDay : undefined,
    };

    if (isEditing && existing) {
      await updateTransaction(existing.id, payload);
    } else {
      await addTransaction(payload);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!existing) return;
    confirmDestructive('Kaydı sil', `"${existing.name}" kaydını silmek istiyor musun?`, async () => {
      await deleteTransaction(existing.id);
      router.back();
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: isEditing
            ? isIncome
              ? 'Geliri Düzenle'
              : 'Gideri Düzenle'
            : isIncome
              ? 'Yeni Gelir'
              : 'Yeni Gider',
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>İsim</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={isIncome ? 'Örn. Eylül Maaşı' : 'Örn. Elektrik Faturası'}
              placeholderTextColor={theme.subtext}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>Tutar (₺)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              placeholderTextColor={theme.subtext}
              keyboardType="decimal-pad"
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>Tür</Text>
            <View style={styles.chipWrap}>
              {categories.map((c) => {
                const selected = c.id === categoryId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? accentSoft : theme.card,
                        borderColor: selected ? accent : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.chipIcon}>{c.icon}</Text>
                    <Text style={[styles.chipText, { color: selected ? accent : theme.text }]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {type === 'expense' && (
            <View style={[styles.field, styles.switchRow]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.subtext, marginBottom: 2 }]}>
                  Tekrarlayan ödeme (fatura, kira, aidat vb.)
                </Text>
                <Text style={[styles.hint, { color: theme.subtext }]}>
                  Açarsan her ay belirlediğin günde hatırlatma bildirimi alırsın.
                </Text>
              </View>
              <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ true: accent }} />
            </View>
          )}

          {type === 'expense' && isRecurring ? (
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.subtext }]}>Her Ayın Kaçıncı Günü</Text>
              <TextInput
                value={dueDay}
                onChangeText={(v) => setDueDay(v.replace(/[^0-9]/g, '').slice(0, 2))}
                placeholder="Örn. 15"
                placeholderTextColor={theme.subtext}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.card, width: 120 },
                ]}
              />
            </View>
          ) : (
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.subtext }]}>Tarih</Text>
              <DateField value={date} onChange={setDate} accentColor={accent} />
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>Not (opsiyonel)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ek bilgi ekle"
              placeholderTextColor={theme.subtext}
              multiline
              style={[
                styles.input,
                styles.noteInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.card },
              ]}
            />
          </View>

          <Pressable onPress={handleSubmit} style={[styles.submitBtn, { backgroundColor: accent }]}>
            <Text style={styles.submitText}>{isEditing ? 'Kaydet' : 'Ekle'}</Text>
          </Pressable>

          {isEditing && (
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Text style={{ color: theme.expense, fontWeight: '600' }}>Kaydı Sil</Text>
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
  hint: { fontSize: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  noteInput: { minHeight: 70, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  submitBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteBtn: { alignItems: 'center', paddingVertical: 8 },
});
