import { create } from 'zustand';

import type { User } from '../../domain/entities/User';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionState {
  status: SessionStatus;
  user: User | null;
  /**
   * Último usuário autenticado. Mantido após o logout para que as telas
   * protegidas não quebrem durante a transição de navegação.
   */
  lastUser: User | null;
  setUser: (user: User | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  user: null,
  lastUser: null,
  setUser: (user) =>
    set((state) => ({
      user,
      lastUser: user ?? state.lastUser,
      status: user ? 'authenticated' : 'unauthenticated',
    })),
}));

/** Usuário logado — para uso dentro das rotas protegidas. */
export function useCurrentUser(): User {
  const user = useSessionStore((state) => state.user ?? state.lastUser);
  if (!user) throw new Error('useCurrentUser chamado fora de uma rota autenticada.');
  return user;
}
