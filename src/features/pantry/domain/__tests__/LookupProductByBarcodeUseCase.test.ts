import type { PantryItem } from '../entities/PantryItem';
import {
  LookupProductByBarcodeUseCase,
  mapCategoryTags,
  type ProductCatalogLookup,
} from '../usecases/LookupProductByBarcodeUseCase';
import { InMemoryPantryRepository } from './InMemoryPantryRepository';

const USER = 'user-1';

const item = (barcode: string | null): PantryItem => ({
  id: 'i1',
  userId: USER,
  name: 'Leite',
  category: 'dairy',
  storageLocation: 'fridge',
  quantity: 1,
  unit: 'l',
  expirationDate: '2026-12-01',
  notes: null,
  barcode,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  deletedAt: null,
  syncStatus: 'pending',
});

describe('mapCategoryTags', () => {
  it('mapeia tags do Open Food Facts para categorias do app', () => {
    expect(mapCategoryTags(['en:dairies', 'en:milks'])).toBe('dairy');
    expect(mapCategoryTags(['en:beverages'])).toBe('beverages');
    expect(mapCategoryTags(['en:unknown-thing'])).toBeNull();
  });
});

describe('LookupProductByBarcodeUseCase', () => {
  const build = (catalog: ProductCatalogLookup) => {
    const repository = new InMemoryPantryRepository();
    return { repository, useCase: new LookupProductByBarcodeUseCase(repository, catalog) };
  };

  it('retorna o item existente quando o código já está cadastrado', async () => {
    const catalog = jest.fn();
    const { repository, useCase } = build(catalog);
    await repository.save(item('7891000100103'));

    const result = await useCase.execute(USER, ' 7891000100103 ');

    expect(result.ok && result.value.kind).toBe('existing');
    expect(catalog).not.toHaveBeenCalled();
  });

  it('sugere nome e categoria a partir do catálogo', async () => {
    const { useCase } = build(async () => ({ name: 'Leite Integral', categoryTags: ['en:dairies'] }));

    const result = await useCase.execute(USER, '7891000100103');

    expect(result.ok && result.value).toMatchObject({
      kind: 'suggestion',
      source: 'catalog',
      suggestion: { barcode: '7891000100103', name: 'Leite Integral', category: 'dairy' },
    });
  });

  it('devolve só o código quando o catálogo falha (offline)', async () => {
    const { useCase } = build(async () => {
      throw new Error('network');
    });

    const result = await useCase.execute(USER, '123');

    expect(result.ok && result.value).toMatchObject({
      kind: 'suggestion',
      source: 'offline',
      suggestion: { barcode: '123', name: null, category: null },
    });
  });

  it('indica "não encontrado" quando o catálogo responde sem o produto', async () => {
    const { useCase } = build(async () => null);

    const result = await useCase.execute(USER, '123');

    expect(result.ok && result.value).toMatchObject({ kind: 'suggestion', source: 'not-found' });
  });
});
