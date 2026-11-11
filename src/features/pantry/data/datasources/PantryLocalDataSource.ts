import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import type { PantryItemQuery } from '../../domain/repositories/PantryRepository';
import type { PantryItemLocalRow } from '../mappers/pantryItemMapper';

const COLUMNS = `id, user_id, name, category, storage_location, quantity, unit,
  expiration_date, notes, barcode, created_at, updated_at, deleted_at, sync_status`;

const VALUES = `$id, $user_id, $name, $category, $storage_location, $quantity, $unit,
  $expiration_date, $notes, $barcode, $created_at, $updated_at, $deleted_at, $sync_status`;

const UPDATE_SET = `
  name = excluded.name,
  category = excluded.category,
  storage_location = excluded.storage_location,
  quantity = excluded.quantity,
  unit = excluded.unit,
  expiration_date = excluded.expiration_date,
  notes = excluded.notes,
  barcode = excluded.barcode,
  updated_at = excluded.updated_at,
  deleted_at = excluded.deleted_at,
  sync_status = excluded.sync_status`;

/** Exibida na tela de inspeção para mostrar a consulta real executada no SQLite. */
export const FIND_ALL_RAW_SQL = 'SELECT * FROM pantry_items WHERE user_id = ? ORDER BY updated_at DESC';

const toParams =(row: PantryItemLocalRow): Record<string, SQLiteBindValue> => ({
  $id: row.id,
  $user_id: row.user_id,
  $name: row.name,
  $category: row.category,
  $storage_location: row.storage_location,
  $quantity: row.quantity,
  $unit: row.unit,
  $expiration_date: row.expiration_date,
  $notes: row.notes,
  $barcode: row.barcode,
  $created_at: row.created_at,
  $updated_at: row.updated_at,
  $deleted_at: row.deleted_at,
  $sync_status: row.sync_status,
});

/** Acesso ao SQLite (Expo SQLite). Toda query usa parâmetros — nada de concatenação. */
export class PantryLocalDataSource {
  constructor(private readonly db: SQLiteDatabase) {}

  findAll(userId: string, query: PantryItemQuery = {}): Promise<PantryItemLocalRow[]> {
    const conditions = ['user_id = ?', 'deleted_at IS NULL'];
    const params: SQLiteBindValue[] = [userId];

    if (query.search?.trim()) {
      conditions.push('name LIKE ?');
      params.push(`%${query.search.trim()}%`);
    }
    if (query.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }
    if (query.storageLocation) {
      conditions.push('storage_location = ?');
      params.push(query.storageLocation);
    }

    return this.db.getAllAsync<PantryItemLocalRow>(
      `SELECT ${COLUMNS} FROM pantry_items
       WHERE ${conditions.join(' AND ')}
       ORDER BY expiration_date ASC, name COLLATE NOCASE ASC`,
      params,
    );
  }

  findById(userId: string, id: string): Promise<PantryItemLocalRow | null> {
    return this.db.getFirstAsync<PantryItemLocalRow>(
      `SELECT ${COLUMNS} FROM pantry_items WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [id, userId],
    );
  }

  findByBarcode(userId: string, barcode: string): Promise<PantryItemLocalRow | null> {
    return this.db.getFirstAsync<PantryItemLocalRow>(
      `SELECT ${COLUMNS} FROM pantry_items
       WHERE user_id = ? AND barcode = ? AND deleted_at IS NULL
       ORDER BY updated_at DESC LIMIT 1`,
      [userId, barcode],
    );
  }

  async upsert(row: PantryItemLocalRow): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO pantry_items (${COLUMNS}) VALUES (${VALUES})
       ON CONFLICT(id) DO UPDATE SET ${UPDATE_SET}`,
      toParams(row),
    );
  }

  async softDelete(userId: string, id: string, deletedAt: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE pantry_items
       SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
       WHERE id = ? AND user_id = ?`,
      [deletedAt, deletedAt, id, userId],
    );
  }

  // ---- Operações usadas pela sincronização ----

  findPending(userId: string): Promise<PantryItemLocalRow[]> {
    return this.db.getAllAsync<PantryItemLocalRow>(
      `SELECT ${COLUMNS} FROM pantry_items WHERE user_id = ? AND sync_status = 'pending'`,
      [userId],
    );
  }

  async countPending(userId: string): Promise<number> {
    const row = await this.db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total FROM pantry_items WHERE user_id = ? AND sync_status = 'pending'`,
      [userId],
    );
    return row?.total ?? 0;
  }

  /**
   * Marca como sincronizado somente se o registro não foi alterado
   * durante o envio (mesmo `updated_at`), evitando perder edições concorrentes.
   */
  async markSynced(rows: Pick<PantryItemLocalRow, 'id' | 'updated_at'>[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db.withExclusiveTransactionAsync(async (txn) => {
      for (const row of rows) {
        await txn.runAsync(
          `UPDATE pantry_items SET sync_status = 'synced' WHERE id = ? AND updated_at = ?`,
          [row.id, row.updated_at],
        );
      }
    });
  }

  /**
   * Aplica registros vindos do servidor. O pull traz sempre o estado atual do
   * servidor (em ordem do cursor), então ele prevalece sobre linhas `synced` —
   * sem comparar com o `updated_at` local, que usa o relógio do aparelho e
   * poderia estar adiantado. Linhas ainda `pending` (editadas após o push) são
   * preservadas e sobem no próximo envio.
   */
  async applyRemoteChanges(rows: PantryItemLocalRow[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db.withExclusiveTransactionAsync(async (txn) => {
      for (const row of rows) {
        await txn.runAsync(
          `INSERT INTO pantry_items (${COLUMNS}) VALUES (${VALUES})
           ON CONFLICT(id) DO UPDATE SET ${UPDATE_SET}
           WHERE pantry_items.sync_status = 'synced'`,
          toParams(row),
        );
      }
    });
  }

  /** Todas as linhas do usuário, inclusive excluídas — usado na tela de inspeção do banco. */
  findAllRaw(userId: string): Promise<PantryItemLocalRow[]> {
    return this.db.getAllAsync<PantryItemLocalRow>(FIND_ALL_RAW_SQL, [userId]);
  }
}
