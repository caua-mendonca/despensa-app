import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/core/theme';
import { useSyncStore, type SyncStatus } from './syncStore';
import { useSyncNow } from './useSync';

type IconName = ComponentProps<typeof Ionicons>['name'];

const APPEARANCE: Record<SyncStatus, { icon: IconName; color: string; label: string }> = {
  idle: { icon: 'cloud-done-outline', color: colors.success, label: 'Sincronizado' },
  syncing: { icon: 'sync-outline', color: colors.info, label: 'Sincronizando' },
  error: { icon: 'cloud-offline-outline', color: colors.danger, label: 'Erro' },
  offline: { icon: 'cloud-offline-outline', color: colors.textMuted, label: 'Offline' },
};

/** Indicador compacto do status de sincronização; toque para sincronizar. */
export function SyncStatusPill() {
  const status = useSyncStore((state) => state.status);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const syncNow = useSyncNow();

  const appearance = APPEARANCE[status];
  const label = status === 'idle' && pendingCount > 0 ? `${pendingCount} pendente(s)` : appearance.label;
  const color = status === 'idle' && pendingCount > 0 ? colors.warning : appearance.color;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Status da sincronização: ${label}. Toque para sincronizar.`}
      onPress={() => void syncNow()}
      disabled={status === 'syncing'}
      style={styles.pill}
      hitSlop={8}
    >
      {status === 'syncing' ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={appearance.icon} size={16} color={color} />
      )}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  label: { fontSize: 12, fontWeight: '600' },
});
