import type { AuthError, User as SupabaseUser } from '@supabase/supabase-js';

import { AppError } from '@/core/errors/AppError';
import type { AppSupabaseClient } from '@/infra/supabase/client';
import type { User } from '../domain/entities/User';
import type { AuthRepository, SignUpOutcome } from '../domain/repositories/AuthRepository';

const toUser = (user: SupabaseUser): User => ({ id: user.id, email: user.email ?? '' });

const FRIENDLY_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha inválidos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  user_already_exists: 'Já existe uma conta com este e-mail.',
  email_exists: 'Já existe uma conta com este e-mail.',
  weak_password: 'Senha muito fraca. Use uma senha mais forte.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  over_email_send_rate_limit: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
};

/** Traduz os erros do Supabase Auth para mensagens amigáveis. */
function toAppError(error: AuthError): AppError {
  const message = (error.code && FRIENDLY_MESSAGES[error.code]) || error.message;
  const isNetworkError = error.name === 'AuthRetryableFetchError';
  return new AppError(
    isNetworkError ? 'NETWORK' : 'AUTH',
    isNetworkError ? 'Sem conexão com o servidor. Verifique sua internet.' : message,
    undefined,
    error,
  );
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw toAppError(error);
    return toUser(data.user);
  }

  async signUp(email: string, password: string): Promise<SignUpOutcome> {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw toAppError(error);
    return {
      user: data.user ? toUser(data.user) : null,
      needsEmailConfirmation: data.session === null,
    };
  }

  async signOut(): Promise<void> {
    // Escopo local: encerra a sessão no aparelho mesmo se estiver offline.
    const { error } = await this.supabase.auth.signOut({ scope: 'local' });
    if (error) throw toAppError(error);
  }

  async getCurrentUser(): Promise<User | null> {
    // getSession lê a sessão persistida localmente (funciona offline).
    const { data } = await this.supabase.auth.getSession();
    return data.session ? toUser(data.session.user) : null;
  }

  onAuthStateChange(listener: (user: User | null) => void): () => void {
    const { data } = this.supabase.auth.onAuthStateChange((_event, session) => {
      listener(session ? toUser(session.user) : null);
    });
    return () => data.subscription.unsubscribe();
  }
}
