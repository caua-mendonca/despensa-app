import type { SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  version: number;
  description: string;
  sql: string;
}

/**
 * Migrations versionadas via `PRAGMA user_version`. Para evoluir o schema,
 * adicione uma nova entrada no final — nunca altere uma migration já publicada.
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Cria tabela de itens da despensa e metadados de sincronização',
    sql: `
      CREATE TABLE IF NOT EXISTS pantry_items (
        id               TEXT PRIMARY KEY NOT NULL,
        user_id          TEXT NOT NULL,
        name             TEXT NOT NULL,
        category         TEXT NOT NULL,
        storage_location TEXT NOT NULL,
        quantity         REAL NOT NULL,
        unit             TEXT NOT NULL,
        expiration_date  TEXT NOT NULL,
        notes            TEXT,
        created_at       TEXT NOT NULL,
        updated_at       TEXT NOT NULL,
        deleted_at       TEXT,
        sync_status      TEXT NOT NULL DEFAULT 'pending'
      );

      CREATE INDEX IF NOT EXISTS idx_pantry_items_user_expiration
        ON pantry_items (user_id, deleted_at, expiration_date);

      CREATE INDEX IF NOT EXISTS idx_pantry_items_user_sync
        ON pantry_items (user_id, sync_status);

      CREATE TABLE IF NOT EXISTS sync_meta (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    description: 'Adiciona código de barras/QR (visão computacional) aos itens',
    sql: `
      ALTER TABLE pantry_items ADD COLUMN barcode TEXT;

      CREATE INDEX IF NOT EXISTS idx_pantry_items_user_barcode
        ON pantry_items (user_id, barcode);
    `,
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  const pending = MIGRATIONS.filter((migration) => migration.version > currentVersion);
  for (const migration of pending) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(migration.sql);
      await txn.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
