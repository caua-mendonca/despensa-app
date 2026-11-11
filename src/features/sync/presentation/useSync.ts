import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useContainer } from '@/core/di/ContainerProvider';
import type { Result } from '@/core/errors/Result';
import { useCurrentUser } from '@/features/auth/presentation/store/sessionStore';
import type { SyncReport } from '../domain/SyncService';
import { useSyncStore } from './syncStore';

const LOCAL_CHANGE_DEBOUNCE_MS = 1500;

/** Dispara uma sincronização manual e mantém a store de status atualizada. */
export function useSyncNow(): () => Promise<Result<SyncReport>> {
  const { syncService } = useContainer();
  const user = useCurrentUser();

  return useCallback(async () => {
    const store = useSyncStore.getState();
    store.syncStarted();
    const result = await syncService.sync(user.id);
    if (result.ok) store.syncSucceeded(result.value);
    else store.syncFailed(result.error);
    store.setPendingCount(await syncService.getPendingCount(user.id));
    return result;
  }, [syncService, user.id]);
}

/**
 * Orquestra a sincronização automática. Montado uma única vez no layout autenticado:
 * - ao entrar no app (login / abertura);
 * - quando a conexão volta;
 * - quando o app volta para o primeiro plano;
 * - após escritas locais (com debounce).
 */
export function useAutoSync(): void {
  const { syncService, network, localChanges } = useContainer();
  const user = useCurrentUser();
  const syncNow = useSyncNow();
  const wasOnline = useRef<boolean | null>(null);

  useEffect(() => {
    const store = useSyncStore.getState();
    store.reset();
    void syncService.getLastSyncedAt(user.id).then(store.setLastSyncedAt);
    void syncService.getPendingCount(user.id).then(store.setPendingCount);
    void syncNow();
  }, [syncService, syncNow, user.id]);

  useEffect(
    () =>
      network.subscribe((online) => {
        useSyncStore.getState().setOnline(online);
        if (online && wasOnline.current === false) void syncNow();
        wasOnline.current = online;
      }),
    [network, syncNow],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNow();
    });
    return () => subscription.remove();
  }, [syncNow]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = localChanges.subscribe((source) => {
      void syncService.getPendingCount(user.id).then(useSyncStore.getState().setPendingCount);
      if (source !== 'local') return;
      clearTimeout(timer);
      timer = setTimeout(() => void syncNow(), LOCAL_CHANGE_DEBOUNCE_MS);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [localChanges, syncService, syncNow, user.id]);
}
