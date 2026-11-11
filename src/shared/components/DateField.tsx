import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme';
import { formatDateBR, isValidISODate, parseISODate, toISODate } from '@/core/utils/date';

interface DateFieldProps {
  label: string;
  /** Data no formato `YYYY-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const date = isValidISODate(value) ? parseISODate(value) : new Date();

  const handleValueChange = (_event: unknown, selected: Date) => {
    // No Android o picker é um diálogo que fecha sozinho; no iOS fica inline.
    if (Platform.OS === 'android') setPickerVisible(false);
    onChange(toISODate(selected));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${isValidISODate(value) ? formatDateBR(value) : 'não definida'}`}
        onPress={() => setPickerVisible((visible) => !visible)}
        style={[styles.field, error && styles.fieldError]}
      >
        <Text style={styles.value}>
          {isValidISODate(value) ? formatDateBR(value) : 'Selecione a data'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </Pressable>
      {isPickerVisible && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onValueChange={handleValueChange}
          onDismiss={() => setPickerVisible(false)}
        />
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldError: { borderColor: colors.danger },
  value: { fontSize: 16, color: colors.text },
  error: { ...typography.caption, color: colors.danger },
});
