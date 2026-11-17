import React, { createElement, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDate } from '@/lib/date';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  value: Date | undefined;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  accentColor: string;
}

function toInputValue(date: Date | undefined): string {
  if (!date) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function DateField({ value, onChange, placeholder = 'Tarih seç', minimumDate, accentColor }: Props) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const boxStyle = [styles.box, { borderColor: theme.border, backgroundColor: theme.card }];

  if (Platform.OS === 'web') {
    // The native picker has no web implementation, so use the browser's own date input.
    return createElement('input', {
      type: 'date',
      value: toInputValue(value),
      min: minimumDate ? toInputValue(minimumDate) : undefined,
      onChange: (e: { target: { value: string } }) => {
        const [y, m, d] = e.target.value.split('-').map(Number);
        if (y && m && d) onChange(new Date(y, m - 1, d, 12));
      },
      style: {
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 15,
        backgroundColor: theme.card,
        color: theme.text,
        fontFamily: 'inherit',
        colorScheme: 'light dark',
      },
    });
  }

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) onChange(selected);
  };

  return (
    <>
      <Pressable onPress={() => setShowPicker(true)} style={boxStyle}>
        <Text style={{ color: value ? theme.text : theme.subtext }}>
          {value ? formatDate(value.toISOString()) : placeholder}
        </Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          minimumDate={minimumDate}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
      {Platform.OS === 'ios' && showPicker && (
        <Pressable onPress={() => setShowPicker(false)} style={styles.doneBtn}>
          <Text style={{ color: accentColor, fontWeight: '700' }}>Tamam</Text>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  doneBtn: { alignSelf: 'flex-end', paddingVertical: 8 },
});
