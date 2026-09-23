import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/hooks/useTheme';
import { getCategoriesByType } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/date';

export default function InstallmentFormScreen() {
  const theme = useTheme();
  const { addInstallmentPurchase } = useAppData();
  const categories = getCategoriesByType('expense');

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentCount, setInstallmentCount] = useState('3');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const parsedTotal = parseFloat(totalAmount.replace(',', '.'));
  const parsedCount = parseInt(installmentCount, 10);
  const monthlyPreview =
    Number.isFinite(parsedTotal) && parsedCount > 0 ? parsedTotal / parsedCount : undefined;

  const onChangeDate = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setStartDate(selected);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Eksik bilgi', 'Lütfen bir isim gir.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Eksik bilgi', 'Lütfen bir tür seç.');
      return;
    }
    if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      Alert.alert('Geçersiz tutar', 'Lütfen geçerli bir toplam tutar gir.');
      return;
    }
    if (!Number.isInteger(parsedCount) || parsedCount < 2 || parsedCount > 36) {
      Alert.alert('Geçersiz taksit sayısı', 'Taksit sayısı 2 ile 36 arasında olmalı.');
      return;
    }

    await addInstallmentPurchase({
      name: trimmedName,
      categoryId,
      totalAmount: parsedTotal,
      installmentCount: parsedCount,
      startDate,
    });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Taksitli Harcama Ekle' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>İsim</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Örn. Buzdolabı"
              placeholderTextColor={theme.subtext}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>Toplam Tutar (₺)</Text>
            <TextInput
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder="0,00"
              placeholderTextColor={theme.subtext}
              keyboardType="decimal-pad"
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>Taksit Sayısı</Text>
            <TextInput
              value={installmentCount}
              onChangeText={(v) => setInstallmentCount(v.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="Örn. 12"
              placeholderTextColor={theme.subtext}
              keyboardType="number-pad"
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.card, width: 120 },
              ]}
            />
            {monthlyPreview !== undefined && (
              <Text style={[styles.hint, { color: theme.subtext }]}>
                Aylık yaklaşık {formatCurrency(monthlyPreview)}
              </Text>
            )}
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
                        backgroundColor: selected ? theme.expenseSoft : theme.card,
                        borderColor: selected ? theme.expense : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.chipIcon}>{c.icon}</Text>
                    <Text style={[styles.chipText, { color: selected ? theme.expense : theme.text }]}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.subtext }]}>İlk Taksit Tarihi</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card }]}
            >
              <Text style={{ color: theme.text }}>{formatDate(startDate.toISOString())}</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeDate}
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <Pressable onPress={() => setShowDatePicker(false)} style={styles.doneBtn}>
                <Text style={{ color: theme.expense, fontWeight: '700' }}>Tamam</Text>
              </Pressable>
            )}
            <Text style={[styles.hint, { color: theme.subtext }]}>
              Taksitler bu tarihten başlayarak her ay otomatik olarak gider listene eklenir.
            </Text>
          </View>

          <Pressable onPress={handleSubmit} style={[styles.submitBtn, { backgroundColor: theme.expense }]}>
            <Text style={styles.submitText}>Ekle</Text>
          </Pressable>
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
  doneBtn: { alignSelf: 'flex-end', paddingVertical: 8 },
  submitBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
