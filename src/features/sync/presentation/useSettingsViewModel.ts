import { Alert } from 'react-native';

import { useContainer } from '@/core/di/ContainerProvider';
import { useCurrentUser } from '@/features/auth/presentation/store/sessionStore';
import { useSyncStore } from './syncStore';
import { useSyncNow } from './useSync';

export function useSettingsViewModel() {
  const { useCases } = useContainer();
  const user = useCurrentUser();
  const syncNow = useSyncNow();
  const sync = useSyncStore();

  const signOut = async () => {
    const result = await useCases.signOut.execute();
    if (!result.ok) Alert.alert('Erro ao sair', result.error.message);
  };

  /** Avisa antes de sair se ainda houver alterações que não foram para a nuvem. */
  const confirmSignOut = () => {
    const message =
      sync.pendingCount > 0
        ? `Você tem ${sync.pendingCount} alteração(ões) ainda não sincronizada(s). Elas continuarão salvas neste aparelho e serão enviadas no próximo login. Deseja sair?`
        : 'Deseja realmente sair da sua conta?';

    Alert.alert('Sair', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const syncAndReport = async () => {
    const result = await syncNow();
    if (result.ok) {
      const { pushed, pulled } = result.value;
      Alert.alert('Sincronização concluída', `Enviados: ${pushed}\nRecebidos: ${pulled}`);
    } else {
      Alert.alert('Não foi possível sincronizar', result.error.message);
    }
  };

  return {
    email: user.email,
    userId: user.id,
    sync,
    syncNow: syncAndReport,
    confirmSignOut,
  };
}
