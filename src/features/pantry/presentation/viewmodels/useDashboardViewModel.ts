import { useCallback } from 'react';

import { useContainer } from '@/core/di/ContainerProvider';
import { useCurrentUser } from '@/features/auth/presentation/store/sessionStore';
import { useSyncNow } from '@/features/sync/presentation/useSync';
import { useSyncStore } from '@/features/sync/presentation/syncStore';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';

export function useDashboardViewModel() {
  const { useCases } = useContainer();
  const user = useCurrentUser();
  const syncNow = useSyncNow();
  const isSyncing = useSyncStore((state) => state.status === 'syncing');

  const query = useCallback(() => useCases.getDashboardSummary.execute(user.id), [useCases, user.id]);
  const { data: summary, error, isLoading, loadedAt } = useLiveQuery(query);

  return {
    userEmail: user.email,
    summary,
    error,
    isLoading,
    isRefreshing: isSyncing,
    today: loadedAt,
    /** Pull-to-refresh: sincroniza com a nuvem (as telas se atualizam via ChangeNotifier). */
    refresh: syncNow,
  };
}
