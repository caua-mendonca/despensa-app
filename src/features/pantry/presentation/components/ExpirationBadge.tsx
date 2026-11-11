import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/core/theme';
import type { ExpirationStatus } from '../../domain/entities/ExpirationStatus';
import { describeDaysUntilExpiration } from '../constants/labels';

const PALETTE: Record<ExpirationStatus, { background: string; text: string }> = {
  expired: { background: colors.dangerLight, text: colors.danger },
  expiring_soon: { background: colors.warningLight, text: colors.warning },
  ok: { background: colors.successLight, text: colors.success },
};

interface ExpirationBadgeProps {
  status: ExpirationStatus;
  daysUntilExpiration: number;
}

export function ExpirationBadge({ status, daysUntilExpiration }: ExpirationBadgeProps) {
  const palette = PALETTE[status];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.text, { color: palette.text }]}>
        {describeDaysUntilExpiration(daysUntilExpiration)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  text: { fontSize: 12, fontWeight: '700' },
});
