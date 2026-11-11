import type { Category, PantryItem, StorageLocation } from '../entities/PantryItem';

export interface PantryItemQuery {
  search?: string;
  category?: Category;
  storageLocation?: StorageLocation;
}

/**
 * Contrato de persistência dos itens. A implementação é offline-first:
 * lê e grava no SQLite e deixa o envio ao Supabase para a sincronização.
 */
export interface PantryRepository {
  list(userId: string, query?: PantryItemQuery): Promise<PantryItem[]>;
  getById(userId: string, id: string): Promise<PantryItem | null>;
  /** Busca um item ativo pelo código de barras/QR lido pela câmera. */
  findByBarcode(userId: string, barcode: string): Promise<PantryItem | null>;
  /** Insere ou atualiza o item e o marca como pendente de sincronização. */
  save(item: PantryItem): Promise<void>;
  /** Exclusão lógica (soft delete), para que a remoção também seja sincronizada. */
  softDelete(userId: string, id: string, deletedAt: string): Promise<void>;
}
