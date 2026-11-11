import type { ChangeNotifier } from '@/core/events/ChangeNotifier';
import type { PantryItem } from '../../domain/entities/PantryItem';
import type { PantryItemQuery, PantryRepository } from '../../domain/repositories/PantryRepository';
import type { PantryLocalDataSource } from '../datasources/PantryLocalDataSource';
import { pantryItemMapper } from '../mappers/pantryItemMapper';

/**
 * Repositório offline-first: o SQLite é a fonte da verdade da UI.
 * Cada escrita avisa o `ChangeNotifier`, que dispara a sincronização e atualiza as telas.
 */
export class PantryRepositoryImpl implements PantryRepository {
  constructor(
    private readonly local: PantryLocalDataSource,
    private readonly changes: ChangeNotifier,
  ) {}

  async list(userId: string, query?: PantryItemQuery): Promise<PantryItem[]> {
    const rows = await this.local.findAll(userId, query);
    return rows.map(pantryItemMapper.fromLocalRow);
  }

  async getById(userId: string, id: string): Promise<PantryItem | null> {
    const row = await this.local.findById(userId, id);
    return row ? pantryItemMapper.fromLocalRow(row) : null;
  }

  async findByBarcode(userId: string, barcode: string): Promise<PantryItem | null> {
    const row = await this.local.findByBarcode(userId, barcode);
    return row ? pantryItemMapper.fromLocalRow(row) : null;
  }

  async save(item: PantryItem): Promise<void> {
    await this.local.upsert(pantryItemMapper.toLocalRow({ ...item, syncStatus: 'pending' }));
    this.changes.notify('local');
  }

  async softDelete(userId: string, id: string, deletedAt: string): Promise<void> {
    await this.local.softDelete(userId, id, deletedAt);
    this.changes.notify('local');
  }
}
