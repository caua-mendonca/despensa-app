import { AppError } from '@/core/errors/AppError';
import type { AppSupabaseClient } from '@/infra/supabase/client';
import type { PantryItemRemoteInsert, PantryItemRemoteRow } from '@/infra/supabase/database.types';

const TABLE = 'pantry_items';

/** Acesso à tabela `pantry_items` no Supabase (PostgreSQL). O RLS garante o isolamento por usuário. */
export class PantryRemoteDataSource {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async upsert(rows: PantryItemRemoteInsert[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.supabase.from(TABLE).upsert(rows, { onConflict: 'id' });
    if (error) throw new AppError('REMOTE', `Falha ao enviar dados: ${error.message}`, undefined, error);
  }

  /** Busca alterações feitas após `since` (cursor baseado no relógio do servidor). */
  async fetchChangedSince(
    userId: string,
    since: string | null,
    limit: number,
  ): Promise<PantryItemRemoteRow[]> {
    let query = this.supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true })
      .limit(limit);

    if (since) query = query.gt('updated_at', since);

    const { data, error } = await query;
    if (error) throw new AppError('REMOTE', `Falha ao baixar dados: ${error.message}`, undefined, error);
    return data ?? [];
  }

  /** Todas as linhas do usuário no Supabase, inclusive excluídas — usado na tela de inspeção da nuvem. */
  async fetchAll(userId: string): Promise<PantryItemRemoteRow[]> {
    const { data, error } = await this.supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw new AppError('REMOTE', `Falha ao consultar o Supabase: ${error.message}`, undefined, error);
    return data ?? [];
  }
}
