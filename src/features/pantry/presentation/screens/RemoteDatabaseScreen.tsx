import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme';
import { formatDateTimeBR } from '@/core/utils/date';
import type { PantryItemRemoteRow } from '@/infra/supabase/database.types';
import { EmptyState, ErrorBanner, LoadingView } from '@/shared/components/Feedback';
import { Screen } from '@/shared/components/Screen';
import { useRemoteDatabaseViewModel } from '../viewmodels/useRemoteDatabaseViewModel';

const REMOTE_SQL = 'select * from public.pantry_items\nwhere user_id = auth.uid()\norder by updated_at desc';

function RowCard({ row }: { row: PantryItemRemoteRow }) {
  const isDeleted = row.deleted_at !== null;
  return (
    <View style={[styles.row, isDeleted && styles.rowDeleted]}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowName} numberOfLines={1}>
          {row.name}
        </Text>
        <Text style={[styles.tag, isDeleted ? styles.tagDeleted : styles.tagActive]}>
          {isDeleted ? 'excluído' : 'na nuvem'}
        </Text>
      </View>
      <Text style={styles.mono}>id: {row.id}</Text>
      <Text style={styles.mono}>
        expiration_date: {row.expiration_date} · qtd: {row.quantity} {row.unit}
      </Text>
      <Text style={styles.mono}>barcode: {row.barcode ?? '—'}</Text>
      <Text style={styles.mono}>updated_at (servidor): {formatDateTimeBR(row.updated_at)}</Text>
      {row.deleted_at && (
        <Text style={[styles.mono, styles.deleted]}>deleted_at: {formatDateTimeBR(row.deleted_at)}</Text>
      )}
    </View>
  );
}

/** Tela técnica que consulta a tabela `pantry_items` diretamente no Supabase (PostgreSQL). */
export function RemoteDatabaseScreen() {
  const vm = useRemoteDatabaseViewModel();
  const [isRefreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await vm.reload();
    setRefreshing(false);
  };

  if (vm.isLoading) return <LoadingView message="Consultando o Supabase..." />;

  return (
    <Screen contentStyle={styles.screen}>
      <FlatList
        data={vm.rows}
        keyExtractor={(row) => row.id}
        renderItem={({ item }) => <RowCard row={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} />}
        ListHeaderComponent={
          <View style={styles.header}>
            {vm.error && <ErrorBanner message={vm.error} />}
            <Text style={styles.info}>
              Servidor: <Text style={styles.bold}>{vm.host}</Text>
            </Text>
            <Text style={styles.info}>
              Banco: <Text style={styles.bold}>PostgreSQL</Text> · Tabela{' '}
              <Text style={styles.bold}>public.pantry_items</Text>
            </Text>
            <View style={styles.sqlBox}>
              <Text style={styles.sqlLabel}>Consulta equivalente (com RLS por usuário)</Text>
              <Text style={styles.sql}>{REMOTE_SQL}</Text>
              <Text style={styles.sqlLabel}>Lido em {formatDateTimeBR(vm.loadedAt.toISOString())}</Text>
            </View>
            <View style={styles.counters}>
              <Counter label="Na nuvem" value={vm.counts.total} />
              <Counter label="Ativos" value={vm.counts.active} color={colors.success} />
              <Counter label="Excluídos" value={vm.counts.deleted} color={colors.danger} />
              <Counter label="Só no aparelho" value={vm.pendingCount} color={colors.warning} />
            </View>
          </View>
        }
        ListEmptyComponent={
          vm.error ? undefined : (
            <EmptyState
              icon="cloud-outline"
              title="Nada na nuvem ainda"
              description="Cadastre um item com internet ligada ou toque em Sincronizar agora."
            />
          )
        }
      />
    </Screen>
  );
}

function Counter({ label, value, color = colors.text }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.counter}>
      <Text style={[styles.counterValue, { color }]}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0, gap: 0 },
  list: { padding: spacing.lg, flexGrow: 1 },
  header: { gap: spacing.xs, marginBottom: spacing.md },
  info: { ...typography.caption, color: colors.textMuted },
  bold: { fontWeight: '700', color: colors.text },
  sqlBox: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sqlLabel: { fontSize: 11, color: colors.border },
  sql: { fontFamily: 'monospace', fontSize: 12, color: colors.textInverse },
  counters: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  counter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  counterValue: { fontSize: 20, fontWeight: '800' },
  counterLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  rowDeleted: { opacity: 0.6 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  rowName: { ...typography.body, fontWeight: '700', color: colors.text, flexShrink: 1 },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  tagActive: { backgroundColor: colors.infoLight, color: colors.info },
  tagDeleted: { backgroundColor: colors.dangerLight, color: colors.danger },
  mono: { fontFamily: 'monospace', fontSize: 11, color: colors.textMuted },
  deleted: { color: colors.danger },
});
