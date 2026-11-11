import { FlatList, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme';
import { formatDateTimeBR } from '@/core/utils/date';
import { EmptyState, ErrorBanner, LoadingView } from '@/shared/components/Feedback';
import { Screen } from '@/shared/components/Screen';
import type { PantryItemLocalRow } from '../../data/mappers/pantryItemMapper';
import { useLocalDatabaseViewModel } from '../viewmodels/useLocalDatabaseViewModel';

function RowCard({ row }: { row: PantryItemLocalRow }) {
  const isPending = row.sync_status === 'pending';
  return (
    <View style={[styles.row, row.deleted_at && styles.rowDeleted]}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowName} numberOfLines={1}>
          {row.name}
        </Text>
        <Text style={[styles.tag, isPending ? styles.tagPending : styles.tagSynced]}>
          {row.sync_status}
        </Text>
      </View>
      <Text style={styles.mono}>id: {row.id}</Text>
      <Text style={styles.mono}>
        expiration_date: {row.expiration_date} · qtd: {row.quantity} {row.unit}
      </Text>
      <Text style={styles.mono}>barcode: {row.barcode ?? '—'}</Text>
      <Text style={styles.mono}>updated_at: {formatDateTimeBR(row.updated_at)}</Text>
      {row.deleted_at && (
        <Text style={[styles.mono, styles.deleted]}>deleted_at: {formatDateTimeBR(row.deleted_at)}</Text>
      )}
    </View>
  );
}

/** Tela técnica que exibe o conteúdo da tabela `pantry_items` no Expo SQLite. */
export function LocalDatabaseScreen() {
  const vm = useLocalDatabaseViewModel();

  if (vm.isLoading) return <LoadingView />;

  return (
    <Screen contentStyle={styles.screen}>
      <FlatList
        data={vm.rows}
        keyExtractor={(row) => row.id}
        renderItem={({ item }) => <RowCard row={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            {vm.error && <ErrorBanner message={vm.error} />}
            <Text style={styles.info}>
              Arquivo: <Text style={styles.bold}>{vm.databaseName}</Text> · Schema v{vm.schemaVersion}
            </Text>
            <Text style={styles.mono} selectable>
              {vm.databasePath}
            </Text>
            <View style={styles.sqlBox}>
              <Text style={styles.sqlLabel}>Consulta executada no Expo SQLite</Text>
              <Text style={styles.sql} selectable>
                {vm.sql}
              </Text>
              <Text style={styles.sqlLabel}>Lido em {formatDateTimeBR(vm.loadedAt.toISOString())}</Text>
            </View>
            <View style={styles.counters}>
              <Counter label="Linhas" value={vm.counts.total} />
              <Counter label="Pendentes" value={vm.counts.pending} color={colors.warning} />
              <Counter label="Sincronizadas" value={vm.counts.synced} color={colors.success} />
              <Counter label="Excluídas" value={vm.counts.deleted} color={colors.danger} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="server-outline" title="Banco local vazio" description="Cadastre um item para vê-lo aqui." />
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
  counterLabel: { fontSize: 11, color: colors.textMuted },
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
  tagPending: { backgroundColor: colors.warningLight, color: colors.warning },
  tagSynced: { backgroundColor: colors.successLight, color: colors.success },
  mono: { fontFamily: 'monospace', fontSize: 11, color: colors.textMuted },
  sqlBox: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sqlLabel: { fontSize: 11, color: colors.border },
  sql: { fontFamily: 'monospace', fontSize: 12, color: colors.textInverse },
  deleted: { color: colors.danger },
});
