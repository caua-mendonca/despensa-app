import type { User } from '../entities/User';

export interface SignUpOutcome {
  user: User | null;
  /** `true` quando o projeto Supabase exige confirmação de e-mail antes do login. */
  needsEmailConfirmation: boolean;
}

export interface AuthRepository {
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string): Promise<SignUpOutcome>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  /** Observa login/logout/refresh de sessão. Retorna a função de cancelamento. */
  onAuthStateChange(listener: (user: User | null) => void): () => void;
}
