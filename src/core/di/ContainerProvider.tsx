import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import { createContainer, type Container } from './container';

const ContainerContext = createContext<Container | null>(null);

/** Deve ficar dentro do `SQLiteProvider`, pois depende da conexão do banco. */
export function ContainerProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const container = useMemo(() => createContainer(db), [db]);
  return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>;
}

export function useContainer(): Container {
  const container = useContext(ContainerContext);
  if (!container) throw new Error('useContainer deve ser usado dentro de <ContainerProvider>.');
  return container;
}
