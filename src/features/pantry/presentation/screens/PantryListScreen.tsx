import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { ChipSelect } from '@/shared/components/ChipSelect';
import { EmptyState, ErrorBanner, LoadingView } from '@/shared/components/Feedback';
import { Screen } from '@/shared/components/Screen';
import type { ExpirationStatus } from '../../domain/entities/ExpirationStatus';
import type { PantryItem } from '../../domain/entities/PantryItem';
import { PantryItemCard } from '../components/PantryItemCard';
import { categoryOptions, statusOptions, storageLocationOptions } from '../constants/labels';
import { usePantryListViewModel } from '../viewmodels/usePantryListViewModel';

const isExpirationStatus = (value: unknown): value is ExpirationStatus =>
  value === 'expired' || value === 'expiring_soon' || value === 'ok';

export function PantryListScreen() {
  const params = useLocalSearchParams<{ status?: string }>();
  const vm = usePantryListViewModel();
  const { setStatus } = vm;

  // Permite abrir a lista já filtrada a partir do Dashboard.
  useEffect(() => {
    if (isExpirationStatus(params.status)) setStatus(params.status);
  }, [params.status, setStatus]);

  const openItem = useCallback((item: PantryItem) => router.push(`/items/${item.id}`), []);

  const header = (
    <View style={styles.filters}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={vm.filters.search}
          onChangeText={vm.setSearch}
          placeholder="Buscar item..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          accessibilityLabel="Buscar item"
          returnKeyType="search"
        />
      </View>
      <ChipSelect options={statusOptions} value={vm.filters.status} onChange={vm.setStatus} allowDeselect />
      <ChipSelect
        options={storageLocationOptions}
        value={vm.filters.storageLocation}
        onChange={vm.setStorageLocation}
        allowDeselect
      />
      <ChipSelect options={categoryOptions} value={vm.filters.category} onChange={vm.setCategory} allowDeselect />
      {vm.hasActiveFilters && <Button title="Limpar filtros" variant="ghost" onPress={vm.clearFilters} />}
      {vm.error && <ErrorBanner message={vm.error} />}
    </View>
  );

  return (
    <Screen contentStyle={styles.screen}>
      {vm.isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={vm.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PantryItemCard item={item} today={vm.today} onPress={openItem} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="basket-outline"
              title={vm.hasActiveFilters ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
              description={
                vm.hasActiveFilters
                  ? 'Tente ajustar a busca ou os filtros.'
                  : 'Toque no botão + para cadastrar o primeiro item.'
              }
            />
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={vm.isRefreshing} onRefresh={() => void vm.refresh()} />
          }
        />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escanear produto"
        onPress={() => router.push('/items/scan')}
        style={({ pressed }) => [styles.fab, styles.fabScan, pressed && styles.fabPressed]}
      >
        <Ionicons name="scan-outline" size={26} color={colors.textInverse} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adicionar item"
        onPress={() => router.push('/items/new')}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name="add" size={30} color={colors.textInverse} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0, gap: 0 },
  list: { padding: spacing.lg, paddingBottom: 96, flexGrow: 1 },
  filters: { gap: spacing.sm, marginBottom: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 16, color: colors.text },
  separator: { height: spacing.sm },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabScan: { bottom: spacing.xl + 72, backgroundColor: colors.primaryDark },
  fabPressed: { backgroundColor: colors.primaryDark },
});
