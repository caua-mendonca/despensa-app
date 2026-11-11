import type { Clock, IdGenerator } from '@/core/utils/providers';
import type { PantryItemDraft } from '../entities/PantryItem';
import { CreatePantryItemUseCase } from '../usecases/CreatePantryItemUseCase';
import { DeletePantryItemUseCase } from '../usecases/DeletePantryItemUseCase';
import { GetDashboardSummaryUseCase } from '../usecases/GetDashboardSummaryUseCase';
import { ListPantryItemsUseCase } from '../usecases/ListPantryItemsUseCase';
import { UpdatePantryItemUseCase } from '../usecases/UpdatePantryItemUseCase';
import { InMemoryPantryRepository } from './InMemoryPantryRepository';

const USER_ID = 'user-1';
const fixedClock: Clock = { now: () => new Date(2026, 8, 15, 10, 0) };

const sequentialIds = (): IdGenerator => {
  let counter = 0;
  return { generate: () => `item-${++counter}` };
};

const draft = (overrides: Partial<PantryItemDraft> = {}): PantryItemDraft => ({
  name: 'Leite integral',
  category: 'dairy',
  storageLocation: 'fridge',
  quantity: 2,
  unit: 'l',
  expirationDate: '2026-09-20',
  notes: '',
  barcode: null,
  ...overrides,
});

describe('Casos de uso da despensa', () => {
  let repository: InMemoryPantryRepository;
  let create: CreatePantryItemUseCase;

  beforeEach(() => {
    repository = new InMemoryPantryRepository();
    create = new CreatePantryItemUseCase(repository, sequentialIds(), fixedClock);
  });

  describe('CreatePantryItemUseCase', () => {
    it('cria o item pendente de sincronização, com trim e notas nulas', async () => {
      const result = await create.execute(USER_ID, draft({ name: '  Leite integral  ' }));

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toMatchObject({
        id: 'item-1',
        userId: USER_ID,
        name: 'Leite integral',
        notes: null,
        syncStatus: 'pending',
        deletedAt: null,
      });
      expect(repository.items.size).toBe(1);
    });

    it('retorna erros por campo quando a entrada é inválida', async () => {
      const result = await create.execute(
        USER_ID,
        draft({ name: 'a', category: null, quantity: 0, expirationDate: '2026-02-30' }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
      expect(Object.keys(result.error.fieldErrors ?? {})).toEqual(
        expect.arrayContaining(['name', 'category', 'quantity', 'expirationDate']),
      );
      expect(repository.items.size).toBe(0);
    });
  });

  it('UpdatePantryItemUseCase atualiza campos e o updatedAt', async () => {
    await create.execute(USER_ID, draft());
    const later: Clock = { now: () => new Date(2026, 8, 16, 9, 0) };
    const update = new UpdatePantryItemUseCase(repository, later);

    const result = await update.execute(USER_ID, 'item-1', draft({ quantity: 1 }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.quantity).toBe(1);
    expect(result.value.updatedAt).toBe(later.now().toISOString());
  });

  it('UpdatePantryItemUseCase não permite editar item de outro usuário', async () => {
    await create.execute(USER_ID, draft());
    const update = new UpdatePantryItemUseCase(repository, fixedClock);

    const result = await update.execute('outro-usuario', 'item-1', draft());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('DeletePantryItemUseCase faz exclusão lógica', async () => {
    await create.execute(USER_ID, draft());
    const remove = new DeletePantryItemUseCase(repository, fixedClock);

    await remove.execute(USER_ID, 'item-1');

    expect(repository.items.get('item-1')?.deletedAt).not.toBeNull();
    expect(await repository.list(USER_ID)).toHaveLength(0);
  });

  it('ListPantryItemsUseCase filtra por status de validade', async () => {
    await create.execute(USER_ID, draft({ name: 'Iogurte', expirationDate: '2026-09-10' }));
    await create.execute(USER_ID, draft({ name: 'Queijo', expirationDate: '2026-09-17' }));
    await create.execute(USER_ID, draft({ name: 'Arroz', expirationDate: '2027-01-01' }));
    const list = new ListPantryItemsUseCase(repository, fixedClock);

    const expired = await list.execute(USER_ID, { status: 'expired' });

    expect(expired.ok && expired.value.map((item) => item.name)).toEqual(['Iogurte']);
  });

  it('GetDashboardSummaryUseCase agrupa os itens por status', async () => {
    await create.execute(USER_ID, draft({ name: 'Iogurte', expirationDate: '2026-09-10' }));
    await create.execute(USER_ID, draft({ name: 'Queijo', expirationDate: '2026-09-17' }));
    await create.execute(USER_ID, draft({ name: 'Presunto', expirationDate: '2026-09-15' }));
    await create.execute(USER_ID, draft({ name: 'Arroz', expirationDate: '2027-01-01' }));
    const summary = new GetDashboardSummaryUseCase(repository, fixedClock);

    const result = await summary.execute(USER_ID);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ total: 4, expired: 1, expiringSoon: 2, ok: 1 });
    expect(result.value.attentionItems.map((item) => item.name)).toEqual([
      'Iogurte',
      'Presunto',
      'Queijo',
    ]);
  });
});
