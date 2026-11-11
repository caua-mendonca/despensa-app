export const CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'grains',
  'bakery',
  'canned',
  'frozen',
  'beverages',
  'cleaning',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STORAGE_LOCATIONS = ['pantry', 'fridge', 'freezer'] as const;
export type StorageLocation = (typeof STORAGE_LOCATIONS)[number];

export const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'pct'] as const;
export type Unit = (typeof UNITS)[number];

/** Estado de sincronização do registro local em relação ao Supabase. */
export type SyncStatus = 'synced' | 'pending';

export interface PantryItem {
  id: string;
  userId: string;
  name: string;
  category: Category;
  storageLocation: StorageLocation;
  quantity: number;
  unit: Unit;
  /** Data de validade no formato `YYYY-MM-DD`. */
  expirationDate: string;
  notes: string | null;
  /** Código de barras/QR lido pela câmera (visão computacional). */
  barcode: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatus;
}

/** Campos editáveis pelo usuário. */
export type PantryItemInput = Pick<
  PantryItem,
  'name' | 'category' | 'storageLocation' | 'quantity' | 'unit' | 'expirationDate' | 'notes' | 'barcode'
>;

/** Dados vindos do formulário, ainda não validados (campos podem estar vazios). */
export type PantryItemDraft = { [K in keyof PantryItemInput]: PantryItemInput[K] | null };
