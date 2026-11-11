import { Stack } from 'expo-router';

import { colors } from '@/core/theme';
import { useAutoSync } from '@/features/sync/presentation/useSync';

export const unstable_settings = { initialRouteName: '(tabs)' };

/** Área autenticada: liga a sincronização automática enquanto o usuário estiver logado. */
export default function AppLayout() {
  useAutoSync();

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="items/new" options={{ title: 'Novo item', presentation: 'modal' }} />
      <Stack.Screen name="items/scan" options={{ title: 'Escanear produto', presentation: 'modal' }} />
      <Stack.Screen name="items/[id]" options={{ title: 'Editar item' }} />
      <Stack.Screen name="debug/local-db" options={{ title: 'Banco local (SQLite)' }} />
      <Stack.Screen name="debug/remote-db" options={{ title: 'Nuvem (Supabase)' }} />
    </Stack>
  );
}
