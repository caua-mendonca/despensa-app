import type { SQLiteDatabase } from 'expo-sqlite';

/** Armazena metadados de sincronização (cursor de pull, última sync) por usuário. */
export class SyncMetaLocalDataSource {
  constructor(private readonly db: SQLiteDatabase) {}

  async get(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_meta WHERE key = ?',
      [key],
    );
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO sync_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
    );
  }
}

export const syncMetaKeys = {
  lastPulledAt: (userId: string) => `last_pulled_at:${userId}`,
  lastSyncedAt: (userId: string) => `last_synced_at:${userId}`,
};
