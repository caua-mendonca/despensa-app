import { router } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { EmptyState, ErrorBanner, LoadingView } from '@/shared/components/Feedback';
import { Screen } from '@/shared/components/Screen';
import type { ExpirationStatus } from '../../domain/entities/ExpirationStatus';
import type { PantryItem } from '../../domain/entities/PantryItem';
import { PantryItemCard } from '../components/PantryItemCard';
import { StatCard } from '../components/StatCard';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';

const MAX_ATTENTION_ITEMS = 5;

const openItem = (item: PantryItem) => router.push(`/items/${item.id}`);
const openList = (status: ExpirationStatus) => router.navigate({ pathname: '/items', params: { status } });

export function DashboardScreen() {
  const vm = useDashboardViewModel();

  if (vm.isLoading) return <LoadingView />;

  const summary = vm.summary;
  const attentionItems = summary?.attentionItems.slice(0, MAX_ATTENTION_ITEMS) ?? [];

  return (
    <Screen
      scroll
      refreshControl={<RefreshControl refreshing={vm.isRefreshing} onRefresh={() => void vm.refresh()} />}
    >
      <View>
        <Text style={styles.greeting}>Olá!</Text>
        <Text style={styles.email}>{vm.userEmail}</Text>
      </View>

      {vm.error && <ErrorBanner message={vm.error} />}

      <View style={styles.stats}>
        <Pressable style={styles.statPressable} onPress={() => openList('expired')}>
          <StatCard label="Vencidos" value={summary?.expired ?? 0} color={colors.danger} background={colors.dangerLight} />
        </Pressable>
        <Pressable style={styles.statPressable} onPress={() => openList('expiring_soon')}>
          <StatCard label="Vencendo" value={summary?.expiringSoon ?? 0} color={colors.warning} background={colors.warningLight} />
        </Pressable>
        <Pressable style={styles.statPressable} onPress={() => openList('ok')}>
          <StatCard label="Em dia" value={summary?.ok ?? 0} color={colors.success} background={colors.successLight} />
        </Pressable>
      </View>

      <Button title="Adicionar item" icon="add-circle-outline" onPress={() => router.push('/items/new')} />
      <Button title="Escanear produto" icon="scan-outline" variant="secondary" onPress={() => router.push('/items/scan')} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Precisa de atenção</Text>
        {attentionItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <EmptyState
              icon="checkmark-circle-outline"
              title={summary?.total ? 'Tudo em dia!' : 'Sua despensa está vazia'}
              description={
                summary?.total
                  ? 'Nenhum item vencido ou vencendo nos próximos dias.'
                  : 'Cadastre os alimentos que você tem em casa para acompanhar a validade.'
              }
            />
          </View>
        ) : (
          attentionItems.map((item) => (
            <PantryItemCard key={item.id} item={item} today={vm.today} onPress={openItem} />
          ))
        )}
      </View>

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Você sabia?</Text>
        <Text style={styles.tipText}>
          Boa parte da comida jogada fora em casa é de itens esquecidos que passaram da validade.
          Consumir primeiro o que vence antes é a forma mais simples de economizar.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { ...typography.title, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted },
  stats: { flexDirection: 'row', gap: spacing.sm },
  statPressable: { flex: 1 },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { ...typography.subtitle, color: colors.text },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tip: {
    backgroundColor: colors.infoLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  tipTitle: { ...typography.label, color: colors.info },
  tipText: { ...typography.caption, color: colors.text },
});
