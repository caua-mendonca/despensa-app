import { AppError } from '@/core/errors/AppError';
import { fail, runCatching, type Result } from '@/core/errors/Result';
import type { ChangeNotifier } from '@/core/events/ChangeNotifier';
import type { Clock } from '@/core/utils/providers';
import type { PantryLocalDataSource } from '@/features/pantry/data/datasources/PantryLocalDataSource';
import type { PantryRemoteDataSource } from '@/features/pantry/data/datasources/PantryRemoteDataSource';
import { pantryItemMapper } from '@/features/pantry/data/mappers/pantryItemMapper';
import type { NetworkMonitor } from '@/infra/network/NetworkMonitor';
import type { SyncReport, SyncService } from '../domain/SyncService';
import { syncMetaKeys, type SyncMetaLocalDataSource } from './SyncMetaLocalDataSource';

const PUSH_BATCH_SIZE = 100;
const PULL_PAGE_SIZE = 500;

/**
 * Sincronização offline-first entre SQLite e Supabase.
 *
 * 1. Push: envia as linhas `pending` (upsert) e as marca como `synced`.
 * 2. Pull: baixa as linhas alteradas desde o último cursor (`updated_at` do
 *    servidor) e aplica localmente com last-write-wins.
 */
export class SyncServiceImpl implements SyncService {
  private inFlight: Promise<Result<SyncReport>> | null = null;

  constructor(
    private readonly local: PantryLocalDataSource,
    private readonly remote: PantryRemoteDataSource,
    private readonly meta: SyncMetaLocalDataSource,
    private readonly network: NetworkMonitor,
    private readonly changes: ChangeNotifier,
    private readonly clock: Clock,
  ) {}

  /** Chamadas concorrentes reaproveitam a sincronização em andamento (lock). */
  sync(userId: string): Promise<Result<SyncReport>> {
    this.inFlight ??= this.runSync(userId).finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  getPendingCount(userId: string): Promise<number> {
    return this.local.countPending(userId);
  }

  getLastSyncedAt(userId: string): Promise<string | null> {
    return this.meta.get(syncMetaKeys.lastSyncedAt(userId));
  }

  private async runSync(userId: string): Promise<Result<SyncReport>> {
    if (!(await this.network.isOnline())) {
      return fail(new AppError('NETWORK', 'Sem conexão. Os dados continuam salvos no aparelho.'));
    }

    return runCatching(async () => {
      const pushed = await this.push(userId);
      const pulled = await this.pull(userId);
      const finishedAt = this.clock.now().toISOString();
      await this.meta.set(syncMetaKeys.lastSyncedAt(userId), finishedAt);
      if (pushed > 0 || pulled > 0) this.changes.notify('remote');
      return { pushed, pulled, finishedAt };
    }, 'REMOTE');
  }

  private async push(userId: string): Promise<number> {
    const pending = await this.local.findPending(userId);

    for (let start = 0; start < pending.length; start += PUSH_BATCH_SIZE) {
      const batch = pending.slice(start, start + PUSH_BATCH_SIZE);
      await this.remote.upsert(batch.map(pantryItemMapper.localRowToRemote));
      await this.local.markSynced(batch);
    }
    return pending.length;
  }

  private async pull(userId: string): Promise<number> {
    const cursorKey = syncMetaKeys.lastPulledAt(userId);
    let cursor = await this.meta.get(cursorKey);
    let total = 0;

    for (;;) {
      const page = await this.remote.fetchChangedSince(userId, cursor, PULL_PAGE_SIZE);
      if (page.length === 0) break;

      await this.local.applyRemoteChanges(page.map(pantryItemMapper.remoteToLocalRow));
      // Cursor bruto do servidor (preserva microssegundos do Postgres).
      cursor = page[page.length - 1].updated_at;
      await this.meta.set(cursorKey, cursor);
      total += page.length;

      if (page.length < PULL_PAGE_SIZE) break;
    }
    return total;
  }
}
