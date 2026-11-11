import { ChangeNotifier } from '@/core/events/ChangeNotifier';
import type { PantryLocalDataSource } from '@/features/pantry/data/datasources/PantryLocalDataSource';
import type { PantryRemoteDataSource } from '@/features/pantry/data/datasources/PantryRemoteDataSource';
import type { PantryItemLocalRow } from '@/features/pantry/data/mappers/pantryItemMapper';
import type { NetworkMonitor } from '@/infra/network/NetworkMonitor';
import type { PantryItemRemoteRow } from '@/infra/supabase/database.types';
import type { SyncMetaLocalDataSource } from '../SyncMetaLocalDataSource';
import { SyncServiceImpl } from '../SyncServiceImpl';

const localRow = (id: string): PantryItemLocalRow => ({
  id,
  user_id: 'user-1',
  name: `Item ${id}`,
  category: 'dairy',
  storage_location: 'fridge',
  quantity: 1,
  unit: 'un',
  expiration_date: '2026-09-20',
  notes: null,
  barcode: null,
  created_at: '2026-09-15T10:00:00.000Z',
  updated_at: '2026-09-15T10:00:00.000Z',
  deleted_at: null,
  sync_status: 'pending',
});

const remoteRow = (id: string, updatedAt: string): PantryItemRemoteRow => {
  const { sync_status: _ignored, ...row } = localRow(id);
  return { ...row, updated_at: updatedAt };
};

function setup({ online = true, pending = [] as PantryItemLocalRow[], remote = [] as PantryItemRemoteRow[] } = {}) {
  const meta = new Map<string, string>();
  const local = {
    findPending: jest.fn(async () => pending),
    markSynced: jest.fn(async () => undefined),
    applyRemoteChanges: jest.fn(async () => undefined),
    countPending: jest.fn(async () => 0),
  };
  const remoteDs = {
    upsert: jest.fn(async () => undefined),
    fetchChangedSince: jest.fn(async (_userId: string, since: string | null) =>
      remote.filter((row) => !since || row.updated_at > since),
    ),
  };
  const metaDs = {
    get: jest.fn(async (key: string) => meta.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => void meta.set(key, value)),
  };
  const network: NetworkMonitor = { isOnline: async () => online, subscribe: () => () => undefined };
  const changes = new ChangeNotifier();
  const notified = jest.fn();
  changes.subscribe(notified);

  const service = new SyncServiceImpl(
    local as unknown as PantryLocalDataSource,
    remoteDs as unknown as PantryRemoteDataSource,
    metaDs as unknown as SyncMetaLocalDataSource,
    network,
    changes,
    { now: () => new Date('2026-09-15T12:00:00.000Z') },
  );
  return { service, local, remoteDs, meta, notified };
}

describe('SyncServiceImpl', () => {
  it('envia pendentes sem o sync_status e marca como sincronizados', async () => {
    const { service, local, remoteDs, notified } = setup({ pending: [localRow('a'), localRow('b')] });

    const result = await service.sync('user-1');

    expect(result.ok && result.value).toMatchObject({ pushed: 2, pulled: 0 });
    const [payload] = remoteDs.upsert.mock.calls[0] as unknown as [Record<string, unknown>[]];
    expect(payload[0]).not.toHaveProperty('sync_status');
    expect(local.markSynced).toHaveBeenCalledWith([localRow('a'), localRow('b')]);
    expect(notified).toHaveBeenCalledWith('remote');
  });

  it('baixa alterações remotas e avança o cursor', async () => {
    const remote = [
      remoteRow('a', '2026-09-15T11:00:00.123456+00:00'),
      remoteRow('b', '2026-09-15T11:30:00.654321+00:00'),
    ];
    const { service, local, meta } = setup({ remote });

    const first = await service.sync('user-1');
    const second = await service.sync('user-1');

    expect(first.ok && first.value.pulled).toBe(2);
    expect(second.ok && second.value.pulled).toBe(0);
    expect(meta.get('last_pulled_at:user-1')).toBe('2026-09-15T11:30:00.654321+00:00');
    const [applied] = local.applyRemoteChanges.mock.calls[0] as unknown as [PantryItemLocalRow[]];
    expect(applied[0]).toMatchObject({ sync_status: 'synced', updated_at: '2026-09-15T11:00:00.123Z' });
  });

  it('não sincroniza sem conexão', async () => {
    const { service, remoteDs } = setup({ online: false, pending: [localRow('a')] });

    const result = await service.sync('user-1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NETWORK');
    expect(remoteDs.upsert).not.toHaveBeenCalled();
  });

  it('reaproveita a sincronização em andamento (lock)', async () => {
    const { service, local } = setup({ pending: [localRow('a')] });

    await Promise.all([service.sync('user-1'), service.sync('user-1')]);

    expect(local.findPending).toHaveBeenCalledTimes(1);
  });

  it('retorna erro remoto sem marcar como sincronizado', async () => {
    const { service, local, remoteDs } = setup({ pending: [localRow('a')] });
    remoteDs.upsert.mockRejectedValueOnce(new Error('permission denied'));

    const result = await service.sync('user-1');

    expect(result.ok).toBe(false);
    expect(local.markSynced).not.toHaveBeenCalled();
  });
});
