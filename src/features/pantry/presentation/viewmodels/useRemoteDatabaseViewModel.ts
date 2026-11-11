import { useCallback } from 'react';

import { env } from '@/core/config/env';
import { useContainer } from '@/core/di/ContainerProvider';
import { AppError } from '@/core/errors/AppError';
import { fail, runCatching } from '@/core/errors/Result';
import { useCurrentUser } from '@/features/auth/presentation/store/sessionStore';
import { useSyncStore } from '@/features/sync/presentation/syncStore';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';

/**
 * Ferramenta de inspeção do Supabase para a apresentação: consulta a tabela
 * `pantry_items` diretamente no PostgreSQL (não no SQLite), para comparar os
 * dois bancos lado a lado. Recarrega ao focar a tela e após cada sincronização.
 */
export function useRemoteDatabaseViewModel() {
  const { network, pantryRemoteDataSource } = useContainer();
  const user = useCurrentUser();
  const pendingCount = useSyncStore((state) => state.pendingCount);

  const query = useCallback(async () => {
    if (!(await network.isOnline())) {
      return fail(new AppError('NETWORK', 'Sem conexão: não é possível consultar o Supabase agora.'));
    }
    return runCatching(() => pantryRemoteDataSource.fetchAll(user.id), 'REMOTE');
  }, [network, pantryRemoteDataSource, user.id]);

  const { data, error, isLoading, loadedAt, reload } = useLiveQuery(query);
  const rows = data ?? [];

  return {
    host: env.supabaseUrl.replace(/^https?:\/\//, '').replace(/\/+$/, ''),
    userId: user.id,
    rows,
    error,
    isLoading,
    loadedAt,
    reload,
    pendingCount,
    counts: {
      total: rows.length,
      active: rows.filter((row) => row.deleted_at === null).length,
      deleted: rows.filter((row) => row.deleted_at !== null).length,
    },
  };
}
