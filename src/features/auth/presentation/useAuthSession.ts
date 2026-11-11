import { useEffect } from 'react';

import { useContainer } from '@/core/di/ContainerProvider';
import { useSessionStore } from './store/sessionStore';

/** Restaura a sessão persistida e mantém a store sincronizada com o Supabase Auth. */
export function useAuthSession() {
  const { authRepository } = useContainer();
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    const { setUser } = useSessionStore.getState();
    void authRepository.getCurrentUser().then(setUser);
    return authRepository.onAuthStateChange((user) => {
      // Evita re-render quando só o token foi renovado (mesmo usuário).
      if (useSessionStore.getState().user?.id !== user?.id) setUser(user);
    });
  }, [authRepository]);

  return status;
}
