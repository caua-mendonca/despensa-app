import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useContainer } from '@/core/di/ContainerProvider';
import type { Result } from '@/core/errors/Result';

interface LiveQueryState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  /** Momento da última carga — útil como "hoje" estável para cálculos de validade. */
  loadedAt: Date;
  reload: () => Promise<void>;
}

/**
 * Executa uma consulta local e a mantém atualizada: recarrega quando a tela
 * ganha foco, quando a query muda (ex.: filtros) e sempre que os dados do
 * SQLite mudam (escrita local ou sincronização).
 *
 * A `query` deve ser memoizada com `useCallback`.
 */
export function useLiveQuery<T>(query: () => Promise<Result<T>>): LiveQueryState<T> {
  const { localChanges } = useContainer();
  const [state, setState] = useState<Omit<LiveQueryState<T>, 'reload'>>({
    data: null,
    error: null,
    isLoading: true,
    loadedAt: new Date(),
  });
  const latestRequest = useRef(0);

  const reload = useCallback(async () => {
    // Descarta respostas antigas quando várias cargas se sobrepõem.
    const requestId = ++latestRequest.current;
    const result = await query();
    if (requestId !== latestRequest.current) return;

    setState((current) => ({
      data: result.ok ? result.value : current.data,
      error: result.ok ? null : result.error.message,
      isLoading: false,
      loadedAt: new Date(),
    }));
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => localChanges.subscribe(() => void reload()), [localChanges, reload]);

  return { ...state, reload };
}
