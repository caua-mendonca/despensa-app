import type { PantryItemRemoteInsert, PantryItemRemoteRow } from '@/infra/supabase/database.types';
import type {
  Category,
  PantryItem,
  StorageLocation,
  SyncStatus,
  Unit,
} from '../../domain/entities/PantryItem';

/** Linha da tabela `pantry_items` no SQLite. */
export type PantryItemLocalRow = PantryItemRemoteRow & {
  sync_status: SyncStatus;
};

/**
 * O Postgres devolve timestamps com microssegundos e offset (`+00:00`).
 * Normalizamos para ISO-8601 em UTC (`...Z`) para comparar strings no SQLite.
 */
export const normalizeTimestamp = (value: string): string => new Date(value).toISOString();

const normalizeNullableTimestamp = (value: string | null) =>
  value ? normalizeTimestamp(value) : null;

export const pantryItemMapper = {
  fromLocalRow(row: PantryItemLocalRow): PantryItem {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      category: row.category as Category,
      storageLocation: row.storage_location as StorageLocation,
      quantity: row.quantity,
      unit: row.unit as Unit,
      expirationDate: row.expiration_date,
      notes: row.notes,
      barcode: row.barcode ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status,
    };
  },

  toLocalRow(item: PantryItem): PantryItemLocalRow {
    return {
      id: item.id,
      user_id: item.userId,
      name: item.name,
      category: item.category,
      storage_location: item.storageLocation,
      quantity: item.quantity,
      unit: item.unit,
      expiration_date: item.expirationDate,
      notes: item.notes,
      barcode: item.barcode,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      deleted_at: item.deletedAt,
      sync_status: item.syncStatus,
    };
  },

  /** Registro recebido do Supabase → linha local já sincronizada. */
  remoteToLocalRow(row: PantryItemRemoteRow): PantryItemLocalRow {
    return {
      ...row,
      barcode: row.barcode ?? null,
      quantity: Number(row.quantity),
      created_at: normalizeTimestamp(row.created_at),
      updated_at: normalizeTimestamp(row.updated_at),
      deleted_at: normalizeNullableTimestamp(row.deleted_at),
      sync_status: 'synced',
    };
  },

  /** Linha local pendente → payload de upsert no Supabase. */
  localRowToRemote(row: PantryItemLocalRow): PantryItemRemoteInsert {
    const { sync_status: _syncStatus, updated_at: _updatedAt, ...remote } = row;
    return remote;
  },
};
