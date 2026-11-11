import { fail, ok, runCatching, type Result } from '@/core/errors/Result';
import type { Category, PantryItem } from '../entities/PantryItem';
import type { PantryRepository } from '../repositories/PantryRepository';

/** Dados do produto obtidos a partir do código lido pela câmera. */
export interface ProductSuggestion {
  barcode: string;
  name: string | null;
  category: Category | null;
}

export type BarcodeLookupResult =
  | { kind: 'existing'; item: PantryItem }
  | { kind: 'suggestion'; suggestion: ProductSuggestion; source: 'catalog' | 'not-found' | 'offline' };

/** Consulta de catálogo (Open Food Facts) — abstraída para permitir testes sem rede. */
export type ProductCatalogLookup = (
  barcode: string,
) => Promise<{ name: string | null; categoryTags: string[] } | null>;

const CATEGORY_KEYWORDS: [Category, string[]][] = [
  ['dairy', ['dairies', 'milk', 'cheese', 'yogurt', 'butter', 'cream']],
  ['meat', ['meat', 'fish', 'seafood', 'sausage', 'poultry', 'ham']],
  ['beverages', ['beverage', 'drink', 'juice', 'water', 'soda', 'coffee', 'tea', 'beer', 'wine']],
  ['frozen', ['frozen']],
  ['bakery', ['bread', 'bakery', 'biscuit', 'cake', 'cookie', 'pastr']],
  ['canned', ['canned', 'preserved', 'sauce', 'conserve']],
  ['grains', ['cereal', 'rice', 'pasta', 'bean', 'flour', 'grain', 'legume']],
  ['produce', ['fruit', 'vegetable', 'plant-based-foods']],
  ['cleaning', ['cleaning', 'detergent', 'household']],
];

/** Converte as tags de categoria do Open Food Facts para as categorias do app. */
export function mapCategoryTags(tags: string[]): Category | null {
  const joined = tags.join(' ').toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => joined.includes(keyword))) return category;
  }
  return null;
}

/** Normaliza o texto lido: remove espaços e limita o tamanho. */
export const normalizeBarcode = (raw: string): string => raw.trim().slice(0, 100);

/**
 * Caso de uso da Visão Computacional: a partir do código lido pela câmera,
 * 1) verifica se o produto já está na despensa (SQLite);
 * 2) senão, tenta identificar nome/categoria no catálogo online;
 * 3) senão, devolve só o código para o usuário completar manualmente (offline).
 */
export class LookupProductByBarcodeUseCase {
  constructor(
    private readonly repository: PantryRepository,
    private readonly catalog: ProductCatalogLookup,
  ) {}

  async execute(userId: string, rawBarcode: string): Promise<Result<BarcodeLookupResult>> {
    const barcode = normalizeBarcode(rawBarcode);

    const existing = await runCatching(() => this.repository.findByBarcode(userId, barcode), 'DATABASE');
    if (!existing.ok) return fail(existing.error);
    if (existing.value) return ok({ kind: 'existing', item: existing.value });

    let product: Awaited<ReturnType<ProductCatalogLookup>> = null;
    let offline = false;
    try {
      product = await this.catalog(barcode);
    } catch {
      offline = true; // sem rede/timeout: segue só com o código
    }

    if (product?.name) {
      return ok({
        kind: 'suggestion',
        source: 'catalog',
        suggestion: {
          barcode,
          name: product.name.trim().slice(0, 80),
          category: mapCategoryTags(product.categoryTags),
        },
      });
    }

    return ok({
      kind: 'suggestion',
      source: offline ? 'offline' : 'not-found',
      suggestion: { barcode, name: null, category: null },
    });
  }
}
