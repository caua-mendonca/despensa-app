import type { PantryItem } from '../entities/PantryItem';
import type { PantryItemQuery, PantryRepository } from '../repositories/PantryRepository';

/** Implementação em memória do repositório, usada para testar os casos de uso isoladamente. */
export class InMemoryPantryRepository implements PantryRepository {
  readonly items = new Map<string, PantryItem>();

  async list(userId: string, query: PantryItemQuery = {}): Promise<PantryItem[]> {
    return [...this.items.values()]
      .filter((item) => item.userId === userId && !item.deletedAt)
      .filter((item) => !query.category || item.category === query.category)
      .filter((item) => !query.search || item.name.toLowerCase().includes(query.search.toLowerCase()))
      .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
  }

  async getById(userId: string, id: string): Promise<PantryItem | null> {
    const item = this.items.get(id);
    return item && item.userId === userId && !item.deletedAt ? item : null;
  }

  async findByBarcode(userId: string, barcode: string): Promise<PantryItem | null> {
    return (
      [...this.items.values()].find(
        (item) => item.userId === userId && item.barcode === barcode && !item.deletedAt,
      ) ?? null
    );
  }

  async save(item: PantryItem): Promise<void> {
    this.items.set(item.id, { ...item, syncStatus: 'pending' });
  }

  async softDelete(userId: string, id: string, deletedAt: string): Promise<void> {
    const item = this.items.get(id);
    if (item && item.userId === userId) {
      this.items.set(id, { ...item, deletedAt, updatedAt: deletedAt, syncStatus: 'pending' });
    }
  }
}
