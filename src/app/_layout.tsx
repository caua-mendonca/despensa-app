import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { env } from '@/core/config/env';
import { ContainerProvider } from '@/core/di/ContainerProvider';
import { useAuthSession } from '@/features/auth/presentation/useAuthSession';
import { DATABASE_NAME } from '@/infra/database/constants';
import { migrateDatabase } from '@/infra/database/migrations';
import { LoadingView } from '@/shared/components/Feedback';
import { MissingConfigScreen } from '@/shared/components/MissingConfigScreen';

/**
 * Layout raiz: inicializa o SQLite (com migrations), monta o container de
 * dependências e protege as rotas conforme o estado da sessão.
 */
export default function RootLayout() {
  if (!env.isSupabaseConfigured) return <MissingConfigScreen />;

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase}>
      <ContainerProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </ContainerProvider>
    </SQLiteProvider>
  );
}

function RootNavigator() {
  const status = useAuthSession();
  if (status === 'loading') return <LoadingView message="Carregando..." />;

  const isAuthenticated = status === 'authenticated';
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
