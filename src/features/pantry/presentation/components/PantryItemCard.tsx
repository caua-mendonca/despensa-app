import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme';
import { formatDateBR } from '@/core/utils/date';
import { daysUntilExpiration, getExpirationStatus } from '../../domain/entities/ExpirationStatus';
import type { PantryItem } from '../../domain/entities/PantryItem';
import {
  CATEGORY_LABELS,
  STORAGE_LOCATION_ICONS,
  STORAGE_LOCATION_LABELS,
  formatQuantity,
} from '../constants/labels';
import { ExpirationBadge } from './ExpirationBadge';

interface PantryItemCardProps {
  item: PantryItem;
  today: Date;
  onPress: (item: PantryItem) => void;
}

function PantryItemCardComponent({ item, today, onPress }: PantryItemCardProps) {
  const status = getExpirationStatus(item.expirationDate, today);
  const days = daysUntilExpiration(item.expirationDate, today);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, validade ${formatDateBR(item.expirationDate)}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Ionicons name={STORAGE_LOCATION_ICONS[item.storageLocation]} size={22} color={colors.primary} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.syncStatus === 'pending' && (
            <Ionicons
              name="cloud-upload-outline"
              size={16}
              color={colors.warning}
              accessibilityLabel="Aguardando sincronização"
            />
          )}
        </View>
        <Text style={styles.meta}>
          {formatQuantity(item.quantity, item.unit)} · {CATEGORY_LABELS[item.category]} ·{' '}
          {STORAGE_LOCATION_LABELS[item.storageLocation]}
        </Text>
        {item.barcode && (
          <View style={styles.titleRow}>
            <Ionicons name="barcode-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {item.barcode}
            </Text>
          </View>
        )}
        <View style={styles.footer}>
          <ExpirationBadge status={status} daysUntilExpiration={days} />
          <Text style={styles.date}>{formatDateBR(item.expirationDate)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export const PantryItemCard = memo(PantryItemCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { ...typography.body, fontWeight: '600', color: colors.text, flexShrink: 1 },
  meta: { ...typography.caption, color: colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { ...typography.caption, color: colors.textMuted },
});
