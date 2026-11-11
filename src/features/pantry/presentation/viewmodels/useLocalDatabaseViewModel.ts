import { useCallback } from 'react';

import { useContainer } from '@/core/di/ContainerProvider';
import { runCatching } from '@/core/errors/Result';
import { useCurrentUser } from '@/features/auth/presentation/store/sessionStore';
import { LATEST_SCHEMA_VERSION } from '@/infra/database/migrations';
import { DATABASE_NAME } from '@/infra/database/constants';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { FIND_ALL_RAW_SQL } from '../../data/datasources/PantryLocalDataSource';

/**
 * Ferramenta de inspeção do SQLite para a apresentação: mostra as linhas cruas
 * (inclusive excluídas) com o `sync_status`. Por ser uma tela técnica, acessa
 * o datasource diretamente em vez de passar pelos casos de uso.
 */
export function useLocalDatabaseViewModel() {
  const { database, pantryLocalDataSource } = useContainer();
  const user = useCurrentUser();

  const query = useCallback(
    () => runCatching(() => pantryLocalDataSource.findAllRaw(user.id), 'DATABASE'),
    [pantryLocalDataSource, user.id],
  );
  const { data, error, isLoading, loadedAt } = useLiveQuery(query);
  const rows = data ?? [];

  return {
    databaseName: DATABASE_NAME,
    databasePath: database.databasePath,
    schemaVersion: LATEST_SCHEMA_VERSION,
    sql: FIND_ALL_RAW_SQL,
    loadedAt,
    rows,
    error,
    isLoading,
    counts: {
      total: rows.length,
      pending: rows.filter((row) => row.sync_status === 'pending').length,
      synced: rows.filter((row) => row.sync_status === 'synced').length,
      deleted: rows.filter((row) => row.deleted_at !== null).length,
    },
  };
}
