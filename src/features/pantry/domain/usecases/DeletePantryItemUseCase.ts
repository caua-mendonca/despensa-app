import { runCatching, type Result } from '@/core/errors/Result';
import type { Clock } from '@/core/utils/providers';
import type { PantryRepository } from '../repositories/PantryRepository';

export class DeletePantryItemUseCase {
  constructor(
    private readonly repository: PantryRepository,
    private readonly clock: Clock,
  ) {}

  execute(userId: string, id: string): Promise<Result<void>> {
    const deletedAt = this.clock.now().toISOString();
    return runCatching(() => this.repository.softDelete(userId, id, deletedAt), 'DATABASE');
  }
}
