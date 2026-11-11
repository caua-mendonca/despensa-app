/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { ChangeNotifier } from '@/core/events/ChangeNotifier';
import { SyncMetaLocalDataSource } from '@/features/sync/data/SyncMetaLocalDataSource';
import { SyncServiceImpl } from '@/features/sync/data/SyncServiceImpl';
import { LATEST_SCHEMA_VERSION, migrateDatabase } from '@/infra/database/migrations';
import type { PantryItemRemoteRow } from '@/infra/supabase/database.types';
import { PantryLocalDataSource } from '../datasources/PantryLocalDataSource';
import type { PantryRemoteDataSource } from '../datasources/PantryRemoteDataSource';
import type { PantryItemLocalRow } from '../mappers/pantryItemMapper';

/**
 * Adaptador mínimo da API assíncrona do expo-sqlite sobre o SQLite do Node,
 * para executar o SQL real do app (migrações e queries) nos testes.
 */
function createTestDatabase(): SQLiteDatabase {
  const raw = new DatabaseSync(':memory:');
  const bind = (params: unknown) =>
    Array.isArray(params) ? params : params === undefined ? [] : [params];
  const plain = <T>(row: unknown) => (row ? ({ ...(row as object) } as T) : null);

  const db = {
    execAsync: async (sql: string) => raw.exec(sql),
    runAsync: async (sql: string, params?: unknown) => raw.prepare(sql).run(...(bind(params) as never[])),
    getFirstAsync: async <T>(sql: string, params?: unknown) =>
      plain<T>(raw.prepare(sql).get(...(bind(params) as never[]))),
    getAllAsync: async <T>(sql: string, params?: unknown) =>
      raw.prepare(sql).all(...(bind(params) as never[])).map((row: unknown) => plain<T>(row) as T),
    withExclusiveTransactionAsync: async (task: (txn: unknown) => Promise<void>) => {
      raw.exec('BEGIN EXCLUSIVE');
      try {
        await task(db);
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return db as unknown as SQLiteDatabase;
}

const USER = 'user-1';

const row = (id: string, overrides: Partial<PantryItemLocalRow> = {}): PantryItemLocalRow => ({
  id,
  user_id: USER,
  name: `Item ${id}`,
  category: 'dairy',
  storage_location: 'fridge',
  quantity: 1,
  unit: 'un',
  expiration_date: '2026-10-05',
  notes: null,
  barcode: null,
  created_at: '2026-09-30T10:00:00.000Z',
  updated_at: '2026-09-30T10:00:00.000Z',
  deleted_at: null,
  sync_status: 'pending',
  ...overrides,
});

async function setup() {
  const db = createTestDatabase();
  await migrateDatabase(db);
  return { db, local: new PantryLocalDataSource(db) };
}

describe('SQLite local (migrações + PantryLocalDataSource)', () => {
  it('cria o schema e registra a versão em user_version', async () => {
    const { db } = await setup();
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );

    expect(version?.user_version).toBe(LATEST_SCHEMA_VERSION);
    expect(tables.map((t) => t.name)).toEqual(expect.arrayContaining(['pantry_items', 'sync_meta']));

    await migrateDatabase(db); // idempotente
  });

  it('faz CRUD, filtros e soft delete', async () => {
    const { local } = await setup();
    await local.upsert(row('a', { name: 'Leite', expiration_date: '2026-10-02' }));
    await local.upsert(row('b', { name: 'Arroz', category: 'grains', storage_location: 'pantry' }));
    await local.upsert(row('c', { name: 'Iogurte', user_id: 'outro-usuario' }));

    expect((await local.findAll(USER)).map((r) => r.id)).toEqual(['a', 'b']); // ordenado por validade
    expect((await local.findAll(USER, { search: 'lei' })).map((r) => r.id)).toEqual(['a']);
    expect((await local.findAll(USER, { category: 'grains' })).map((r) => r.id)).toEqual(['b']);
    expect((await local.findAll(USER, { storageLocation: 'fridge' })).map((r) => r.id)).toEqual(['a']);

    await local.upsert({ ...row('a'), name: 'Leite integral', quantity: 2 });
    expect(await local.findById(USER, 'a')).toMatchObject({ name: 'Leite integral', quantity: 2 });
    expect(await local.findById(USER, 'c')).toBeNull(); // isolamento por usuário

    await local.softDelete(USER, 'a', '2026-09-30T11:00:00.000Z');
    expect(await local.findById(USER, 'a')).toBeNull();
    expect((await local.findAllRaw(USER)).find((r) => r.id === 'a')).toMatchObject({
      deleted_at: '2026-09-30T11:00:00.000Z',
      sync_status: 'pending',
    });
  });

  it('markSynced não marca linha editada durante o envio', async () => {
    const { local } = await setup();
    const sent = row('a');
    await local.upsert(sent);
    await local.upsert(row('a', { name: 'Editado', updated_at: '2026-09-30T10:05:00.000Z' }));

    await local.markSynced([sent]);

    expect(await local.countPending(USER)).toBe(1);
  });

  it('pull aplica a versão do servidor sobre linhas sincronizadas', async () => {
    const { local } = await setup();
    // Relógio do aparelho adiantado: o updated_at local é maior que o do servidor.
    await local.upsert(row('a', { updated_at: '2026-09-30T12:30:00.000Z', sync_status: 'synced' }));

    await local.applyRemoteChanges([row('a', { name: 'Remoto', updated_at: '2026-09-30T12:00:00.000Z', sync_status: 'synced' })]);
    expect(await local.findById(USER, 'a')).toMatchObject({ name: 'Remoto', sync_status: 'synced' });

    await local.applyRemoteChanges([row('novo', { sync_status: 'synced' })]);
    expect(await local.findById(USER, 'novo')).not.toBeNull();
  });

  it('pull não sobrescreve edição local ainda pendente', async () => {
    const { local } = await setup();
    await local.upsert(row('a', { name: 'Editado offline', sync_status: 'pending' }));

    await local.applyRemoteChanges([row('a', { name: 'Servidor', updated_at: '2026-09-30T12:00:00.000Z', sync_status: 'synced' })]);

    expect(await local.findById(USER, 'a')).toMatchObject({ name: 'Editado offline', sync_status: 'pending' });
  });
});

describe('Sincronização com SQLite real', () => {
  it('preserva edição feita entre o push e o pull e a envia na sincronização seguinte', async () => {
    const { db, local } = await setup();
    const server = new Map<string, PantryItemRemoteRow>();
    let serverClock = Date.parse('2026-09-30T12:00:00.000Z');

    const remote = {
      upsert: jest.fn(async (rows: Omit<PantryItemRemoteRow, 'updated_at'>[]) => {
        for (const r of rows) server.set(r.id, { ...r, updated_at: new Date(serverClock++).toISOString() });
      }),
      fetchChangedSince: jest.fn(async (_userId: string, since: string | null) => {
        // Usuário edita o item no aparelho enquanto a sincronização está em andamento.
        if (!since) await local.upsert(row('a', { name: 'Editado durante sync', updated_at: '2026-09-30T10:01:00.000Z' }));
        return [...server.values()].filter((r) => !since || r.updated_at > since);
      }),
    };

    const sync = new SyncServiceImpl(
      local,
      remote as unknown as PantryRemoteDataSource,
      new SyncMetaLocalDataSource(db),
      { isOnline: async () => true, subscribe: () => () => undefined },
      new ChangeNotifier(),
      { now: () => new Date() },
    );

    await local.upsert(row('a'));
    await sync.sync(USER);

    expect(await local.findById(USER, 'a')).toMatchObject({ name: 'Editado durante sync', sync_status: 'pending' });

    await sync.sync(USER);

    expect(server.get('a')?.name).toBe('Editado durante sync');
    expect(await local.findById(USER, 'a')).toMatchObject({ name: 'Editado durante sync', sync_status: 'synced' });
    expect(await local.countPending(USER)).toBe(0);
  });
});
