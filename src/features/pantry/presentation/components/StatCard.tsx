import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  background: string;
}

export function StatCard({ label, value, color, background }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: background }]} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: { fontSize: 28, fontWeight: '800' },
  label: { ...typography.caption, fontWeight: '600' },
});
