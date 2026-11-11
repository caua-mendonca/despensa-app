import type { Result } from '@/core/errors/Result';

export interface SyncReport {
  pushed: number;
  pulled: number;
  finishedAt: string;
}

export interface SyncService {
  /** Envia as alterações pendentes (push) e baixa as alterações remotas (pull). */
  sync(userId: string): Promise<Result<SyncReport>>;
  getPendingCount(userId: string): Promise<number>;
  getLastSyncedAt(userId: string): Promise<string | null>;
}
