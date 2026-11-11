import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps, PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme';
import { formatDateTimeBR } from '@/core/utils/date';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import type { SyncStatus } from './syncStore';
import { useSettingsViewModel } from './useSettingsViewModel';

const STATUS_LABELS: Record<SyncStatus, string> = {
  idle: 'Em dia',
  syncing: 'Sincronizando...',
  error: 'Falhou',
  offline: 'Sem conexão',
};

function Card({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.linkRow}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.linkLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export function SettingsScreen() {
  const vm = useSettingsViewModel();
  const { sync } = vm;

  return (
    <Screen scroll>
      <Card title="Conta">
        <InfoRow label="E-mail" value={vm.email} />
      </Card>

      <Card title="Sincronização (Supabase)">
        <InfoRow label="Conexão" value={sync.isOnline ? 'Online' : 'Offline'} valueColor={sync.isOnline ? colors.success : colors.danger} />
        <InfoRow label="Status" value={STATUS_LABELS[sync.status]} />
        <InfoRow
          label="Pendentes de envio"
          value={String(sync.pendingCount)}
          valueColor={sync.pendingCount > 0 ? colors.warning : undefined}
        />
        <InfoRow label="Última sincronização" value={sync.lastSyncedAt ? formatDateTimeBR(sync.lastSyncedAt) : 'Nunca'} />
        {sync.lastReport && (
          <InfoRow label="Último envio / recebimento" value={`${sync.lastReport.pushed} / ${sync.lastReport.pulled}`} />
        )}
        {sync.errorMessage && <Text style={styles.error}>{sync.errorMessage}</Text>}
        <LinkRow icon="cloud-outline" label="Ver dados na nuvem (Supabase)" onPress={() => router.push('/debug/remote-db')} />
        <Button
          title="Sincronizar agora"
          icon="sync"
          variant="secondary"
          onPress={() => void vm.syncNow()}
          loading={sync.status === 'syncing'}
        />
      </Card>

      <Card title="Armazenamento local">
        <Text style={styles.description}>
          Todos os dados ficam salvos no aparelho (Expo SQLite) e funcionam sem internet. Quando houver
          conexão, são enviados ao Supabase (PostgreSQL).
        </Text>
        <LinkRow icon="server-outline" label="Ver banco local (SQLite)" onPress={() => router.push('/debug/local-db')} />
      </Card>

      <Card title="Sobre o ValidaJá">
        <Text style={styles.description}>
          Ajuda famílias a reduzir o desperdício de alimentos: registre o que tem em casa e acompanhe o que
          está vencido ou vencendo. Em breve: leitura da data de validade pela câmera.
        </Text>
      </Card>

      <Button title="Sair da conta" icon="log-out-outline" variant="danger" onPress={vm.confirmSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.subtitle, color: colors.text, marginBottom: spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  infoLabel: { ...typography.body, color: colors.textMuted },
  infoValue: { ...typography.body, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  description: { ...typography.caption, color: colors.textMuted, lineHeight: 19 },
  error: { ...typography.caption, color: colors.danger },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  linkLabel: { ...typography.body, color: colors.text, flex: 1, fontWeight: '500' },
});
