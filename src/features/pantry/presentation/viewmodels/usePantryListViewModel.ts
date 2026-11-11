import { useCallback, useState } from 'react';

import { useContainer } from '@/core/di/ContainerProvider';
import { useCurrentUser } from '@/features/auth/presentation/store/sessionStore';
import { useSyncNow } from '@/features/sync/presentation/useSync';
import { useSyncStore } from '@/features/sync/presentation/syncStore';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import type { ExpirationStatus } from '../../domain/entities/ExpirationStatus';
import type { Category, StorageLocation } from '../../domain/entities/PantryItem';

export function usePantryListViewModel(initialStatus: ExpirationStatus | null = null) {
  const { useCases } = useContainer();
  const user = useCurrentUser();
  const syncNow = useSyncNow();
  const isSyncing = useSyncStore((state) => state.status === 'syncing');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [storageLocation, setStorageLocation] = useState<StorageLocation | null>(null);
  const [status, setStatus] = useState<ExpirationStatus | null>(initialStatus);

  const query = useCallback(
    () =>
      useCases.listPantryItems.execute(user.id, {
        search,
        category: category ?? undefined,
        storageLocation: storageLocation ?? undefined,
        status: status ?? undefined,
      }),
    [useCases, user.id, search, category, storageLocation, status],
  );
  const { data, error, isLoading, loadedAt } = useLiveQuery(query);

  const hasActiveFilters = Boolean(search || category || storageLocation || status);

  const clearFilters = () => {
    setSearch('');
    setCategory(null);
    setStorageLocation(null);
    setStatus(null);
  };

  return {
    items: data ?? [],
    error,
    isLoading,
    isRefreshing: isSyncing,
    today: loadedAt,
    filters: { search, category, storageLocation, status },
    setSearch,
    setCategory,
    setStorageLocation,
    setStatus,
    hasActiveFilters,
    clearFilters,
    refresh: syncNow,
  };
}
