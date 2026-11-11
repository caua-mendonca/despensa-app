import type { ProductCatalogLookup } from '@/features/pantry/domain/usecases/LookupProductByBarcodeUseCase';

const TIMEOUT_MS = 8000;

/** Bases abertas da mesma família (alimentos, produtos gerais e higiene/beleza). */
const HOSTS = [
  'world.openfoodfacts.org',
  'world.openproductsfacts.org',
  'world.openbeautyfacts.org',
];

type CatalogProduct = { name: string | null; categoryTags: string[] };

/** O scanner pode devolver UPC-A (12) sem o zero inicial do EAN-13; testamos as variações. */
const candidateCodes = (barcode: string): string[] => {
  const codes = new Set([barcode]);
  if (barcode.length < 13) codes.add(barcode.padStart(13, '0'));
  if (barcode.length === 13 && barcode.startsWith('0')) codes.add(barcode.slice(1));
  return [...codes];
};

async function fetchProduct(host: string, code: string): Promise<CatalogProduct | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://${host}/api/v2/product/${code}.json?fields=product_name,product_name_pt,generic_name,brands,categories_tags`,
      { signal: controller.signal, headers: { 'User-Agent': 'ValidaJa/1.0 (projeto academico)' } },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as {
      status?: number;
      product?: {
        product_name?: string;
        product_name_pt?: string;
        generic_name?: string;
        brands?: string;
        categories_tags?: string[];
      };
    };
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    const base = p.product_name_pt || p.product_name || p.generic_name || '';
    const brand = p.brands?.split(',')[0]?.trim();
    const name = brand && base && !base.toLowerCase().includes(brand.toLowerCase()) ? `${base} ${brand}` : base;
    if (!name.trim()) return null;
    return { name: name.trim(), categoryTags: p.categories_tags ?? [] };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Consulta catálogos públicos pelo código de barras. Retorna `null` se o produto
 * não existe nas bases e lança erro se nenhuma consulta conseguiu falar com o servidor (offline).
 */
export const openFoodFactsLookup: ProductCatalogLookup = async (barcode) => {
  // Só códigos numéricos (EAN/UPC) existem nos catálogos; QR livre não é consultado.
  if (!/^\d{6,14}$/.test(barcode)) return null;

  let reachedServer = false;
  for (const host of HOSTS) {
    for (const code of candidateCodes(barcode)) {
      try {
        const product = await fetchProduct(host, code);
        reachedServer = true;
        if (product) return product;
      } catch {
        // timeout/sem rede nesta tentativa; segue para a próxima
      }
    }
  }
  if (!reachedServer) throw new Error('catalog-unreachable');
  return null;
};
