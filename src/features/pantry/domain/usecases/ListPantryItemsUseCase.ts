import { runCatching, type Result } from '@/core/errors/Result';
import type { Clock } from '@/core/utils/providers';
import { getExpirationStatus, type ExpirationStatus } from '../entities/ExpirationStatus';
import type { PantryItem } from '../entities/PantryItem';
import type { PantryItemQuery, PantryRepository } from '../repositories/PantryRepository';

export interface ListPantryItemsFilter extends PantryItemQuery {
  status?: ExpirationStatus;
}

/** Lista os itens ordenados pela validade mais próxima, com filtro opcional por status. */
export class ListPantryItemsUseCase {
  constructor(
    private readonly repository: PantryRepository,
    private readonly clock: Clock,
  ) {}

  execute(userId: string, filter: ListPantryItemsFilter = {}): Promise<Result<PantryItem[]>> {
    const { status, ...query } = filter;
    return runCatching(async () => {
      const items = await this.repository.list(userId, query);
      if (!status) return items;
      const today = this.clock.now();
      return items.filter((item) => getExpirationStatus(item.expirationDate, today) === status);
    }, 'DATABASE');
  }
}
